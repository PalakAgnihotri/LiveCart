// ── auth.js ──
const express = require('express');
const r = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/profile', protect, updateProfile);
module.exports = r;
