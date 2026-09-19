const express = require('express');
const { createShop, getMyShop, getShopBySlug, updateMyShop } = require('../controllers/shopController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, restrictTo('seller', 'admin'), createShop);
router.get('/me', protect, restrictTo('seller', 'admin'), getMyShop);
router.patch('/me', protect, restrictTo('seller', 'admin'), updateMyShop);
router.get('/:slug', getShopBySlug);

module.exports = router;

