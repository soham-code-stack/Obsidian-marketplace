const asyncHandler = require('express-async-handler');
const stripe = require('../config/stripe');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const { restoreStock } = require('../services/inventory');

const CANCEL_WINDOW_HOURS = 24;

/**
 * @route   POST /api/orders/checkout
 * @access  Private
 */
const createCheckoutSession = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`A product in your cart is no longer available`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Only ${product.stock} unit(s) of "${product.name}" left in stock`);
    }

    orderItems.push({
      product: product._id,
      shop: product.shop,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
    totalAmount += product.price * item.quantity;
  }

  const order = await Order.create({
    buyer: req.user._id,
    items: orderItems,
    totalAmount,
    currency: 'inr',
    paymentStatus: 'pending',
    shippingAddress: req.body.shippingAddress || {},
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'inr',
    metadata: { orderId: order._id.toString(), buyerId: req.user._id.toString() },
    automatic_payment_methods: { enabled: true },
  });

  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    orderId: order._id,
  });
});

/**
 * @route   GET /api/orders/mine
 * @access  Private (buyer)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, orders });
});

/**
 * @route   GET /api/orders/:id
 * @access  Private (buyer who owns it, seller of an item in it, or admin)
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isBuyer = order.buyer.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  let isSeller = false;
  if (!isBuyer && !isAdmin) {
    const shop = await Shop.findOne({ owner: req.user._id });
    isSeller = shop && order.items.some((i) => i.shop.equals(shop._id));
  }

  if (!isBuyer && !isAdmin && !isSeller) {
    res.status(403);
    throw new Error('You do not have permission to view this order');
  }

  res.status(200).json({ success: true, order });
});

/**
 * @route   GET /api/orders/seller/mine
 * @access  Private (seller)
 */
const getSellerOrders = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('No shop found for this account');
  }

  const orders = await Order.find({ 'items.shop': shop._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, orders });
});

/**
 * @route   PATCH /api/orders/:id/fulfillment
 * @access  Private (seller of an item in the order, or admin)
 */
const updateFulfillmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (req.user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: req.user._id });
    const ownsItem = shop && order.items.some((i) => i.shop.equals(shop._id));
    if (!ownsItem) {
      res.status(403);
      throw new Error('You do not have permission to update this order');
    }
  }

  order.fulfillmentStatus = status;
  await order.save();

  res.status(200).json({ success: true, order });
});

/**
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private (buyer who owns the order)
 *
 * Buyer-initiated cancellation, only allowed:
 *   - within CANCEL_WINDOW_HOURS of the order being placed
 *   - while the order is still in 'processing' status (not yet shipped)
 *
 * If the order was paid, a Stripe refund is issued (best-effort — a refund
 * API failure does not block the cancellation itself, since a human can
 * always process the refund manually from the Stripe dashboard afterward).
 * Stock for every item in the order is restored back to each product.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.buyer.equals(req.user._id)) {
    res.status(403);
    throw new Error('You do not have permission to cancel this order');
  }

  if (order.fulfillmentStatus !== 'processing') {
    res.status(400);
    throw new Error('This order can no longer be cancelled');
  }

  const hoursSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceOrder > CANCEL_WINDOW_HOURS) {
    res.status(400);
    throw new Error('The 24-hour cancellation window has passed');
  }

  if (order.paymentStatus === 'paid' && order.stripePaymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
      order.paymentStatus = 'refunded';
    } catch (err) {
      console.error(`[CancelOrder] Stripe refund failed for order ${order._id}: ${err.message}`);
      // Continue cancelling even if the refund call itself fails.
    }
  }

  order.fulfillmentStatus = 'cancelled';
  await order.save();

  for (const item of order.items) {
    await restoreStock(item.product, item.quantity);
  }

  res.status(200).json({ success: true, order });
});

module.exports = {
  createCheckoutSession,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateFulfillmentStatus,
  cancelOrder,
};