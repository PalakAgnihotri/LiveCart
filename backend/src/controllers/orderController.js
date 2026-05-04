const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const Stream   = require('../models/Stream');
const User     = require('../models/User');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST create order — atomic stock check with findOneAndUpdate
exports.createOrder = async (req, res) => {
  try {
    const { productId, streamId, quantity = 1, shippingAddress, phone } = req.body;

    // ATOMIC stock decrement — prevents overselling during live rush
    const product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity }, isActive: true },
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!product)
      return res.status(400).json({ message: 'Product unavailable or out of stock' });

    const totalAmount = product.price * quantity;

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt:  `lc_${Date.now()}`,
    });

    // Create DB order
    const order = await Order.create({
      buyer:           req.user._id,
      seller:          product.seller,
      product:         product._id,
      stream:          streamId,
      productName:     product.name,
      quantity,
      price:           product.price,
      totalAmount,
      razorpayOrderId: rzpOrder.id,
      shippingAddress: shippingAddress || '',
      phone:           phone || '',
    });

    res.status(201).json({
      order,
      razorpayOrderId: rzpOrder.id,
      amount:   rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentId     = razorpay_payment_id;
    order.paymentStatus = 'paid';
    order.status        = 'paid';
    await order.save();

    // Update product soldCount, seller revenue, stream stats
    await Promise.all([
      Product.findByIdAndUpdate(order.product, { $inc: { soldCount: order.quantity } }),
      User.findByIdAndUpdate(order.seller, { $inc: { totalRevenue: order.totalAmount } }),
      Stream.findByIdAndUpdate(order.stream, {
        $inc: { totalOrders: 1, totalRevenue: order.totalAmount }
      }),
    ]);

    // Broadcast to stream room — live order notification
    req.io.to(order.stream?.toString()).emit('stream:newOrder', {
      productName: order.productName,
      buyerName:   req.user.name,
      quantity:    order.quantity,
      amount:      order.totalAmount,
    });

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET my orders (buyer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('product', 'name images price')
      .populate('seller', 'name storeName')
      .populate('stream', 'title')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET seller orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id, paymentStatus: 'paid' })
      .populate('buyer', 'name email phone')
      .populate('product', 'name price images')
      .populate('stream', 'title')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH update order status (seller)
exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
