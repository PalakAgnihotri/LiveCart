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
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`LiveCart server on port ${PORT}`));

console.log('Connecting to:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('MongoDB connected successfully to Atlas'))
  .catch(err => {
    console.error('CRITICAL: MongoDB connection failed.');
    console.error('Error Details:', err.message);
  });
