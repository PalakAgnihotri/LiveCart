const jwt  = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.isSeller = (req, res, next) => {
  if (req.user.role !== 'seller')
    return res.status(403).json({ message: 'Seller access only' });
  if (!req.user.isApproved)
    return res.status(403).json({ message: 'Your account is pending admin approval' });
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access only' });
  next();
};
