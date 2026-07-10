// hooks/useChatList.js - Hook para manejar lista de chats privados
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import privateChatService from '../services/privateChatService'

export const useChatList = () => {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const chatsRef = useRef([])
  const isInitialized = useRef(false)
  const lastFetchTime = useRef(0)

  // Inicializar lista de chats
  useEffect(() => {
    if (!user?.user_id || isInitialized.current) return

    const initializeChatList = async () => {
      try {
        setLoading(true)
        setError(null)

        // Inicializar servicio de chat privado
        await privateChatService.initialize(user.user_id)

        // Suscribirse a actualizaciones de lista
        privateChatService.subscribeToChatList((updatedChats) => {
          console.log('📋 Lista de chats actualizada:', updatedChats.length)
          
          // Ordenar por mensaje más reciente
          const sortedChats = updatedChats.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime || 0).getTime()
            const timeB = new Date(b.lastMessageTime || 0).getTime()
            return timeB - timeA
          })

          setChats(sortedChats)
          chatsRef.current = sortedChats
        })

        // Cargar chats iniciales
        await loadChats()

        isInitialized.current = true

      } catch (err) {
        console.error('❌ Error inicializando lista de chats:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeChatList()

    // Cleanup
    return () => {
      if (isInitialized.current) {
        privateChatService.unsubscribeFromChatList((updatedChats) => {
          setChats(updatedChats)
        })
        isInitialized.current = false
      }
    }
  }, [user?.user_id])

  // Cargar chats
  const loadChats = useCallback(async (forceRefresh = false) => {
    if (!user?.user_id) return

    // Debouncing para evitar llamadas múltiples
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime.current < 2000) {
      console.log('🔄 Debouncing chat list fetch')
      return
    }
    lastFetchTime.current = now

    try {
      if (!forceRefresh) setLoading(true)
      setError(null)

      const chatList = await privateChatService.getUserChats(user.user_id)
      
      // Procesar y enriquecer datos de chats
      const processedChats = await Promise.all(
        chatList.map(async (chat) => {
          try {
            // Obtener información actualizada del usuario si es necesario
            let userInfo = chat
            
            if (!chat.name || chat.name === 'Usuario' || chat.name.startsWith('Usuario ')) {
              try {
                userInfo = await privateChatService.getChatUserInfo(chat.userId)
              } catch (userError) {
                console.warn('⚠️ Error obteniendo info de usuario:', userError)
              }
            }

            return {
              userId: chat.userId,
              name: userInfo.name || chat.name || `Usuario ${chat.userId}`,
              lastname: userInfo.lastname || chat.lastname || '',
              username: userInfo.username || chat.username || '',
              display_name: userInfo.display_name || chat.display_name || userInfo.name || chat.name,
              profile_picture: userInfo.profile_picture || chat.profile_picture || '',
              lastMessage: chat.lastMessage || 'No hay mensajes',
              lastMessageTime: chat.lastMessageTime || new Date().toISOString(),
              unreadCount: chat.unreadCount || 0,
              isOnline: chat.isOnline || false,
              sortTime: new Date(chat.lastMessageTime || 0).getTime()
            }
          } catch (processError) {
            console.error('❌ Error procesando chat:', processError)
            return chat
          }
        })
      )

      // Ordenar por mensaje más reciente
      const sortedChats = processedChats.sort((a, b) => b.sortTime - a.sortTime)

      setChats(sortedChats)
      chatsRef.current = sortedChats

      console.log(`✅ Cargados ${sortedChats.length} chats`)

    } catch (err) {
      console.error('❌ Error cargando chats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.user_id])

  // Refrescar lista
  const refreshChats = useCallback(async () => {
    setRefreshing(true)
    await loadChats(true)
  }, [loadChats])

  // Solicitar actualización via Socket.IO
  const requestUpdate = useCallback(() => {
    privateChatService.requestChatListUpdate()
  }, [])

  // Marcar chat como leído
  const markChatAsRead = useCallback((otherUserId) => {
    privateChatService.markChatAsRead(otherUserId)
    
    // Actualizar estado local
    setChats(prev => prev.map(chat => 
      chat.userId === otherUserId 
        ? { ...chat, unreadCount: 0 }
        : chat
    ))
  }, [])

  // Obtener chat específico
  const getChatByUserId = useCallback((userId) => {
    return chatsRef.current.find(chat => chat.userId === userId)
  }, [])

  // Obtener conteo total de mensajes no leídos
  const getTotalUnreadCount = useCallback(() => {
    return chatsRef.current.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
  }, [])

  // Buscar chats
  const searchChats = useCallback((query) => {
    if (!query.trim()) return chatsRef.current

    const searchTerm = query.toLowerCase().trim()
    return chatsRef.current.filter(chat => 
      chat.name?.toLowerCase().includes(searchTerm) ||
      chat.username?.toLowerCase().includes(searchTerm) ||
      chat.display_name?.toLowerCase().includes(searchTerm) ||
      chat.lastMessage?.toLowerCase().includes(searchTerm)
    )
  }, [])

  return {
    chats,
    loading,
    error,
    refreshing,
    loadChats,
    refreshChats,
    requestUpdate,
    markChatAsRead,
    getChatByUserId,
    getTotalUnreadCount,
    searchChats,
    // Utilidades
    isInitialized: isInitialized.current,
    chatCount: chats.length
  }
}

export default useChatList