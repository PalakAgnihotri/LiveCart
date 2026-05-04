import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SimplePeer from 'simple-peer'
import api from '../../api/axios'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const EMOJIS = ['❤️', '🔥', '😍', '👏', '🛍️', '💯']

export default function StreamView() {
  const { roomId }   = useParams()
  const { user }     = useAuth()
  const { emit, on, off } = useSocket()
  const navigate     = useNavigate()

  const videoRef     = useRef(null)
  const peerRef      = useRef(null)

  const [stream, setStream]         = useState(null)
  const [messages, setMessages]     = useState([])
  const [chatInput, setChatInput]   = useState('')
  const [viewers, setViewers]       = useState(0)
  const [pinnedProduct, setPinned]  = useState(null)
  const [reactions, setReactions]   = useState([])
  const [connected, setConnected]   = useState(false)
  const [buying, setBuying]         = useState(false)
  const [showBuyModal, setShowBuy]  = useState(false)
  const [buyForm, setBuyForm]       = useState({ quantity: 1, shippingAddress: '', phone: user?.phone || '' })

  // Load stream data
  useEffect(() => {
    api.get(`/streams/${roomId}`)
      .then(r => {
        setStream(r.data)
        setPinned(r.data.pinnedProduct)
        if (r.data.chatLog) {
          setMessages(r.data.chatLog.map(m => ({ userName: m.user, message: m.message, type: 'message' })))
        }
      })
      .catch(() => navigate('/'))
  }, [roomId])

  // Join socket room + WebRTC as receiver
  useEffect(() => {
    if (!stream || !user) return

    emit('stream:join', { roomId, userId: user._id, userName: user.name })

    // WebRTC — receive offer from seller
    on('webrtc:offer', ({ from, offer }) => {
      navigator.mediaDevices.getUserMedia({ video: false, audio: false })
        .catch(() => {})

      const peer = new SimplePeer({ initiator: false, trickle: false })
      peerRef.current = peer

      peer.signal(offer)

      peer.on('signal', answer => emit('webrtc:answer', { to: from, answer }))

      peer.on('stream', remoteStream => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream
          setConnected(true)
        }
      })

      peer.on('error', () => {})
    })

    on('webrtc:answer', ({ answer }) => peerRef.current?.signal(answer))
    on('webrtc:ice',    ({ candidate }) => peerRef.current?.signal(candidate))
    on('webrtc:end',    () => { setConnected(false); if (videoRef.current) videoRef.current.srcObject = null })

    on('stream:viewerCount', setViewers)
    on('stream:chat',        msg  => setMessages(p => [...p.slice(-100), msg]))
    on('stream:pinProduct',  prod => setPinned(prod))
    on('stream:ended',       ()   => { toast('Stream ended'); setTimeout(() => navigate('/'), 2000) })
    on('stream:newOrder',    ({ buyerName, productName, amount }) => {
      toast.success(`🛍️ ${buyerName} just bought ${productName} for ₹${amount}!`, { duration: 4000 })
    })
    on('stream:reaction', ({ emoji }) => {
      const id = Date.now()
      setReactions(p => [...p, { id, emoji }])
      setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2000)
    })

    return () => {
      emit('stream:leave', { roomId, userName: user.name })
      peerRef.current?.destroy()
      ;['webrtc:offer','webrtc:answer','webrtc:ice','webrtc:end','stream:viewerCount',
        'stream:chat','stream:pinProduct','stream:ended','stream:newOrder','stream:reaction'
      ].forEach(ev => off(ev))
    }
  }, [stream, user])

  const sendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    emit('stream:chat', { roomId, userId: user._id, userName: user.name, message: chatInput })
    setChatInput('')
  }

  const sendReaction = (emoji) => emit('stream:reaction', { roomId, emoji })

  const handleBuy = async () => {
    if (!pinnedProduct) return
    setBuying(true)
    try {
      const { data } = await api.post('/orders', {
        productId:       pinnedProduct._id,
        streamId:        stream._id,
        quantity:        buyForm.quantity,
        shippingAddress: buyForm.shippingAddress,
        phone:           buyForm.phone,
      })

      // Open Razorpay
      const options = {
        key:      data.keyId,
        amount:   data.amount,
        currency: data.currency,
        name:     'LiveCart',
        description: pinnedProduct.name,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/orders/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId:             data.order._id,
            })
            toast.success('🎉 Order placed successfully!')
            setShowBuy(false)
            setPinned(p => p ? { ...p, stock: p.stock - buyForm.quantity } : p)
          } catch { toast.error('Payment verification failed') }
        },
        theme: { color: '#7c3aed' },
      }
      new window.Razorpay(options).open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally { setBuying(false) }
  }

  if (!stream) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col lg:flex-row">

      {/* ── VIDEO PANEL ── */}
      <div className="flex-1 flex flex-col">
        {/* Video */}
        <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1 flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="text-5xl">📡</div>
              <p className="text-white/60 text-sm">Connecting to stream...</p>
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stream.status === 'live' && <div className="badge-live"><div className="live-dot"/>LIVE</div>}
              <div className="bg-black/60 text-white/80 text-xs px-3 py-1.5 rounded-full">
                👁 {viewers} watching
              </div>
            </div>
            <div className="bg-black/60 text-white/80 text-xs px-3 py-1.5 rounded-full">
              {stream.seller?.storeName || stream.seller?.name}
            </div>
          </div>

          {/* Floating reactions */}
          <div className="absolute bottom-20 right-4 flex flex-col gap-2 pointer-events-none">
            {reactions.map(r => (
              <div key={r.id} className="text-2xl animate-bounce">{r.emoji}</div>
            ))}
          </div>
        </div>

        {/* Stream title */}
        <div className="px-4 py-3 border-t border-white/8">
          <h2 className="font-semibold text-white">{stream.title}</h2>
          <p className="text-sm text-white/50">{stream.description}</p>
        </div>

        {/* Pinned product */}
        {pinnedProduct && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-2">📌 Featured Now</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{pinnedProduct.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-violet-300">₹{pinnedProduct.price}</span>
                  {pinnedProduct.originalPrice > pinnedProduct.price && (
                    <span className="text-sm text-white/40 line-through">₹{pinnedProduct.originalPrice}</span>
                  )}
                </div>
                <p className="text-xs text-red-400 mt-1 font-medium">
                  {pinnedProduct.stock > 0 ? `Only ${pinnedProduct.stock} left!` : 'Sold out!'}
                </p>
              </div>
              <button
                onClick={() => setShowBuy(true)}
                disabled={pinnedProduct.stock === 0}
                className="btn-primary px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                ⚡ Buy Now
              </button>
            </div>
          </div>
        )}

        {/* Emoji reactions */}
        <div className="flex gap-3 px-4 pb-4">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => sendReaction(e)}
              className="text-2xl hover:scale-125 transition-transform active:scale-95">
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col h-96 lg:h-auto">
        <div className="px-4 py-3 border-b border-white/8">
          <h3 className="font-semibold text-white text-sm">Live Chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`text-xs ${m.type === 'system' ? 'text-white/30 italic text-center' : ''}`}>
              {m.type !== 'system' && (
                <span className="font-semibold text-violet-400">{m.userName}: </span>
              )}
              <span className="text-white/70">{m.message}</span>
            </div>
          ))}
        </div>
        <form onSubmit={sendChat} className="p-3 border-t border-white/8 flex gap-2">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            className="input flex-1 py-2 text-xs" placeholder="Say something..." />
          <button type="submit" className="btn-primary px-3 py-2 text-xs">Send</button>
        </form>
      </div>

      {/* ── BUY MODAL ── */}
      {showBuyModal && pinnedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Buy Now</h3>
              <button onClick={() => setShowBuy(false)} className="text-white/40 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-4">
              <p className="font-medium text-white text-sm">{pinnedProduct.name}</p>
              <p className="text-violet-300 font-bold mt-1">₹{pinnedProduct.price}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Quantity</label>
                <select value={buyForm.quantity} onChange={e => setBuyForm(p => ({ ...p, quantity: +e.target.value }))} className="input">
                  {Array.from({ length: Math.min(pinnedProduct.stock, 5) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Shipping Address</label>
                <textarea value={buyForm.shippingAddress} onChange={e => setBuyForm(p => ({ ...p, shippingAddress: e.target.value }))}
                  className="input resize-none h-16 text-sm" placeholder="Your full address..." required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={buyForm.phone} onChange={e => setBuyForm(p => ({ ...p, phone: e.target.value }))}
                  className="input text-sm" placeholder="+91 98765 43210" required />
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-white/50">Total</span>
                <span className="font-bold text-violet-300">₹{pinnedProduct.price * buyForm.quantity}</span>
              </div>
              <button onClick={handleBuy} disabled={buying} className="btn-primary w-full">
                {buying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {buying ? 'Processing...' : '⚡ Pay with Razorpay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
