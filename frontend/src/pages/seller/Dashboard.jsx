import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function SellerDashboard() {
  const { user } = useAuth()
  const [streams, setStreams] = useState([])
  const [orders, setOrders]   = useState([])

  useEffect(() => {
    api.get('/streams/my').then(r => setStreams(r.data)).catch(() => {})
    api.get('/orders/seller').then(r => setOrders(r.data)).catch(() => {})
  }, [])

  const liveStreams = streams.filter(s => s.status === 'live').length
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0)

  if (!user.isApproved) return (
    <div className="page flex items-center justify-center min-h-[60vh]">
      <div className="card p-10 text-center max-w-md">
        <p className="text-4xl mb-4">⏳</p>
        <h2 className="text-xl font-bold text-white mb-2">Pending Approval</h2>
        <p className="text-white/50 text-sm">Your seller account is under review. You'll be notified once approved by the admin.</p>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome, {user.name} 👋</h1>
        <p className="text-white/50 text-sm mt-1">{user.storeName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Streams', val: streams.length, icon: '📡', color: 'text-violet-400' },
          { label: 'Live Now',      val: liveStreams,     icon: '🔴', color: 'text-red-400' },
          { label: 'Total Orders',  val: orders.length,   icon: '🛍️', color: 'text-blue-400' },
          { label: 'Revenue',       val: `₹${totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
            <div className="text-xs text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link to="/seller/streams/create" className="card p-6 hover:border-violet-500/40 transition-all group">
          <div className="text-3xl mb-3">🔴</div>
          <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">Go Live</h3>
          <p className="text-xs text-white/40">Create and start a new live stream</p>
        </Link>
        <Link to="/seller/products" className="card p-6 hover:border-violet-500/40 transition-all group">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">Products</h3>
          <p className="text-xs text-white/40">Manage your product catalogue</p>
        </Link>
        <Link to="/seller/orders" className="card p-6 hover:border-violet-500/40 transition-all group">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">Orders</h3>
          <p className="text-xs text-white/40">View and manage customer orders</p>
        </Link>
      </div>

      {/* Recent streams */}
      <h2 className="text-lg font-semibold text-white mb-4">Recent Streams</h2>
      {streams.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-white/40 text-sm">No streams yet — <Link to="/seller/streams/create" className="text-violet-400">go live now!</Link></p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {streams.slice(0, 5).map(s => (
            <div key={s._id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{s.title}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Peak: {s.peakViewers} viewers · ₹{s.totalRevenue} revenue · {s.totalOrders} orders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                  s.status === 'live' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                  s.status === 'scheduled' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-white/30 border-white/10'
                }`}>{s.status}</span>
                {s.status === 'live' && (
                  <Link to={`/seller/streams/${s._id}/studio`} className="btn-primary text-xs px-3 py-1.5">Studio →</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
