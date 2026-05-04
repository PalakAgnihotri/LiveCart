import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/shared/Spinner'

export default function Home() {
  const [streams, setStreams]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('live')

  useEffect(() => {
    setLoading(true)
    api.get(`/streams?status=${tab}`)
      .then(r => setStreams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">🔴 Live Shopping</h1>
        <p className="text-white/50 text-sm">Watch sellers go live and buy with one tap</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[{ val: 'live', label: '🔴 Live Now' }, { val: 'scheduled', label: '📅 Upcoming' }, { val: 'ended', label: '🎬 Replays' }].map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === t.val ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/10 text-white/50 hover:border-white/20'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : streams.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">{tab === 'live' ? '📡' : '📅'}</p>
          <p className="text-white/40">No {tab} streams right now</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map(stream => (
            <Link key={stream._id} to={`/stream/${stream.roomId}`}
              className="card-hover block overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative h-44 bg-gradient-to-br from-violet-900/40 to-purple-900/40 flex items-center justify-center">
                <span className="text-5xl">🛍️</span>
                {stream.status === 'live' && (
                  <div className="absolute top-3 left-3 badge-live">
                    <div className="live-dot" /> LIVE
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/50 text-white/80 text-xs px-2 py-1 rounded-lg">
                  👁 {stream.viewerCount || 0}
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-violet-300 transition-colors">
                  {stream.title}
                </h3>
                <p className="text-sm text-white/50 mb-3">{stream.seller?.storeName || stream.seller?.name}</p>
                {stream.pinnedProduct && (
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <span className="text-lg">🏷️</span>
                    <div>
                      <p className="text-xs text-white/70 font-medium">{stream.pinnedProduct.name}</p>
                      <p className="text-xs text-violet-400 font-bold">₹{stream.pinnedProduct.price}</p>
                    </div>
                    <span className="ml-auto text-xs text-red-400 font-medium">
                      {stream.pinnedProduct.stock} left!
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
