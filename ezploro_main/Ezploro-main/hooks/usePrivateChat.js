// hooks/usePrivateChat.js - Hook para manejar chat privado con Socket.IO
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import privateChatService from '../services/privateChatService'

export const usePrivateChat = (otherUserId) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserInfo, setOtherUserInfo] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  
  const messagesRef = useRef([])
  const isInitialized = useRef(false)

  // Inicializar chat
  useEffect(() => {
    if (!user?.user_id || !otherUserId || isInitialized.current) return

    const initializeChat = async () => {
      try {
        setLoading(true)
        setError(null)

        // Inicializar servicio de chat privado
        await privateChatService.initialize(user.user_id)

        // Obtener información del otro usuario
        const userInfo = await privateChatService.getChatUserInfo(otherUserId)
        setOtherUserInfo(userInfo)

        // Obtener mensajes existentes
        const existingMessages = await privateChatService.getMessagesBetweenUsers(
          user.user_id, 
          otherUserId
        )
        
        setMessages(existingMessages)
        messagesRef.current = existingMessages

        // Suscribirse a nuevos mensajes
        privateChatService.subscribeToMessages(user.user_id, otherUserId, (newMessage) => {
          console.log('📨 Nuevo mensaje recibido en hook:', newMessage)
          
          setMessages(prev => {
            const updated = [...prev, newMessage]
            messagesRef.current = updated
            return updated
          })
        })

        // Marcar chat como leído
        privateChatService.markChatAsRead(otherUserId)

        isInitialized.current = true

      } catch (err) {
        console.error('❌ Error inicializando chat:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeChat()

    // Cleanup
    return () => {
      if (isInitialized.current) {
        privateChatService.unsubscribeFromMessages(user.user_id, otherUserId)
        isInitialized.current = false
      }
    }
  }, [user?.user_id, otherUserId])

  // Enviar mensaje
  const sendMessage = useCallback(async (content, images = []) => {
    if (!user?.user_id || !otherUserId || !content.trim()) {
      return { success: false, error: 'Datos inválidos para enviar mensaje' }
    }

    try {
      setError(null)

      // Crear mensaje optimista para UI inmediata
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        content: content.trim(),
        senderId: user.user_id,
        receiverId: otherUserId,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.user_id,
          name: user.name || user.display_name || 'Tú',
          profile_picture: user.profile_picture || ''
        },
        receiver: otherUserInfo,
        isOptimistic: true
      }

      // Agregar mensaje optimista a la UI
      setMessages(prev => {
        const updated = [...prev, optimisticMessage]
        messagesRef.current = updated
        return updated
      })

      // Enviar mensaje real
      const sentMessage = await privateChatService.sendPrivateMessage(
        user.user_id,
        otherUserId,
        content.trim(),
        images
      )

      // Reemplazar mensaje optimista con el real
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        )
        messagesRef.current = updated
        return updated
      })

      return { success: true, data: sentMessage }

    } catch (err) {
      console.error('❌ Error enviando mensaje:', err)
      
      // Remover mensaje optimista en caso de error
      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== optimisticMessage.id)
        messagesRef.current = updated
        return updated
      })

      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [user, otherUserId, otherUserInfo])

  // Marcar como leído
  const markAsRead = useCallback(() => {
    if (otherUserId) {
      privateChatService.markChatAsRead(otherUserId)
    }
  }, [otherUserId])

  // Recargar mensajes
  const refreshMessages = useCallback(async () => {
    if (!user?.user_id || !otherUserId) return

    try {
      setLoading(true)
      setError(null)

      const freshMessages = await privateChatService.getMessagesBetweenUsers(
        user.user_id,
        otherUserId
      )

      setMessages(freshMessages)
      messagesRef.current = freshMessages

    } catch (err) {
      console.error('❌ Error refrescando mensajes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, otherUserId])

  // Obtener mensajes más recientes
  const getLatestMessages = useCallback(() => {
    return messagesRef.current
  }, [])

  return {
    messages,
    loading,
    error,
    isTyping,
    otherUserInfo,
    isOnline,
    sendMessage,
    markAsRead,
    refreshMessages,
    getLatestMessages,
    // Utilidades
    isInitialized: isInitialized.current,
    messageCount: messages.length
  }
}

export default usePrivateChat