import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('lc_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('lc_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('lc_token', r.data.token)
    setUser(r.data.user); return r.data.user
  }

  const register = async (data) => {
    const r = await api.post('/auth/register', data)
    localStorage.setItem('lc_token', r.data.token)
    setUser(r.data.user); return r.data.user
  }

  const logout = () => { localStorage.removeItem('lc_token'); setUser(null) }
  const updateUser = (u) => setUser(p => ({ ...p, ...u }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
