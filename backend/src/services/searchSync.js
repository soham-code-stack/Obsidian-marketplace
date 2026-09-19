const { client, PRODUCTS_INDEX } = require('../config/meilisearch');

/**
 * Shapes a Mongoose Product document into the flat structure Meilisearch expects.
 * Meilisearch documents need a primary key field ('id') — we reuse the Mongo _id as a string.
 */
const toSearchDocument = (product, shop) => ({
  id: product._id.toString(),
  productId: product._id.toString(),
  name: product.name,
  description: product.description,
  category: product.category,
  tags: product.tags,
  price: product.price,
  currency: product.currency,
  images: product.images,
  stock: product.stock,
  inStock: product.stock > 0,
  isActive: product.isActive,
  popularity: product.popularity,
  shopId: product.shop.toString(),
  shopName: shop?.name || '',
  createdAt: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
});

/**
 * Upserts a single product into the Meilisearch index.
 * Call this after create/update. Failures are logged, not thrown — search
 * being briefly out of sync should never break the write path to MongoDB,
 * which remains the source of truth.
 */
const indexProduct = async (product, shop) => {
  try {
    const index = client.index(PRODUCTS_INDEX);
    await index.addDocuments([toSearchDocument(product, shop)]);
  } catch (error) {
    console.error(`[SearchSync] Failed to index product ${product._id}: ${error.message}`);
  }
};

/**
 * Removes a product from the search index (e.g. on delete or unpublish).
 */
const removeProductFromIndex = async (productId) => {
  try {
    const index = client.index(PRODUCTS_INDEX);
    await index.deleteDocument(productId.toString());
  } catch (error) {
    console.error(`[SearchSync] Failed to remove product ${productId}: ${error.message}`);
  }
};

/**
 * Bulk re-index — useful for an initial data load or a manual resync job.
 */
const reindexAllProducts = async (Product, Shop) => {
  const products = await Product.find({ isActive: true }).lean();
  const shopIds = [...new Set(products.map((p) => p.shop.toString()))];
  const shops = await Shop.find({ _id: { $in: shopIds } }).lean();
  const shopMap = new Map(shops.map((s) => [s._id.toString(), s]));

  const docs = products.map((p) => toSearchDocument(p, shopMap.get(p.shop.toString())));

  const index = client.index(PRODUCTS_INDEX);
  await index.addDocuments(docs);
  console.log(`[SearchSync] Reindexed ${docs.length} products`);
};

module.exports = { indexProduct, removeProductFromIndex, reindexAllProducts };

