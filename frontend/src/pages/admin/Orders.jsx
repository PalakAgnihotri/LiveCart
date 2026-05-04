import { useEffect, useState } from 'react'
import api from '../../api/axios'

const STATUS_COLORS = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/orders').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0)

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">All Orders</h1>
        <div className="card px-4 py-2">
          <span className="text-xs text-white/50">Total Revenue: </span>
          <span className="text-emerald-400 font-bold">₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-16 text-center"><p className="text-white/40">No orders yet</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <div key={order._id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-white">{order.productName}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Buyer: {order.buyer?.name} · Seller: {order.seller?.storeName || order.seller?.name}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Qty: {order.quantity} · ₹{order.totalAmount} · {order.paymentId ? `Payment: ${order.paymentId.slice(0,12)}...` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                    order.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/20 mt-2">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
