const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const streamRoutes  = require('./routes/streams');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const { socketHandler } = require('./utils/socketHandler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Attach io to every request so controllers can emit
app.use((req, _, next) => { req.io = io; next(); });

app.use('/api/auth',     authRoutes);
app.use('/api/streams',  streamRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'LiveCart' }));

socketHandler(io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`LiveCart server on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => console.error('MongoDB error:', err));
