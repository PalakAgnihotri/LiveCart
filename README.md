# LiveCart — Live Shopping Platform

Real-time social commerce where sellers go LIVE and viewers buy with one tap.

## Tech Stack
- **Frontend:** React.js + Vite + Tailwind CSS + Socket.io Client + SimplePeer (WebRTC)
- **Backend:** Node.js + Express + Socket.io + MongoDB + Razorpay
- **Real-time:** WebRTC (video) + Socket.io (chat, reactions, inventory updates)
- **Payments:** Razorpay with webhook verification

---

## Project Structure

```
livecart/
├── backend/
│   ├── src/
│   │   ├── index.js                  ← Express + Socket.io server
│   │   ├── models/
│   │   │   ├── User.js               ← viewer / seller / admin roles
│   │   │   ├── Stream.js             ← live stream with chat log
│   │   │   ├── Product.js            ← product catalogue
│   │   │   └── Order.js              ← orders with payment tracking
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── streams.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   └── admin.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── streamController.js
│   │   │   └── orderController.js    ← Razorpay + atomic stock lock
│   │   ├── middleware/auth.js         ← JWT + role guards
│   │   └── utils/socketHandler.js    ← WebRTC signalling + chat + reactions
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── viewer/
    │   │   │   ├── Home.jsx           ← browse live streams
    │   │   │   ├── StreamView.jsx     ← watch + chat + buy
    │   │   │   └── MyOrders.jsx
    │   │   ├── seller/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── Streams.jsx
    │   │   │   ├── CreateStream.jsx
    │   │   │   ├── StreamStudio.jsx   ← live broadcast control room
    │   │   │   ├── Products.jsx
    │   │   │   └── Orders.jsx
    │   │   └── admin/
    │   │       ├── Dashboard.jsx
    │   │       ├── Sellers.jsx        ← approve/reject sellers
    │   │       ├── Streams.jsx
    │   │       └── Orders.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   └── components/shared/
    │       ├── Navbar.jsx
    │       └── Spinner.jsx
    └── package.json
```

---

## Setup (Windows)

### Step 1 — MongoDB Atlas
1. Go to mongodb.com/atlas → Create free cluster
2. Add user + allow all IPs (0.0.0.0/0)
3. Copy connection URI

### Step 2 — Razorpay Test Keys
1. Go to razorpay.com → Create account
2. Dashboard → Settings → API Keys → Generate Test Key
3. Copy Key ID and Key Secret

### Step 3 — Backend
```bash
cd livecart/backend
copy .env.example .env
# Fill in MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm install
npm run dev
# Runs on http://localhost:5000
```

### Step 4 — Frontend (new terminal)
```bash
cd livecart/frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Step 5 — Create Admin Account
After registering, manually set role to 'admin' in MongoDB Atlas:
```
db.users.updateOne({ email: "youremail@gmail.com" }, { $set: { role: "admin" } })
```

---

## How It Works

### User Roles
- **Viewer** — browses live streams, watches, buys products
- **Seller** — registers, gets approved by admin, creates streams, goes live, pins products
- **Admin** — approves sellers, monitors all streams and orders

### Live Stream Flow
1. Seller creates stream → enters Studio
2. Clicks "Go Live" → camera activates → WebRTC offer sent to Socket room
3. Viewers join → receive WebRTC offer → P2P video connection established
4. Seller pins a product → instantly appears for all viewers
5. Viewer clicks "Buy Now" → Razorpay checkout opens
6. Payment verified → stock decremented atomically (prevents overselling)
7. New order broadcast to stream room → seller sees live order feed

### Atomic Stock Prevention (Key Feature)
```js
// findOneAndUpdate with $gte condition — only succeeds if stock >= quantity
const product = await Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: quantity }, isActive: true },
  { $inc: { stock: -quantity } },
  { new: true }
)
// If product is null → stock ran out → reject order
```

---

## API Routes

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | /api/auth/register          | Register viewer/seller        |
| POST   | /api/auth/login             | Login                         |
| GET    | /api/streams                | Get live/scheduled streams    |
| POST   | /api/streams                | Create stream (seller)        |
| PATCH  | /api/streams/:id/go-live    | Start broadcasting            |
| PATCH  | /api/streams/:id/end        | End stream                    |
| PATCH  | /api/streams/:id/pin-product| Pin product during stream     |
| GET    | /api/products/my            | Seller's products             |
| POST   | /api/products               | Add product                   |
| POST   | /api/orders                 | Create order (atomic stock)   |
| POST   | /api/orders/verify          | Verify Razorpay payment       |
| GET    | /api/admin/stats            | Platform statistics           |
| PATCH  | /api/admin/sellers/:id/approve | Approve/reject seller      |

---

## Socket Events

| Event                | Direction        | Description                        |
|----------------------|------------------|------------------------------------|
| stream:join          | Client → Server  | Join stream room                   |
| stream:viewerCount   | Server → Room    | Updated viewer count               |
| stream:chat          | Both             | Chat message                       |
| stream:reaction      | Both             | Emoji reaction                     |
| stream:pinProduct    | Server → Room    | Product pinned by seller           |
| stream:newOrder      | Server → Room    | New order notification             |
| stream:ended         | Server → Room    | Stream ended                       |
| webrtc:offer         | Client → Server  | WebRTC offer from seller           |
| webrtc:answer        | Client → Server  | WebRTC answer from viewer          |
| webrtc:ice           | Both             | ICE candidate exchange             |

---

## Deployment (Free)
- **Frontend** → Netlify (drag & drop build folder)
- **Backend**  → Render.com (connect GitHub repo)
- **Database** → MongoDB Atlas (already cloud hosted)
