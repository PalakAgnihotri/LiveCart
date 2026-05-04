import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'viewer', storeName: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const user = await register(form)
      toast.success('Account created!')
      if (user.role === 'seller') navigate('/seller')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f15]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.1),transparent_60%)] pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">Join LiveCart</h1>
          <p className="text-white/50 text-sm">Watch live, shop instantly</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input" placeholder="Your name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input" placeholder="you@email.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input" placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div>
              <label className="label">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ val: 'viewer', label: '🛍️ Shop & Watch' }, { val: 'seller', label: '🔴 Sell Live' }].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setForm(p => ({ ...p, role: opt.val }))}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                      form.role === opt.val
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                        : 'border-white/10 text-white/50 hover:border-white/20'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {form.role === 'seller' && (
              <>
                <div>
                  <label className="label">Store Name</label>
                  <input value={form.storeName} onChange={e => setForm(p => ({ ...p, storeName: e.target.value }))}
                    className="input" placeholder="e.g. Priya's Boutique" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="input" placeholder="+91 98765 43210" />
                </div>
                <p className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                  ⚠️ Seller accounts require admin approval before going live.
                </p>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-white/40 mt-5">
          Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
