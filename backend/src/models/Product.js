const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  price:        { type: Number, required: true, min: 0 },
  originalPrice:{ type: Number, default: 0 },
  stock:        { type: Number, required: true, min: 0 },
  soldCount:    { type: Number, default: 0 },
  category:     { type: String, default: 'general' },
  images:       [{ type: String }],
  isActive:     { type: Boolean, default: true },

  // which stream this product is/was featured in
  stream:       { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
