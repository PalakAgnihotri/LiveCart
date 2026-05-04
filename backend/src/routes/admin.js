const express = require('express');
const r = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const User    = require('../models/User');
const Stream  = require('../models/Stream');
const Order   = require('../models/Order');
const Product = require('../models/Product');

// Platform stats
r.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [viewers, sellers, liveStreams, totalOrders, revenue] = await Promise.all([
      User.countDocuments({ role: 'viewer' }),
      User.countDocuments({ role: 'seller' }),
      Stream.countDocuments({ status: 'live' }),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
    ]);
    res.json({ viewers, sellers, liveStreams, totalOrders, revenue: revenue[0]?.total || 0 });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// All sellers + approve/reject
r.get('/sellers', protect, isAdmin, async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-password').sort({ createdAt: -1 });
    res.json(sellers);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

r.patch('/sellers/:id/approve', protect, isAdmin, async (req, res) => {
  try {
    const seller = await User.findByIdAndUpdate(
      req.params.id, { isApproved: req.body.isApproved }, { new: true }
    ).select('-password');
    res.json(seller);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// All streams
r.get('/streams', protect, isAdmin, async (req, res) => {
  try {
    const streams = await Stream.find()
      .populate('seller', 'name storeName')
      .sort({ createdAt: -1 }).limit(50);
    res.json(streams);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// All orders
r.get('/orders', protect, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .populate('seller', 'name storeName')
      .populate('product', 'name price')
      .sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// All users
r.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'viewer' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = r;
