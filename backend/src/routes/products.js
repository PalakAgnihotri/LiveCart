const express = require('express');
const r = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const Product = require('../models/Product');

// GET seller's products
r.get('/my', protect, isSeller, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST create product
r.post('/', protect, isSeller, async (req, res) => {
  try {
    const { name, description, price, originalPrice, stock, category, images } = req.body;
    const product = await Product.create({
      seller: req.user._id, name, description, price,
      originalPrice: originalPrice || 0, stock,
      category: category || 'general', images: images || [],
    });
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// PUT update product
r.put('/:id', protect, isSeller, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      req.body, { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE product
r.delete('/:id', protect, isSeller, async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    res.json({ message: 'Product deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = r;
