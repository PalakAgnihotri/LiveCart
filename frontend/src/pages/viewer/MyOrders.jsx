import { useEffect, useState } from 'react'
import api from '../../api/axios'

const STATUS_COLORS = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="page max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-white/40">No orders yet — watch a live stream and buy something!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <div key={order._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{order.productName}</p>
                  <p className="text-sm text-white/50 mt-0.5">
                    from {order.seller?.storeName || order.seller?.name} · via {order.stream?.title}
                  </p>
                  <p className="text-sm text-white/40 mt-1">Qty: {order.quantity} · ₹{order.totalAmount}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border capitalize ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-white/30 mt-3">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
