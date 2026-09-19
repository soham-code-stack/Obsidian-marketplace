const { MeiliSearch } = require('meilisearch');

/**
 * Meilisearch client instance, shared across the app.
 * The 'products' index is created (if missing) and configured with
 * searchable/filterable/sortable attributes on server startup.
 */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_API_KEY,
});

const PRODUCTS_INDEX = 'products';

/**
 * Ensures the products index exists with the correct settings.
 * Call this once at server startup (see server.js).
 */
const initMeilisearch = async () => {
  try {
    await client.getIndex(PRODUCTS_INDEX).catch(async (err) => {
      if (err.code === 'index_not_found') {
        await client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
      } else {
        throw err;
      }
    });

    const index = client.index(PRODUCTS_INDEX);

    await index.updateSettings({
      searchableAttributes: ['name', 'description', 'category', 'tags', 'shopName'],
      filterableAttributes: ['category', 'price', 'shopId', 'inStock', 'tags', 'isActive'],
      sortableAttributes: ['price', 'createdAt', 'popularity'],
    });

    console.log('[Meilisearch] Index initialized and configured.');
  } catch (error) {
    // Non-fatal: the app can still run without search working perfectly.
    console.error(`[Meilisearch] Init failed: ${error.message}`);
  }
};

module.exports = { client, PRODUCTS_INDEX, initMeilisearch };

