const express = require('express');
const r = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const { createOrder, verifyPayment, getMyOrders, getSellerOrders, updateStatus } = require('../controllers/orderController');

r.post('/',              protect, createOrder);
r.post('/verify',        protect, verifyPayment);
r.get('/my',             protect, getMyOrders);
r.get('/seller',         protect, isSeller, getSellerOrders);
r.patch('/:id/status',   protect, isSeller, updateStatus);

module.exports = r;
