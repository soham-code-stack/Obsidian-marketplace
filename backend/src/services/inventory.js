const Product = require('../models/Product');

/**
 * INVENTORY CONCURRENCY STRATEGY
 * ------------------------------
 * When two buyers try to purchase the last unit of a product at nearly the
 * same time, a naive "read stock, check > 0, then save" flow has a race
 * condition: both requests can read stock=1 before either writes, and both
 * proceed to decrement, leaving stock at -1.
 *
 * We prevent this with an atomic, conditional update: the decrement only
 * succeeds if the stock in the database *at the moment of the write* still
 * satisfies the condition. MongoDB's findOneAndUpdate with a query filter
 * on `stock` is atomic at the document level, so this is safe even under
 * concurrent requests without needing explicit multi-document transactions.
 *
 * If the conditional update matches no document (because another request
 * already took the remaining stock), we throw and the caller must treat the
 * whole order as failed for that item.
 */

/**
 * Atomically decrements stock for a single product, but only if enough
 * stock is currently available. Returns the updated product on success.
 * Throws InsufficientStockError if the check fails.
 */
const decrementStock = async (productId, quantity) => {
  const updated = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity }, isActive: true },
    { $inc: { stock: -quantity, version: 1, popularity: quantity } },
    { new: true }
  );

  if (!updated) {
    const err = new Error('Insufficient stock — item may have just sold out');
    err.code = 'INSUFFICIENT_STOCK';
    err.productId = productId;
    throw err;
  }

  return updated;
};

/**
 * Restores stock — used when an order is cancelled/refunded, or when a
 * multi-item order partially fails and earlier successful decrements must
 * be rolled back (compensating action, since we're not using a multi-doc
 * transaction here).
 */
const restoreStock = async (productId, quantity) => {
  await Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { stock: quantity, version: 1, popularity: -quantity } }
  );
};

/**
 * Attempts to decrement stock for every item in an order atomically-per-item.
 * If any item fails, all previously succeeded decrements in this call are
 * rolled back (compensating transaction pattern) and the error is re-thrown.
 *
 * items: [{ product: ObjectId, quantity: Number }]
 */
const reserveStockForOrder = async (items) => {
  const succeeded = [];

  try {
    for (const item of items) {
      const updated = await decrementStock(item.product, item.quantity);
      succeeded.push({ productId: item.product, quantity: item.quantity });
    }
  } catch (error) {
    // Roll back everything that succeeded before the failure.
    for (const s of succeeded) {
      await restoreStock(s.productId, s.quantity);
    }
    throw error;
  }

  return true;
};

module.exports = { decrementStock, restoreStock, reserveStockForOrder };

