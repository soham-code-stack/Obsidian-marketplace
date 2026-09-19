const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const { reserveStockForOrder } = require('../services/inventory');

/**
 * @route   POST /api/webhooks/stripe
 * @access  Public (verified via Stripe signature, not auth middleware)
 *
 * IMPORTANT: this route must receive the RAW request body (not JSON-parsed)
 * for Stripe's signature verification to work — see app.js, where this route
 * is mounted with express.raw() BEFORE the global express.json() middleware.
 *
 * This is the single source of truth for "did the payment actually succeed?".
 * Stock is only decremented here, never at checkout-session-creation time,
 * so abandoned/failed payments never lock up inventory.
 */
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        await handlePaymentSucceeded(event.data.object);
        break;
      }
      case 'payment_intent.payment_failed': {
        await handlePaymentFailed(event.data.object);
        break;
      }
      default:
        // Unhandled event types are fine to ignore.
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Handler error: ${err.message}`);
    // Return 500 so Stripe retries delivery — important for transient DB errors.
    res.status(500).json({ received: false });
  }
};

const handlePaymentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus === 'paid') {
    // Already processed (webhook delivery can be duplicated) — idempotent no-op.
    return;
  }

  try {
    // Atomic, concurrency-safe decrement across all items in the order.
    await reserveStockForOrder(order.items.map((i) => ({ product: i.product, quantity: i.quantity })));
  } catch (err) {
    // Stock ran out between checkout-session creation and payment confirmation
    // (rare, but possible with slow buyers). Mark payment as paid but flag
    // fulfillment as cancelled so a human/admin can resolve it (e.g. refund).
    order.paymentStatus = 'paid';
    order.fulfillmentStatus = 'cancelled';
    await order.save();
    console.error(`[Webhook] Stock reservation failed for order ${orderId}: ${err.message}`);
    return;
  }

  order.paymentStatus = 'paid';
  await order.save();

  // Update per-shop cached stats for dashboard performance.
  const shopTotals = new Map();
  for (const item of order.items) {
    const key = item.shop.toString();
    const prev = shopTotals.get(key) || { revenue: 0, count: 0 };
    prev.revenue += item.price * item.quantity;
    prev.count += item.quantity;
    shopTotals.set(key, prev);
  }
  for (const [shopId, totals] of shopTotals) {
    await Shop.findByIdAndUpdate(shopId, {
      $inc: {
        'stats.totalRevenue': totals.revenue,
        'stats.totalSales': totals.count,
        'stats.totalOrders': 1,
      },
    });
  }

  // Clear the buyer's cart now that checkout is complete.
  await Cart.findOneAndUpdate({ user: order.buyer }, { items: [] });
};

const handlePaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
};

module.exports = { handleStripeWebhook };

