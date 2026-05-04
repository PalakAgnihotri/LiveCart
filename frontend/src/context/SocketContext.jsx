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
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
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
