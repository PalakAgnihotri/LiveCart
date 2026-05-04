const { v4: uuidv4 } = require('uuid');
const Stream  = require('../models/Stream');
const Product = require('../models/Product');
const User    = require('../models/User');

// GET all live/scheduled streams (viewer homepage)
exports.getStreams = async (req, res) => {
  try {
    const { status = 'live' } = req.query;
    const streams = await Stream.find({ status })
      .populate('seller', 'name storeName avatar')
      .populate('pinnedProduct', 'name price originalPrice stock images')
      .sort({ createdAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const mongoose = require('mongoose');

// GET single stream by roomId or _id
exports.getStream = async (req, res) => {
  try {
    const { roomId } = req.params;
    const query = mongoose.Types.ObjectId.isValid(roomId) 
      ? { $or: [{ _id: roomId }, { roomId }] }
      : { roomId };

    const stream = await Stream.findOne(query)
      .populate('seller', 'name storeName avatar isApproved')
      .populate('pinnedProduct', 'name price originalPrice stock images description')
      .populate('products', 'name price stock images');
    
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    res.json(stream);
  } catch (err) {
    console.error('getStream Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create stream (seller)
exports.createStream = async (req, res) => {
  try {
    const { title, description, scheduledAt, productIds } = req.body;
    const stream = await Stream.create({
      seller:      req.user._id,
      title,
      description: description || '',
      roomId:      uuidv4(),
      scheduledAt: scheduledAt || new Date(),
      products:    productIds || [],
    });
    res.status(201).json(stream);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH go live
exports.goLive = async (req, res) => {
  try {
    const stream = await Stream.findOne({ _id: req.params.id, seller: req.user._id });
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    stream.status    = 'live';
    stream.startedAt = new Date();
    await stream.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalStreams: 1 } });
    // Notify all connected clients
    req.io.emit('stream:live', { roomId: stream.roomId, title: stream.title });
    res.json(stream);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH end stream
exports.endStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({ _id: req.params.id, seller: req.user._id });
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    stream.status  = 'ended';
    stream.endedAt = new Date();
    await stream.save();
    req.io.to(stream.roomId).emit('stream:ended');
    res.json(stream);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH pin a product during live stream
exports.pinProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const stream = await Stream.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { pinnedProduct: productId || null },
      { new: true }
    ).populate('pinnedProduct', 'name price originalPrice stock images');

    if (!stream) return res.status(404).json({ message: 'Stream not found' });

    // Broadcast pinned product to all viewers in room
    req.io.to(stream.roomId).emit('stream:pinProduct', stream.pinnedProduct);
    res.json(stream);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET seller's own streams
exports.getMyStreams = async (req, res) => {
  try {
    const streams = await Stream.find({ seller: req.user._id })
      .sort({ createdAt: -1 });
    res.json(streams);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
