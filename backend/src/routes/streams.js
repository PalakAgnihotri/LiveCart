const express = require('express');
const r = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const c = require('../controllers/streamController');

r.get('/',                      c.getStreams);
r.get('/my',                    protect, isSeller, c.getMyStreams);
r.get('/:roomId',               c.getStream);
r.post('/',                     protect, isSeller, c.createStream);
r.patch('/:id/go-live',         protect, isSeller, c.goLive);
r.patch('/:id/end',             protect, isSeller, c.endStream);
r.patch('/:id/pin-product',     protect, isSeller, c.pinProduct);

module.exports = r;
