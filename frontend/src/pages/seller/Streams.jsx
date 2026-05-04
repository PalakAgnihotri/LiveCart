import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function SellerStreams() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/streams/my').then(r => setStreams(r.data)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const goLive = async (id) => {
    try {
      await api.patch(`/streams/${id}/go-live`)
      toast.success('You are now LIVE!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const endStream = async (id) => {
    try {
      await api.patch(`/streams/${id}/end`)
      toast.success('Stream ended')
      load()
    } catch { toast.error('Failed to end stream') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Streams</h1>
          <p className="text-white/50 text-sm mt-1">Manage your live and scheduled streams</p>
        </div>
        <Link to="/seller/streams/create" className="btn-primary">+ Create Stream</Link>
      </div>

      {streams.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white/40 mb-4">No streams yet</p>
          <Link to="/seller/streams/create" className="btn-primary">Go Live Now</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {streams.map(s => (
            <div key={s._id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                      s.status === 'live'      ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                      s.status === 'scheduled' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                                                 'bg-white/5 text-white/30 border-white/10'
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-white/40">
                    <span>👁 {s.peakViewers} peak viewers</span>
                    <span>🛍️ {s.totalOrders} orders</span>
                    <span>💰 ₹{s.totalRevenue}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'scheduled' && (
                    <button onClick={() => goLive(s._id)} className="btn-live text-xs px-4 py-2">🔴 Go Live</button>
                  )}
                  {s.status === 'live' && (
                    <>
                      <Link to={`/seller/streams/${s._id}/studio`} className="btn-primary text-xs px-4 py-2">Studio →</Link>
                      <button onClick={() => endStream(s._id)} className="btn-danger text-xs px-4 py-2">End</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
