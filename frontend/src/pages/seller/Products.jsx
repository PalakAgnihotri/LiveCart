import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const CATEGORIES = ['general','clothing','electronics','food','beauty','sports','home','books','other']

const emptyForm = { name: '', description: '', price: '', originalPrice: '', stock: '', category: 'general' }

export default function SellerProducts() {
  const [products, setProducts]   = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)

  const load = () => api.get('/products/my').then(r => setProducts(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form)
        toast.success('Product updated!')
      } else {
        await api.post('/products', form)
        toast.success('Product added!')
      }
      setForm(emptyForm); setShowForm(false); setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, originalPrice: p.originalPrice, stock: p.stock, category: p.category })
    setEditing(p._id); setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/50 text-sm mt-1">{products.length} products in your catalogue</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true) }} className="btn-primary">
          + Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-white mb-4">{editing ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input" placeholder="e.g. Cotton Kurta — Blue" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="input resize-none h-16 text-sm" placeholder="Describe your product..." />
            </div>
            <div>
              <label className="label">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="input" placeholder="599" required min="0" />
            </div>
            <div>
              <label className="label">Original Price (₹)</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))}
                className="input" placeholder="999" min="0" />
            </div>
            <div>
              <label className="label">Stock *</label>
              <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                className="input" placeholder="50" required min="0" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input capitalize">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-white/40">No products yet — add your first product!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p._id} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-medium text-white text-sm">{p.name}</h3>
                  <p className="text-xs text-white/40 capitalize mt-0.5">{p.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-violet-300">₹{p.price}</span>
                {p.originalPrice > p.price && <span className="text-xs text-white/30 line-through">₹{p.originalPrice}</span>}
              </div>
              <p className="text-xs text-white/40 mb-4 line-clamp-2">{p.description}</p>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="btn-outline text-xs px-3 py-1.5 flex-1">Edit</button>
                <button onClick={() => handleDelete(p._id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
