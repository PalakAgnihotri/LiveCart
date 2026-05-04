const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['viewer', 'seller', 'admin'], default: 'viewer' },
  avatar:     { type: String, default: '' },
  phone:      { type: String, default: '' },

  // seller specific
  storeName:    { type: String, default: '' },
  storeDesc:    { type: String, default: '' },
  isApproved:   { type: Boolean, default: false },
  totalRevenue: { type: Number,  default: 0 },
  totalStreams:  { type: Number,  default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
