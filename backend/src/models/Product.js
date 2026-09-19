const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 5000,
    },
    price: {
      // Stored in the smallest currency unit (e.g. cents) to avoid floating point
      // issues with Stripe, which also expects amounts in cents.
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'inr',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    // Incremented on every stock-affecting update. Used for optimistic
    // concurrency control during checkout so two simultaneous buyers
    // can't both decrement stock past zero (see services/inventory.js).
    version: {
      type: Number,
      default: 0,
    },
    isActive: {
      // Seller can unpublish without deleting (preserves order history references).
      type: Boolean,
      default: true,
    },
    popularity: {
      // Simple counter incremented per purchase; used for sort-by-popularity
      // and as a lightweight signal in the recommendation service.
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.virtual('inStock').get(function getInStock() {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Text index for MongoDB-native search (used in production as a fallback
// to Meilisearch, which is only run locally via Docker in development).
productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
