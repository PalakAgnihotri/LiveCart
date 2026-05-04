import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function AdminSellers() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/admin/sellers').then(r => setSellers(r.data)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (id, isApproved) => {
    try {
      await api.patch(`/admin/sellers/${id}/approve`, { isApproved })
      toast.success(isApproved ? 'Seller approved!' : 'Seller rejected')
      load()
    } catch { toast.error('Failed') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  const pending  = sellers.filter(s => !s.isApproved)
  const approved = sellers.filter(s => s.isApproved)

  return (
    <div className="page">
      <h1 className="text-2xl font-bold text-white mb-8">Sellers</h1>

      {pending.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">⏳ Pending Approval ({pending.length})</h2>
          <div className="flex flex-col gap-3 mb-8">
            {pending.map(s => (
              <div key={s._id} className="card p-5 border-amber-500/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-sm text-violet-300">{s.storeName}</p>
                    <p className="text-xs text-white/40 mt-1">{s.email} · {s.phone}</p>
                    {s.storeDesc && <p className="text-xs text-white/30 mt-1">{s.storeDesc}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggle(s._id, true)} className="btn-primary text-xs px-4 py-2">✓ Approve</button>
                    <button onClick={() => toggle(s._id, false)} className="btn-danger text-xs px-4 py-2">✗ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">✓ Approved Sellers ({approved.length})</h2>
      <div className="flex flex-col gap-3">
        {approved.map(s => (
          <div key={s._id} className="card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{s.name} — <span className="text-violet-300">{s.storeName}</span></p>
                <p className="text-xs text-white/40">{s.email} · Streams: {s.totalStreams} · Revenue: ₹{s.totalRevenue?.toLocaleString()}</p>
              </div>
              <button onClick={() => toggle(s._id, false)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
