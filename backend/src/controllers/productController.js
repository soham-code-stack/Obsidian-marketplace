const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { indexProduct, removeProductFromIndex } = require('../services/searchSync');

/**
 * @route   POST /api/products
 * @access  Private (seller — must own a shop)
 */
const createProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(400);
    throw new Error('You must create a shop before adding products');
  }

  const { name, description, price, category, tags, images, stock } = req.body;

  if (!name || !description || price === undefined || !category) {
    res.status(400);
    throw new Error('name, description, price, and category are required');
  }

  const product = await Product.create({
    shop: shop._id,
    name,
    description,
    price,
    category,
    tags: Array.isArray(tags) ? tags : [],
    images: Array.isArray(images) ? images : [],
    stock: stock || 0,
  });

  await indexProduct(product, shop);

  res.status(201).json({ success: true, product });
});

/**
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.shopId) filter.shop = req.query.shopId;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('shop', 'name slug logoUrl');
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.status(200).json({ success: true, product });
});

const loadOwnedProduct = async (req) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  if (req.user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || !product.shop.equals(shop._id)) {
      const err = new Error('You do not have permission to modify this product');
      err.statusCode = 403;
      throw err;
    }
  }

  return product;
};

/**
 * @route   PATCH /api/products/:id
 * @access  Private (seller — owner only, or admin)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await loadOwnedProduct(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const editable = ['name', 'description', 'price', 'category', 'tags', 'images', 'stock', 'isActive'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });
  product.version += 1;

  await product.save();

  const shop = await Shop.findById(product.shop);
  if (product.isActive) {
    await indexProduct(product, shop);
  } else {
    await removeProductFromIndex(product._id);
  }

  res.status(200).json({ success: true, product });
});

/**
 * @route   DELETE /api/products/:id
 * @access  Private (seller — owner only, or admin)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await loadOwnedProduct(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  await product.deleteOne();
  await removeProductFromIndex(product._id);

  res.status(200).json({ success: true, message: 'Product deleted' });
});

/**
 * @route   GET /api/products/seller/mine
 * @access  Private (seller)
 */
const getMyProducts = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('No shop found for this account');
  }

  const products = await Product.find({ shop: shop._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, products });
});

/**
 * @route   GET /api/products/categories
 * @access  Public
 *
 * Returns each distinct category with a product count and a representative
 * thumbnail image.
 *
 * FIX: previously used $first on unsorted grouped documents, which could
 * land on a product whose `images` array happened to be empty, leaving the
 * whole category tile with no image. This version explicitly filters out
 * any product with an empty images array BEFORE grouping, so the sample
 * image is always a real one when at least one product in the category has
 * an image.
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        // Collect all images arrays in the category, then flatten + filter
        // in JS below — more predictable than trying to do conditional
        // "first non-empty" logic purely in the aggregation pipeline.
        allImageArrays: { $push: '$images' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const formatted = categories.map((c) => {
    const flatImages = c.allImageArrays.flat().filter(Boolean);
    return {
      category: c._id,
      count: c.count,
      image: flatImages[0] || null,
    };
  });

  res.status(200).json({ success: true, categories: formatted });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getCategories,
};