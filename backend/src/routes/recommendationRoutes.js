const express = require('express');
const asyncHandler = require('express-async-handler');
const { getSimilarProducts, getPersonalizedRecommendations } = require('../services/recommendation');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/recommendations/similar/:productId
 * @access  Public
 */
router.get(
  '/similar/:productId',
  asyncHandler(async (req, res) => {
    const products = await getSimilarProducts(req.params.productId, Number(req.query.limit) || 8);
    res.status(200).json({ success: true, products });
  })
);

/**
 * @route   GET /api/recommendations/for-you
 * @access  Private
 */
router.get(
  '/for-you',
  protect,
  asyncHandler(async (req, res) => {
    const products = await getPersonalizedRecommendations(Order, req.user._id, Number(req.query.limit) || 12);
    res.status(200).json({ success: true, products });
  })
);

module.exports = router;

