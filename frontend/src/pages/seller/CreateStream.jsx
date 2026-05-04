import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function CreateStream() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ title: '', description: '', scheduledAt: '', productIds: [] })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/products/my').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  const toggleProduct = (id) => {
    setForm(p => ({
      ...p,
      productIds: p.productIds.includes(id)
        ? p.productIds.filter(x => x !== id)
        : [...p.productIds, id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const { data } = await api.post('/streams', form)
      toast.success('Stream created!')
      navigate(`/seller/streams/${data._id}/studio`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create stream')
    } finally { setLoading(false) }
  }

  return (
    <div className="page max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Create Stream</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Stream Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" placeholder="e.g. Summer Kurta Sale — Flat 40% Off!" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none h-20 text-sm" placeholder="What will you be selling today?" />
          </div>
          <div>
            <label className="label">Schedule (optional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              className="input" />
            <p className="text-xs text-white/30 mt-1">Leave empty to start immediately</p>
          </div>
        </div>

        {/* Product selection */}
        <div className="card p-6">
          <label className="label mb-4">Select Products to Showcase</label>
          {products.length === 0 ? (
            <p className="text-white/40 text-sm">No products yet — <a href="/seller/products" className="text-violet-400">add products first</a></p>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map(p => (
                <label key={p._id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.productIds.includes(p._id)
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/8 hover:border-white/15'
                  }`}>
                  <input type="checkbox" checked={form.productIds.includes(p._id)}
                    onChange={() => toggleProduct(p._id)} className="accent-violet-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-white/40">₹{p.price} · {p.stock} in stock</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🔴'}
          {loading ? 'Creating...' : 'Create & Enter Studio'}
        </button>
      </form>
    </div>
  )
}
