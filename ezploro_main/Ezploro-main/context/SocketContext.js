import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "./AuthContext"
import socketService from "../services/socketService"

const SocketContext = createContext({ 
  socket: null, 
  isConnected: false, 
  connectionStatus: null,
  reconnect: () => {},
  isAvailable: false 
})

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)

  useEffect(() => {
    let isMounted = true
    const setup = async () => {
      if (user?.user_id) {
        try {
          await socketService.connect(user.user_id)
          const status = socketService.getConnectionStatus()
          if (isMounted) {
            setIsConnected(status.isConnected)
            setConnectionStatus(status)
          }
        } catch (error) {
          console.warn("⚠️ Socket setup failed:", error?.message || error)
          if (isMounted) {
            setIsConnected(false)
            setConnectionStatus({ isConnected: false, error: error?.message })
          }
        }
      } else {
        socketService.disconnect()
        if (isMounted) {
          setIsConnected(false)
          setConnectionStatus(null)
        }
      }
    }
    
    setup()
    
    // Configurar un intervalo para verificar el estado de conexión
    const interval = setInterval(() => {
      if (isMounted && user?.user_id) {
        const status = socketService.getConnectionStatus()
        setIsConnected(status.isConnected)
        setConnectionStatus(status)
      }
    }, 10000) // Verificar cada 10 segundos
    
    return () => {
      isMounted = false
      clearInterval(interval)
      socketService.removeAllListeners()
      socketService.disconnect()
    }
  }, [user?.user_id])

  const reconnect = async () => {
    try {
      await socketService.reconnect()
      const status = socketService.getConnectionStatus()
      setIsConnected(status.isConnected)
      setConnectionStatus(status)
    } catch (error) {
      console.warn("⚠️ Manual reconnection failed:", error?.message || error)
    }
  }

  const value = useMemo(
    () => ({ 
      socket: socketService.socket, 
      isConnected, 
      connectionStatus,
      reconnect,
      isAvailable: socketService.isSocketAvailable()
    }),
    [isConnected, connectionStatus, reconnect]
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)

