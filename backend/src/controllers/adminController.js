const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * @route   GET /api/admin/overview
 * @access  Private (admin)
 */
const getOverview = asyncHandler(async (req, res) => {
  const [userCount, shopCount, productCount, orderStats] = await Promise.all([
    User.countDocuments(),
    Shop.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    overview: {
      userCount,
      shopCount,
      productCount,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      totalOrders: orderStats[0]?.totalOrders || 0,
    },
  });
});

/**
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, users });
});

/**
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (admin)
 * body: { isActive: boolean } — used to deactivate abusive accounts
 */
const setUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, user: user.toSafeObject() });
});

/**
 * @route   PATCH /api/admin/shops/:id/approval
 * @access  Private (admin)
 * body: { isApproved: boolean } — gate new shops before they go public
 */
const setShopApproval = asyncHandler(async (req, res) => {
  const { isApproved } = req.body;
  const shop = await Shop.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  res.status(200).json({ success: true, shop });
});

module.exports = { getOverview, listUsers, setUserActiveStatus, setShopApproval };

