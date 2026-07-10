
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import {
    API_URL_GROUPS,
    API_URL_USERS_LIST,
    API_URL_USERS_SEARCH_BY_QUERY
} from "../config"
import chatService from "../services/chatService"
import { useAuth } from "./AuthContext"
import { useSocket } from "./SocketContext"

const ChatContext = createContext()

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  if (!url) {
    throw new Error('URL is required for fetch request')
  }
  const cleanUrl = url.trim()
  console.log(`🔄 Chat fetch: ${cleanUrl}`)

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // Aumentar timeout

      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`✅ Chat response: ${cleanUrl} - ${response.status}`)
      return response
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn(`⏰ Timeout for ${cleanUrl} after 20 seconds`)
        throw new Error(`Timeout al conectar con el servidor. Verifica tu conexión a internet.`)
      }
      
      // Manejar errores de red específicos
      if (error.message.includes("Network request failed") || error.message.includes("Failed to fetch")) {
        console.warn(`🌐 Network error for ${cleanUrl}:`, error.message)
        if (i === retries - 1) {
          throw new Error(`Error de conexión. Verifica tu conexión a internet y vuelve a intentar.`)
        }
      } else {
        console.warn(`❌ Chat attempt ${i + 1} failed for ${cleanUrl}:`, error.message)
        if (i === retries - 1) throw error
      }
      
      // Aumentar el delay progresivamente
      const progressiveDelay = delay * (i + 1)
      await new Promise((resolve) => setTimeout(resolve, progressiveDelay))
    }
  }
  return null
}

export const ChatProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, token } = useAuth()
  const { socket, isConnected } = useSocket()
  
  // Cache para evitar llamadas repetidas
  const chatCache = useRef(new Map())
  const lastFetchTime = useRef(new Map())
  const CACHE_DURATION = 30000 // 30 segundos
  
  // Estado para sincronización automática
  const [autoSync, setAutoSync] = useState(true)
  const syncInterval = useRef(null)

  // Función para limpiar cache expirado
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now()
    for (const [key, timestamp] of lastFetchTime.current.entries()) {
      if (now - timestamp > CACHE_DURATION) {
        chatCache.current.delete(key)
        lastFetchTime.current.delete(key)
      }
    }
  }, [])

  // Función para obtener datos del cache o hacer fetch
  const getCachedOrFetch = useCallback(async (key, fetchFn) => {
    const now = Date.now()
    const lastFetch = lastFetchTime.current.get(key)
    
    // Si tenemos datos en cache y no han expirado, usarlos
    if (chatCache.current.has(key) && lastFetch && (now - lastFetch < CACHE_DURATION)) {
      console.log(`📦 Using cached data for: ${key}`)
      return chatCache.current.get(key)
    }
    
    // Si no hay cache o expiró, hacer fetch
    console.log(`🔄 Fetching fresh data for: ${key}`)
    const data = await fetchFn()
    
    // Guardar en cache
    chatCache.current.set(key, data)
    lastFetchTime.current.set(key, now)
    
    return data
  }, [])

  // Función para invalidar cache específico
  const invalidateCache = useCallback((key) => {
    chatCache.current.delete(key)
    lastFetchTime.current.delete(key)
    console.log(`🗑️ Cache invalidated for: ${key}`)
  }, [])

  // Función para invalidar todo el cache
  const invalidateAllCache = useCallback(() => {
    chatCache.current.clear()
    lastFetchTime.current.clear()
    console.log(`🗑️ All cache invalidated`)
  }, [])

  // Configurar sincronización automática con Socket.IO
  useEffect(() => {
    if (!autoSync || !user?.user_id) return

    // Inicializar servicio de chat privado de forma dinámica
    import("../services/privateChatService").then(({ default: privateChatService }) => {
      return privateChatService.initialize(user.user_id)
    }).then(() => {
      console.log('✅ PrivateChatService inicializado en contexto')
    }).catch(error => {
      console.warn('⚠️ Error inicializando PrivateChatService:', error)
    })

    // Si hay socket disponible, configurar listeners
    if (socket && isConnected) {
      // Unirse a la sala de chat del usuario
      socket.emit('join-user-chat', user.user_id)

      // Escuchar nuevos mensajes
      const handleNewMessage = (data) => {
        console.log('📨 New message received via Socket.IO:', data)
        
        // Invalidar cache relacionado
        if (data.eventId) {
          invalidateCache(`event-messages-${data.eventId}`)
          invalidateCache(`event-chats`)
        }
        if (data.senderId || data.receiverId) {
          invalidateCache(`private-messages-${data.senderId}-${data.receiverId}`)
          invalidateCache(`user-chats-${user?.user_id}`)
        }
      }

      // Escuchar cambios en chats
      const handleChatUpdate = (data) => {
        console.log('💬 Chat update received via Socket.IO:', data)
        invalidateCache('event-chats')
        invalidateCache(`user-chats-${user?.user_id}`)
      }

      socket.on('new-message', handleNewMessage)
      socket.on('chat-update', handleChatUpdate)

      // Configurar intervalo de limpieza de cache
      syncInterval.current = setInterval(cleanExpiredCache, 60000) // Limpiar cada minuto

      return () => {
        socket.off('new-message', handleNewMessage)
        socket.off('chat-update', handleChatUpdate)
        if (syncInterval.current) {
          clearInterval(syncInterval.current)
        }
        // Limpiar servicio de chat privado
        import("../services/privateChatService").then(({ default: privateChatService }) => {
          privateChatService.cleanup()
        }).catch(error => {
          console.warn('Error cleaning up privateChatService:', error)
        })
      }
    } else {
      // Sin socket, solo configurar limpieza de cache
      syncInterval.current = setInterval(cleanExpiredCache, 60000)
      
      return () => {
        if (syncInterval.current) {
          clearInterval(syncInterval.current)
        }
      }
    }
  }, [socket, isConnected, user?.user_id, autoSync, invalidateCache, cleanExpiredCache])

  const handleApiCall = useCallback(async (apiCallFn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCallFn()
      return result
    } catch (err) {
      let errorMessage = "Ocurrió un error desconocido"
      if (err instanceof Response) {
        try {
          const errorData = await err.json()
          errorMessage = errorData.message || errorData.error || `Error HTTP! estado: ${err.status}`
        } catch (parseError) {
          errorMessage = `El servidor respondió con el estado ${err.status} pero no con JSON válido`
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error("❌ Chat API Error:", errorMessage, err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }, [token])

  // --- Mensajes Privados (Uno a uno) ---
  const getPrivateMessages = useCallback(
    async (senderId, receiverId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener mensajes privados.")
      }
      
      const cacheKey = `private-messages-${senderId}-${receiverId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          console.log(`🔍 Fetching private messages between users: ${senderId} - ${receiverId}`)
          
          const result = await chatService.getMessagesBetweenUsers(senderId, receiverId)
          if (!result.success) {
            throw new Error(result.error)
          }
          
          // Validar que result.data sea un array
          if (!result.data || !Array.isArray(result.data)) {
            console.warn('getPrivateMessages: result.data is not an array:', result.data)
            return []
          }
          
          // Formatear mensajes para consistencia
          const formattedMessages = result.data.map(message => chatService.formatMessage(message))
          return formattedMessages
        })
      })
    },
    [user, handleApiCall, getCachedOrFetch],
  )

  const sendPrivateMessage = useCallback(
    async (senderId, receiverId, content, images = []) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para enviar mensajes privados.")
      }
      
      // Validar mensaje antes de enviarlo
      const validation = chatService.validateMessage(content, images)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      
      console.log(`📤 Sending private message:`, { senderId, receiverId, content, hasImages: images.length > 0 })
      
      const result = await handleApiCall(async () => {
        const serviceResult = await chatService.createPrivateMessage(senderId, receiverId, content, images)
        
        if (!serviceResult.success) {
          throw new Error(serviceResult.error)
        }
        
        // Formatear mensaje para consistencia
        const formattedMessage = chatService.formatMessage(serviceResult.data)
        console.log(`✅ Message sent successfully:`, formattedMessage)
        return formattedMessage
      })
      
      // Invalidar cache relacionado
      invalidateCache(`private-messages-${senderId}-${receiverId}`)
      invalidateCache(`user-chats-${user.user_id}`)
      
      return result
    },
    [user, handleApiCall, invalidateCache],
  )

  const getUserChats = useCallback(
    async (userId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener los chats del usuario.")
      }
      
      const cacheKey = `user-chats-${userId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          console.log(`🔍 Fetching user chats for user: ${userId}`)
          
          const result = await chatService.getUserChats(userId)
          if (!result.success) {
            throw new Error(result.error)
          }
          
          // Validar que result.data sea un array
          if (!result.data || !Array.isArray(result.data)) {
            console.warn('getUserChats: result.data is not an array:', result.data)
            return []
          }
          
          // Formatear chats para consistencia
          const formattedChats = result.data.map(chat => chatService.formatChatListItem(chat))
          return formattedChats
        })
      })
    },
    [user, handleApiCall, getCachedOrFetch],
  )

  // --- Mensajes de Eventos (Chats de grupo vinculados a eventos) ---
  const getEventMessages = useCallback(
    async (eventId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener mensajes de eventos.")
      }
      
      const cacheKey = `event-messages-${eventId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          console.log(`🔍 Fetching event messages for event: ${eventId}`)
          
          const result = await chatService.getEventMessages(eventId)
          if (!result.success) {
            throw new Error(result.error)
          }
          
          // Validar que result.data sea un array
          if (!result.data || !Array.isArray(result.data)) {
            console.warn('getEventMessages: result.data is not an array:', result.data)
            return []
          }
          
          // Formatear mensajes para consistencia
          const formattedMessages = result.data.map(message => chatService.formatMessage(message))
          return formattedMessages
        })
      })
    },
    [user, handleApiCall, getCachedOrFetch],
  )

  const sendEventMessage = useCallback(
    async (senderId, eventId, content, image = null) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para enviar mensajes de eventos.")
      }
      
      // Validar mensaje antes de enviarlo
      const validation = chatService.validateMessage(content, image ? [image] : [])
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      
      const result = await handleApiCall(async () => {
        console.log(`📤 Sending event message for event: ${eventId}`)
        
        const serviceResult = await chatService.createEventMessage(senderId, eventId, content, image)
        
        if (!serviceResult.success) {
          throw new Error(serviceResult.error)
        }
        
        // Verificar que tenemos datos válidos antes de formatear
        if (!serviceResult.data || !serviceResult.data.id) {
          console.error('❌ Event message response missing data:', serviceResult);
          throw new Error('Respuesta del servidor incompleta');
        }
        
        // Formatear mensaje para consistencia
        const formattedMessage = chatService.formatMessage(serviceResult.data)
        console.log(`✅ Event message sent successfully:`, formattedMessage)
        return formattedMessage
      })
      
      // Invalidar cache relacionado
      invalidateCache(`event-messages-${eventId}`)
      invalidateCache(`event-chats`)
      
      // Notificar via Socket.IO si está disponible
      if (socket && isConnected) {
        socket.emit('event-message-sent', {
          senderId,
          eventId,
          content,
          timestamp: new Date().toISOString()
        })
      }
      
      return result
    },
    [user, handleApiCall, socket, isConnected, invalidateCache],
  )

  // --- Chats de Grupo Generales ---
  const createGroupChat = useCallback(
    async (name, initialParticipants = []) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para crear un chat de grupo.");
      }

      // Ensure the creator is in the participants list
      const participants = [...new Set([user.user_id, ...initialParticipants])];

      const result = await handleApiCall(async () => {
        const response = await fetchWithRetry(`${API_URL_GROUPS}/create`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
            creatorId: user.user_id,
            participants,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Error al crear el chat de grupo");
        }

        return response.json();
      });
      
      // Invalidar cache relacionado
      invalidateCache('event-chats')
      invalidateCache(`user-chats-${user.user_id}`)
      
      return result;
    },
    [user, handleApiCall, getAuthHeaders, invalidateCache],
  )

  const getGroupChatMessages = useCallback(
    async (groupId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener mensajes de chat de grupo.")
      }
      
      const cacheKey = `group-messages-${groupId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          const response = await fetchWithRetry(`${API_URL_GROUPS}/${groupId}/messages`, {
            method: "GET",
            headers: getAuthHeaders(),
          })
          if (!response.ok) throw response
          return response.json()
        })
      })
    },
    [user, handleApiCall, getAuthHeaders, getCachedOrFetch],
  )

  const sendGroupChatMessage = useCallback(
    async (senderId, groupId, content) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para enviar mensajes de chat de grupo.")
      }
      
      const result = await handleApiCall(async () => {
        const response = await fetchWithRetry(`${API_URL_GROUPS}/${groupId}/messages/create`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ senderId, groupId, content }),
        })
        if (!response.ok) throw response
        return response.json()
      })
      
      // Invalidar cache relacionado
      invalidateCache(`group-messages-${groupId}`)
      invalidateCache('event-chats')
      
      // Notificar via Socket.IO si está disponible
      if (socket && isConnected) {
        socket.emit('group-message-sent', {
          senderId,
          groupId,
          content,
          timestamp: new Date().toISOString()
        })
      }
      
      return result
    },
    [user, handleApiCall, getAuthHeaders, socket, isConnected, invalidateCache],
  )

  const getGroupChatsForUser = useCallback(
    async (userId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener los chats de grupo del usuario.")
      }
      
      const cacheKey = `group-chats-${userId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          const response = await fetchWithRetry(`${API_URL_GROUPS}/user/${userId}`, {
            method: "GET",
            headers: getAuthHeaders(),
          })
          if (!response.ok) throw response
          return response.json()
        })
      })
    },
    [user, handleApiCall, getAuthHeaders, getCachedOrFetch],
  )

  const addParticipantToGroupChat = useCallback(
    async (groupId, userIdToAdd) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para añadir participantes a un chat de grupo.")
      }
      
      const result = await handleApiCall(async () => {
        const response = await fetchWithRetry(`${API_URL_GROUPS}/${groupId}/add-participant`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ userId: userIdToAdd }),
        })
        if (!response.ok) throw response
        return response.json()
      })
      
      // Invalidar cache relacionado
      invalidateCache(`group-chats-${user.user_id}`)
      invalidateCache(`group-messages-${groupId}`)
      
      return result
    },
    [user, handleApiCall, getAuthHeaders, invalidateCache],
  )

  // --- Gestión de Usuarios ---
  const getAllUsers = useCallback(async () => {
    if (!user || !user.user_id) {
      throw new Error("El usuario debe estar logueado para obtener todos los usuarios.")
    }
    
    const cacheKey = 'all-users'
    return getCachedOrFetch(cacheKey, async () => {
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_USERS_LIST, {
          method: "GET",
          headers: getAuthHeaders(),
        })
        if (!response.ok) throw response
        return response.json()
      })
    })
  }, [user, handleApiCall, getAuthHeaders, getCachedOrFetch])

  const searchUsers = useCallback(
    async (query) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para buscar usuarios.")
      }
      
      // Para búsquedas no usar cache ya que son dinámicas
      return handleApiCall(async () => {
        const response = await fetchWithRetry(`${API_URL_USERS_SEARCH_BY_QUERY}?q=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: getAuthHeaders(),
        })
        if (!response.ok) throw response
        return response.json()
      })
    },
    [user, handleApiCall, getAuthHeaders],
  )

  // Función para obtener información del usuario del chat
  const getChatUserInfo = useCallback(
    async (userId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener información del usuario del chat.")
      }
      
      return handleApiCall(async () => {
        console.log(`🔍 Fetching chat user info for user: ${userId}`)
        
        const result = await chatService.getChatUserInfo(userId)
        if (!result.success) {
          throw new Error(result.error)
        }
        
        return result.data
      })
    },
    [user, handleApiCall],
  )

  // Función para unirse al chat de un evento
  const joinEventChat = useCallback(
    async (eventId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para unirse al chat del evento.")
      }
      
      return handleApiCall(async () => {
        console.log(`👥 Joining event chat for event: ${eventId}`)
        
        const result = await chatService.joinEventChat(eventId)
        if (!result.success) {
          throw new Error(result.error)
        }
        
        // Invalidar cache relacionado
        invalidateCache(`event-messages-${eventId}`)
        invalidateCache(`event-chats`)
        
        return result.data
      })
    },
    [user, handleApiCall, invalidateCache],
  )

  // Función para obtener chats de eventos del usuario
  const getUserEventChats = useCallback(
    async (userId) => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener chats de eventos.")
      }
      
      // Para usuarios guest, devolver array vacío sin hacer llamadas API
      if (user.role === 'guest' || user.is_guest || userId.toString().startsWith('guest_')) {
        console.log('👤 Usuario guest detectado, devolviendo chats vacíos')
        return []
      }
      
      const cacheKey = `event-chats-${userId}`
      return getCachedOrFetch(cacheKey, async () => {
        return handleApiCall(async () => {
          console.log(`🔍 Fetching event chats for user: ${userId}`)
          
          const result = await chatService.getUserEventChats(userId)
          if (!result.success) {
            throw new Error(result.error)
          }
          
          // Validar que result.data sea un array
          if (!result.data || !Array.isArray(result.data)) {
            console.warn('getUserEventChats: result.data is not an array:', result.data)
            return []
          }
          
          // Formatear chats para consistencia
          const formattedChats = result.data.map(chat => chatService.formatChatListItem(chat))
          return formattedChats
        })
      })
    },
    [user, handleApiCall, getCachedOrFetch],
  )

  // Función para obtener estado de WebSocket
  const getWebSocketStatus = useCallback(
    async () => {
      if (!user || !user.user_id) {
        throw new Error("El usuario debe estar logueado para obtener el estado de WebSocket.")
      }
      
      return handleApiCall(async () => {
        console.log(`🔍 Fetching WebSocket status`)
        
        const result = await chatService.getWebSocketStatus()
        if (!result.success) {
          throw new Error(result.error)
        }
        
        return result.data
      })
    },
    [user, handleApiCall],
  )

  // Funciones de suscripción para tiempo real usando importación dinámica
  const subscribeToMessages = useCallback(async (userId1, userId2, callback) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      await privateChatService.initialize(user?.user_id)
      privateChatService.subscribeToMessages(userId1, userId2, callback)
    } catch (error) {
      console.warn('Error subscribing to messages:', error)
    }
  }, [user?.user_id])

  const unsubscribeFromMessages = useCallback(async (userId1, userId2) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      privateChatService.unsubscribeFromMessages(userId1, userId2)
    } catch (error) {
      console.warn('Error unsubscribing from messages:', error)
    }
  }, [])

  const subscribeToChatList = useCallback(async (callback) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      await privateChatService.initialize(user?.user_id)
      privateChatService.subscribeToChatList(callback)
    } catch (error) {
      console.warn('Error subscribing to chat list:', error)
    }
  }, [user?.user_id])

  const unsubscribeFromChatList = useCallback(async (callback) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      privateChatService.unsubscribeFromChatList(callback)
    } catch (error) {
      console.warn('Error unsubscribing from chat list:', error)
    }
  }, [])

  const markChatAsRead = useCallback(async (otherUserId) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      await privateChatService.initialize(user?.user_id)
      privateChatService.markChatAsRead(otherUserId)
    } catch (error) {
      console.warn('Error marking chat as read:', error)
    }
  }, [user?.user_id])

  const notifyTyping = useCallback(async (otherUserId, isTyping) => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      await privateChatService.initialize(user?.user_id)
      privateChatService.notifyTyping(otherUserId, isTyping)
    } catch (error) {
      console.warn('Error notifying typing:', error)
    }
  }, [user?.user_id])

  const getConnectionStatus = useCallback(async () => {
    try {
      const { default: privateChatService } = await import("../services/privateChatService")
      await privateChatService.initialize(user?.user_id)
      return privateChatService.getConnectionStatus()
    } catch (error) {
      console.warn('Error getting connection status:', error)
      return { isConnected: false }
    }
  }, [user?.user_id])

  const value = {
    // Mensajes privados
    getPrivateMessages,
    sendPrivateMessage,
    getUserChats,
    getChatUserInfo,
    
    // Mensajes de eventos
    getEventMessages,
    sendEventMessage,
    joinEventChat,
    getUserEventChats,
    getWebSocketStatus,
    
    // Chats de grupo (legacy)
    createGroupChat,
    getGroupChatMessages,
    sendGroupChatMessage,
    getGroupChatsForUser,
    addParticipantToGroupChat,
    
    // Gestión de usuarios
    getAllUsers,
    searchUsers,
    
    // Estado y utilidades
    loading,
    error,
    invalidateCache,
    invalidateAllCache,
    setAutoSync,
    autoSync,
    
    // Funciones de tiempo real
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToChatList,
    unsubscribeFromChatList,
    markChatAsRead,
    notifyTyping,
    getConnectionStatus,
    
    // Utilidades del servicio
    formatMessage: chatService.formatMessage,
    formatChatListItem: chatService.formatChatListItem,
    validateMessage: chatService.validateMessage,
    getUserDisplayName: chatService.getUserDisplayName,
    getUserProfilePicture: chatService.getUserProfilePicture,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat debe usarse dentro de un ChatProvider")
  }
  return context
}
