const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stream:          { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  productName:     { type: String, required: true },
  quantity:        { type: Number, required: true, min: 1, default: 1 },
  price:           { type: Number, required: true },
  totalAmount:     { type: Number, required: true },
  status:          { type: String, enum: ['pending','paid','shipped','delivered','cancelled'], default: 'pending' },
  paymentStatus:   { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  razorpayOrderId: { type: String, default: '' },
  paymentId:       { type: String, default: '' },
  shippingAddress: { type: String, default: '' },
  phone:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
