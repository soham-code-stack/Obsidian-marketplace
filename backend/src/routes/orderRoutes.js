const express = require('express');
const {
  createCheckoutSession,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateFulfillmentStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/checkout', createCheckoutSession);
router.get('/mine', getMyOrders);
router.get('/seller/mine', restrictTo('seller', 'admin'), getSellerOrders);
router.get('/:id', getOrderById);
router.patch('/:id/fulfillment', restrictTo('seller', 'admin'), updateFulfillmentStatus);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;