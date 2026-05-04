const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  thumbnail:    { type: String, default: '' },
  status:       { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  roomId:       { type: String, unique: true },
  scheduledAt:  { type: Date },
  startedAt:    { type: Date },
  endedAt:      { type: Date },

  // real-time stats (updated via socket)
  viewerCount:  { type: Number, default: 0 },
  peakViewers:  { type: Number, default: 0 },
  totalOrders:  { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },

  // currently pinned product
  pinnedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

  // products showcased in this stream
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // chat messages stored for replay
  chatLog: [{
    user:    { type: String },
    message: { type: String },
    time:    { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema);
