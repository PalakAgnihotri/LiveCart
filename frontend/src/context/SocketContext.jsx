import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)
export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }) {
  const { user }      = useAuth()
  const socketRef     = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const apiURL = import.meta.env.VITE_API_URL || 'https://livecart-hgcs.onrender.com'
    socketRef.current = io(apiURL, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    })
    socketRef.current.on('connect', () => setReady(true))
    if (user) socketRef.current.emit('user:online', user._id)

    return () => { socketRef.current?.disconnect(); setReady(false) }
  }, [user])

  const emit = (event, data) => socketRef.current?.emit(event, data)
  const on   = (event, cb)   => socketRef.current?.on(event, cb)
  const off  = (event, cb)   => socketRef.current?.off(event, cb)

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, ready, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  )
}
