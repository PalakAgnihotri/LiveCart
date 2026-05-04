import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const cards = stats ? [
    { label: 'Total Viewers',  val: stats.viewers,    icon: '👥', color: 'text-blue-400' },
    { label: 'Total Sellers',  val: stats.sellers,    icon: '🏪', color: 'text-violet-400' },
    { label: 'Live Now',       val: stats.liveStreams, icon: '🔴', color: 'text-red-400' },
    { label: 'Total Orders',   val: stats.totalOrders,icon: '🛍️', color: 'text-emerald-400' },
    { label: 'Total Revenue',  val: `₹${(stats.revenue || 0).toLocaleString()}`, icon: '💰', color: 'text-amber-400' },
  ] : []

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">LiveCart platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="card p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-2xl font-bold font-mono ${c.color}`}>{c.val}</div>
            <div className="text-xs text-white/40 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/sellers', label: 'Manage Sellers', desc: 'Approve or reject seller accounts', icon: '🏪' },
          { to: '/admin/streams', label: 'All Streams', desc: 'Monitor live and past streams', icon: '📡' },
          { to: '/admin/orders',  label: 'All Orders', desc: 'View all platform transactions', icon: '📋' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card p-6 hover:border-violet-500/40 transition-all group">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">{item.label}</h3>
            <p className="text-xs text-white/40">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
