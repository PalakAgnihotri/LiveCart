import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar  from './components/shared/Navbar'
import Spinner from './components/shared/Spinner'

// Auth pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Viewer pages
import Home       from './pages/viewer/Home'
import StreamView from './pages/viewer/StreamView'
import MyOrders   from './pages/viewer/MyOrders'

// Seller pages
import SellerDashboard from './pages/seller/Dashboard'
import SellerStreams    from './pages/seller/Streams'
import CreateStream     from './pages/seller/CreateStream'
import StreamStudio     from './pages/seller/StreamStudio'
import SellerProducts   from './pages/seller/Products'
import SellerOrders     from './pages/seller/Orders'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminSellers   from './pages/admin/Sellers'
import AdminStreams    from './pages/admin/Streams'
import AdminOrders    from './pages/admin/Orders'

const Guard = ({ children, role }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner full />
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner full />
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin" replace />
    if (user.role === 'seller') return <Navigate to="/seller" replace />
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      {user && <Navbar />}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* Viewer */}
          <Route path="/"              element={<Guard><Home /></Guard>} />
          <Route path="/stream/:roomId" element={<Guard><StreamView /></Guard>} />
          <Route path="/orders"         element={<Guard role="viewer"><MyOrders /></Guard>} />

          {/* Seller */}
          <Route path="/seller"                   element={<Guard role="seller"><SellerDashboard /></Guard>} />
          <Route path="/seller/streams"            element={<Guard role="seller"><SellerStreams /></Guard>} />
          <Route path="/seller/streams/create"     element={<Guard role="seller"><CreateStream /></Guard>} />
          <Route path="/seller/streams/:id/studio" element={<Guard role="seller"><StreamStudio /></Guard>} />
          <Route path="/seller/products"           element={<Guard role="seller"><SellerProducts /></Guard>} />
          <Route path="/seller/orders"             element={<Guard role="seller"><SellerOrders /></Guard>} />

          {/* Admin */}
          <Route path="/admin"          element={<Guard role="admin"><AdminDashboard /></Guard>} />
          <Route path="/admin/sellers"  element={<Guard role="admin"><AdminSellers /></Guard>} />
          <Route path="/admin/streams"  element={<Guard role="admin"><AdminStreams /></Guard>} />
          <Route path="/admin/orders"   element={<Guard role="admin"><AdminOrders /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
