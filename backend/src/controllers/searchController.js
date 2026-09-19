const asyncHandler = require('express-async-handler');
const { client, PRODUCTS_INDEX } = require('../config/meilisearch');

/**
 * @route   GET /api/search?q=...&category=...&minPrice=...&maxPrice=...&sort=...&page=...&limit=...
 * @access  Public
 *
 * Thin proxy over Meilisearch so the frontend never talks to Meilisearch directly
 * (keeps the master API key server-side only).
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q = '', category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

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

  res.status(200).json({
    success: true,
    hits: results.hits,
    estimatedTotalHits: results.estimatedTotalHits,
    page: Number(page),
    limit: Number(limit),
  });
});

module.exports = { searchProducts };

