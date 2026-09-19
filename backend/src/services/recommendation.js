const Product = require('../models/Product');

/**
 * CONTENT-BASED RECOMMENDATION STRATEGY
 * --------------------------------------
 * For a marketplace at this scale, a full collaborative-filtering pipeline
 * (user-item matrices, matrix factorization) is overkill and needs purchase
 * history volume we won't have early on. Instead we use content-based
 * similarity, scored from:
 *   - Same category            -> strong signal
 *   - Shared tags               -> weighted by number of overlapping tags
 *   - Similar price band (+/-30%) -> weak signal (people often compare similar price points)
 *   - Popularity                -> small tiebreaker boost
 *
 * This mirrors the approach used for the Wavelength music recommender
 * (tag/genre overlap scoring), swapping genre/artist tags for product
 * category/tags.
 */

const scoreSimilarity = (base, candidate) => {
  let score = 0;

  if (candidate.category === base.category) score += 5;

  const baseTags = new Set(base.tags || []);
  const overlap = (candidate.tags || []).filter((t) => baseTags.has(t)).length;
  score += overlap * 2;

  const priceDiff = Math.abs(candidate.price - base.price) / (base.price || 1);
  if (priceDiff <= 0.3) score += 1;

  // Small log-scaled popularity boost so it never dominates relevance.
  score += Math.log1p(candidate.popularity || 0) * 0.1;

  return score;
};

/**
 * Returns up to `limit` products similar to the given product, excluding
 * itself and inactive/out-of-stock listings.
 */
const getSimilarProducts = async (productId, limit = 8) => {
  const base = await Product.findById(productId).lean();
  if (!base) return [];

  // Pull a reasonably sized candidate pool (same category OR sharing at
  // least one tag) rather than scanning the entire catalog.
  const candidates = await Product.find({
    _id: { $ne: base._id },
    isActive: true,
    stock: { $gt: 0 },
    $or: [{ category: base.category }, { tags: { $in: base.tags || [] } }],
  })
    .limit(200) // cap candidate pool for performance on large catalogs
    .lean();

  const scored = candidates
    .map((c) => ({ product: c, score: scoreSimilarity(base, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.product);
};

/**
 * "Recommended for you" on the homepage for a logged-in buyer, based on the
 * categories/tags of products they've previously ordered. Falls back to
 * globally popular products for new users with no order history.
 */
const getPersonalizedRecommendations = async (Order, userId, limit = 12) => {
  const pastOrders = await Order.find({ buyer: userId }).select('items.product').lean();
  const purchasedProductIds = pastOrders.flatMap((o) => o.items.map((i) => i.product));

  if (purchasedProductIds.length === 0) {
    return Product.find({ isActive: true, stock: { $gt: 0 } })
      .sort({ popularity: -1 })
      .limit(limit)
      .lean();
  }

  const purchased = await Product.find({ _id: { $in: purchasedProductIds } }).lean();
  const seenCategories = new Set(purchased.map((p) => p.category));
  const seenTags = new Set(purchased.flatMap((p) => p.tags || []));

  const candidates = await Product.find({
    _id: { $nin: purchasedProductIds },
    isActive: true,
    stock: { $gt: 0 },
    $or: [{ category: { $in: [...seenCategories] } }, { tags: { $in: [...seenTags] } }],
  })
    .limit(200)
    .lean();

  const scored = candidates
    .map((c) => {
      let score = 0;
      if (seenCategories.has(c.category)) score += 3;
      score += (c.tags || []).filter((t) => seenTags.has(t)).length;
      score += Math.log1p(c.popularity || 0) * 0.1;
      return { product: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.product);
};

module.exports = { getSimilarProducts, getPersonalizedRecommendations };

