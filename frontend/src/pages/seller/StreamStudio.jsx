import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SimplePeer from 'simple-peer'
import api from '../../api/axios'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function StreamStudio() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const { emit, on, off } = useSocket()
  const navigate     = useNavigate()

  const localVideoRef = useRef(null)
  const streamRef     = useRef(null)
  const peersRef      = useRef({})

  const [stream, setStream]         = useState(null)
  const [isLive, setIsLive]         = useState(false)
  const [viewers, setViewers]       = useState(0)
  const [messages, setMessages]     = useState([])
  const [orders, setOrders]         = useState([])
  const [pinnedId, setPinnedId]     = useState(null)
  const [muted, setMuted]           = useState(false)
  const [camOff, setCamOff]         = useState(false)

  useEffect(() => {
    api.get(`/streams/${id}`).then(r => {
      setStream(r.data)
      setPinnedId(r.data.pinnedProduct?._id || null)
      setIsLive(r.data.status === 'live')
    }).catch(() => navigate('/seller/streams'))
  }, [id])

  // Start camera
  const startCamera = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = media
      if (localVideoRef.current) localVideoRef.current.srcObject = media
    } catch { toast.error('Camera/mic access denied') }
  }

  useEffect(() => { startCamera() }, [])

  // Socket listeners
  useEffect(() => {
    if (!stream) return

    // When a viewer joins, send them a WebRTC offer
    on('stream:viewerCount', setViewers)
    on('stream:chat', msg => setMessages(p => [...p.slice(-100), msg]))
    on('stream:newOrder', order => {
      setOrders(p => [order, ...p.slice(0, 19)])
      toast.success(`🛍️ New order! ${order.productName} — ₹${order.amount}`)
    })

    // WebRTC — when viewer sends answer back
    on('webrtc:answer', ({ answer }) => {
      Object.values(peersRef.current).forEach(peer => {
        try { peer.signal(answer) } catch {}
      })
    })

    return () => {
      ;['stream:viewerCount','stream:chat','stream:newOrder','webrtc:answer'].forEach(ev => off(ev))
    }
  }, [stream])

  const goLive = async () => {
    try {
      await api.patch(`/streams/${stream._id}/go-live`)
      setIsLive(true)
      toast.success('🔴 You are now LIVE!')

      // Emit WebRTC offer to all in room
      emit('stream:join', { roomId: stream.roomId, userId: user._id, userName: user.name + ' (Seller)' })

      if (streamRef.current) {
        const peer = new SimplePeer({ initiator: true, trickle: false, stream: streamRef.current })
        peer.on('signal', offer => emit('webrtc:offer', { roomId: stream.roomId, offer }))
        peer.on('error', () => {})
        peersRef.current['broadcast'] = peer
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to go live')
    }
  }

  const endStream = async () => {
    if (!window.confirm('End this stream?')) return
    try {
      await api.patch(`/streams/${stream._id}/end`)
      streamRef.current?.getTracks().forEach(t => t.stop())
      emit('webrtc:end', { roomId: stream.roomId })
      toast.success('Stream ended')
      navigate('/seller/streams')
    } catch { toast.error('Failed to end stream') }
  }

  const pinProduct = async (productId) => {
    try {
      await api.patch(`/streams/${stream._id}/pin-product`, { productId: productId || null })
      setPinnedId(productId)
      toast.success(productId ? 'Product pinned!' : 'Product unpinned')
    } catch { toast.error('Failed to pin product') }
  }

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = camOff })
    setCamOff(c => !c)
  }

  if (!stream) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col lg:flex-row">

      {/* ── LEFT: VIDEO + CONTROLS ── */}
      <div className="flex-1 flex flex-col">

        {/* Stream title bar */}
        <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && <div className="badge-live"><div className="live-dot" />LIVE</div>}
            <h2 className="font-semibold text-white">{stream.title}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <span>👁 {viewers}</span>
            <span>🛍️ {orders.length} orders</span>
          </div>
        </div>

        {/* Local video preview */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute bottom-4 left-4 text-xs bg-black/60 px-2 py-1 rounded text-white/60">
            📷 Your preview (mirrored)
          </div>
        </div>

        {/* Camera controls */}
        <div className="flex items-center justify-center gap-4 py-4 border-b border-white/8">
          <button onClick={toggleMute}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {muted ? '🔇' : '🎤'}
          </button>

          {!isLive ? (
            <button onClick={goLive} className="btn-live px-8 py-3 text-base">
              🔴 Go Live
            </button>
          ) : (
            <button onClick={endStream} className="btn-danger px-8 py-3 text-base">
              ⏹ End Stream
            </button>
          )}

          <button onClick={toggleCam}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${camOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {camOff ? '📷' : '📹'}
          </button>
        </div>

        {/* Pin products */}
        <div className="p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">📌 Pin a Product</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => pinProduct(null)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!pinnedId ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
              None
            </button>
            {stream.products?.map(p => (
              <button key={p._id} onClick={() => pinProduct(p._id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${pinnedId === p._id ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                {p.name} · ₹{p.price} · {p.stock} left
              </button>
            ))}
          </div>
        </div>

        {/* Recent orders feed */}
        {orders.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-2">🛍️ Live Orders</p>
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {orders.map((o, i) => (
                <div key={i} className="text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-400">
                  {o.buyerName} bought {o.productName} × {o.quantity} — ₹{o.amount}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: LIVE CHAT ── */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col h-80 lg:h-auto">
        <div className="px-4 py-3 border-b border-white/8">
          <h3 className="font-semibold text-white text-sm">Live Chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`text-xs ${m.type === 'system' ? 'text-white/30 italic text-center' : ''}`}>
              {m.type !== 'system' && <span className="font-semibold text-violet-400">{m.userName}: </span>}
              <span className="text-white/70">{m.message}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/8 text-xs text-white/30 text-center italic">
          Chat is read-only for sellers during stream
        </div>
      </div>

    </div>
  )
}
