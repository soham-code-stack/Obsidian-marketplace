const asyncHandler = require('express-async-handler');
const { client, PRODUCTS_INDEX } = require('../config/meilisearch');
const Product = require('../models/Product');

const USE_MEILISEARCH = process.env.NODE_ENV !== 'production';

/**
 * @route   GET /api/search?q=...&category=...&minPrice=...&maxPrice=...&sort=...&page=...&limit=...
 * @access  Public
 *
 * Uses Meilisearch in development (fast, typo-tolerant, run locally via Docker).
 * Falls back to MongoDB's native text search in production, avoiding the cost
 * of a hosted Meilisearch instance for a demo/portfolio deployment.
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q = '', category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

  if (USE_MEILISEARCH) {
    const filters = ['isActive = true'];
    if (category) filters.push(`category = "${category}"`);
    if (minPrice) filters.push(`price >= ${Number(minPrice)}`);
    if (maxPrice) filters.push(`price <= ${Number(maxPrice)}`);

    const sortMap = {
      price_asc: ['price:asc'],
      price_desc: ['price:desc'],
      newest: ['createdAt:desc'],
      popular: ['popularity:desc'],
    };

    const index = client.index(PRODUCTS_INDEX);
    const results = await index.search(q, {
      filter: filters.join(' AND '),
      sort: sortMap[sort] || undefined,
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      hits: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // --- MongoDB text search fallback (production) ---
  const filter = { isActive: true };
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    popular: { popularity: -1 },
  };
  const sortOption = sortMap[sort] || (q ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

  const skip = (Number(page) - 1) * Number(limit);

  const [hits, estimatedTotalHits] = await Promise.all([
    Product.find(filter, q ? { score: { $meta: 'textScore' } } : {})
      .populate('shop', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    hits: hits.map((p) => ({ ...p, productId: p._id.toString(), shopName: p.shop?.name || '' })),
    estimatedTotalHits,
    page: Number(page),
    limit: Number(limit),
  });
});

module.exports = { searchProducts };
