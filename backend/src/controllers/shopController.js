const asyncHandler = require('express-async-handler');
const Shop = require('../models/Shop');
const User = require('../models/User');

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * @route   POST /api/shops
 * @access  Private (seller)
 * Creates a shop for the logged-in seller. A user can only own one shop.
 */
const createShop = asyncHandler(async (req, res) => {
  const { name, description, logoUrl, bannerUrl } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Shop name is required');
  }

  const existing = await Shop.findOne({ owner: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error('You already have a shop');
  }

  let slug = slugify(name);
  const slugTaken = await Shop.findOne({ slug });
  if (slugTaken) {
    // Append a short suffix to keep slugs unique without failing the request.
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const shop = await Shop.create({
    owner: req.user._id,
    name,
    slug,
    description,
    logoUrl,
    bannerUrl,
  });

  await User.findByIdAndUpdate(req.user._id, { shop: shop._id });

  res.status(201).json({ success: true, shop });
});

/**
 * @route   GET /api/shops/me
 * @access  Private (seller)
 */
const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('No shop found for this account');
  }
  res.status(200).json({ success: true, shop });
});

/**
 * @route   GET /api/shops/:slug
 * @access  Public
 */
const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug, isApproved: true });
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  res.status(200).json({ success: true, shop });
});

/**
 * @route   PATCH /api/shops/me
 * @access  Private (seller)
 */
const updateMyShop = asyncHandler(async (req, res) => {
  const { name, description, logoUrl, bannerUrl } = req.body;

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('No shop found for this account');
  }

  if (name) shop.name = name;
  if (description !== undefined) shop.description = description;
  if (logoUrl !== undefined) shop.logoUrl = logoUrl;
  if (bannerUrl !== undefined) shop.bannerUrl = bannerUrl;

  await shop.save();
  res.status(200).json({ success: true, shop });
});

module.exports = { createShop, getMyShop, getShopBySlug, updateMyShop };

