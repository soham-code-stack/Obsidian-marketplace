const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one shop per seller, keeps the model simple
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    isApproved: {
      // Admin can gate new shops before they appear publicly.
      type: Boolean,
      default: true,
    },
    // Cached aggregate stats, updated after each order — avoids expensive
    // aggregation queries on every dashboard load.
    stats: {
      totalSales: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);

