const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Payment routes will fail until it is configured.');
}

// apiVersion pinned for predictable behavior across Stripe SDK upgrades.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
});

module.exports = stripe;

