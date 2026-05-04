// ── AdminStreams.jsx ──
import { useEffect, useState } from 'react'
import api from '../../api/axios'

export function AdminStreams() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/streams').then(r => setStreams(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="page">
      <h1 className="text-2xl font-bold text-white mb-8">All Streams</h1>
      <div className="flex flex-col gap-3">
        {streams.map(s => (
          <div key={s._id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-white">{s.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                    s.status === 'live' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                    s.status === 'scheduled' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                    'bg-white/5 text-white/30 border-white/10'
                  }`}>{s.status}</span>
                </div>
                <p className="text-xs text-white/40">
                  {s.seller?.storeName || s.seller?.name} · 👁 {s.peakViewers} peak · 🛍️ {s.totalOrders} orders · ₹{s.totalRevenue}
                </p>
              </div>
              <p className="text-xs text-white/30">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminStreams
