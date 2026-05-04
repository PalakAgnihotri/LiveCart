import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const viewerLinks = [
    { to: '/', label: 'Live Now' },
    { to: '/orders', label: 'My Orders' },
  ]
  const sellerLinks = [
    { to: '/seller', label: 'Dashboard' },
    { to: '/seller/streams', label: 'Streams' },
    { to: '/seller/products', label: 'Products' },
    { to: '/seller/orders', label: 'Orders' },
  ]
  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/sellers', label: 'Sellers' },
    { to: '/admin/streams', label: 'Streams' },
    { to: '/admin/orders', label: 'Orders' },
  ]

  const links = user?.role === 'seller' ? sellerLinks : user?.role === 'admin' ? adminLinks : viewerLinks

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f15]/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
        <NavLink to="/" className="font-bold text-xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          🔴 LiveCart
        </NavLink>
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/' || l.to === '/seller' || l.to === '/admin'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`
              }>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'seller' && (
            <NavLink to="/seller/streams/create"
              className="btn-primary text-xs px-3 py-1.5">
              + Go Live
            </NavLink>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
