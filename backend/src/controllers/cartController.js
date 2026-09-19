const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Loads (or lazily creates) the cart for the current user, populated with
 * product details for display.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const populateCart = (cart) =>
  cart.populate({
    path: 'items.product',
    select: 'name images price stock isActive shop',
  });

/**
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await populateCart(cart);
  res.status(200).json({ success: true, cart });
});

/**
 * @route   POST /api/cart/items
 * @access  Private
 * body: { productId, quantity }
 */
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || quantity < 1) {
    res.status(400);
    throw new Error('productId and a positive quantity are required');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} unit(s) left in stock`);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, priceAtAdd: product.price });
  }

  await cart.save();
  await populateCart(cart);
  res.status(200).json({ success: true, cart });
});

/**
 * @route   PATCH /api/cart/items/:productId
 * @access  Private
 * body: { quantity }
 */
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('quantity must be a positive integer');
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }

  const product = await Product.findById(productId);
  if (!product || product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product?.stock ?? 0} unit(s) left in stock`);
  }

  item.quantity = quantity;
  await cart.save();
  await populateCart(cart);
  res.status(200).json({ success: true, cart });
});

/**
 * @route   DELETE /api/cart/items/:productId
 * @access  Private
 */
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await populateCart(cart);
  res.status(200).json({ success: true, cart });
});

/**
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.status(200).json({ success: true, cart });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };

