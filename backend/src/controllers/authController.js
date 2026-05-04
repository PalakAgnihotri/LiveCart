const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitize = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role,
  avatar: u.avatar, phone: u.phone, storeName: u.storeName,
  storeDesc: u.storeDesc, isApproved: u.isApproved,
  totalRevenue: u.totalRevenue, totalStreams: u.totalStreams,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, storeName, storeDesc, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    const hashed  = await bcrypt.hash(password, 12);
    const data    = { name, email, password: hashed, phone: phone || '' };

    if (role === 'seller') {
      data.role      = 'seller';
      data.storeName = storeName || `${name}'s Store`;
      data.storeDesc = storeDesc || '';
      data.isApproved = false;
    }

    const user = await User.create(data);
    res.status(201).json({ token: token(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: token(user._id), user: sanitize(user) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = (req, res) => res.json(sanitize(req.user));

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, storeName, storeDesc } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, storeName, storeDesc },
      { new: true }
    ).select('-password');
    res.json(sanitize(user));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
