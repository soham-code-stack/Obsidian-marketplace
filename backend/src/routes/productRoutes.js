const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getCategories,
} = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Specific routes before the generic '/:id' to avoid shadowing.
router.get('/seller/mine', protect, restrictTo('seller', 'admin'), getMyProducts);
router.get('/categories', getCategories);

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, restrictTo('seller', 'admin'), createProduct);
router.patch('/:id', protect, restrictTo('seller', 'admin'), updateProduct);
router.delete('/:id', protect, restrictTo('seller', 'admin'), deleteProduct);

module.exports = router;