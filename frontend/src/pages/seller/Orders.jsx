import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['paid','shipped','delivered','cancelled']
const STATUS_COLORS = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function SellerOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/orders/seller').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status })
      toast.success(`Order marked as ${status}`)
      load()
    } catch { toast.error('Failed to update') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-white/50 text-sm mt-1">{orders.length} total orders received</p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-white/40">No orders yet — go live and start selling!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <div key={order._id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-white">{order.productName}</p>
                  <p className="text-sm text-white/50 mt-0.5">
                    {order.buyer?.name} · {order.buyer?.phone || order.buyer?.email}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Qty: {order.quantity} · ₹{order.totalAmount} · via {order.stream?.title}
                  </p>
                  {order.shippingAddress && (
                    <p className="text-xs text-white/40 mt-1">📍 {order.shippingAddress}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order._id, e.target.value)}
                    className="text-xs bg-[#111118] border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-white/30 mt-3">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
