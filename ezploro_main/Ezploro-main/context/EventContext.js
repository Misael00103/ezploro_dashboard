import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { API_URL_EVENTS } from "../config"
import { eventService, interactionService } from "../services"
import debugLogger from "../utils/debugLogger"
import { normalizeImageUrl } from "../utils/image"
import { useAuth } from "./AuthContext"
import { useSocket } from "./SocketContext"

// Debug: verificar importaciones (se puede remover en producción)
console.log("🔧 EventContext: Servicios importados correctamente")

const EventContext = createContext()

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([])
  const [likedEvents, setLikedEvents] = useState([])
  const [subscribedEvents, setSubscribedEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Memoizar el user para evitar re-renders
  const { user, isGuest } = useAuth()
  const { socket, isConnected } = useSocket()
  const stableUser = useMemo(() => user, [user?.user_id])

  // Usar ref para evitar re-renders por cambios de user_id
  const userIdRef = useRef(stableUser?.user_id)
  const hasInitialLoadRef = useRef(false)

  // Solo log cuando realmente cambie algo importante
  useEffect(() => {
    if (userIdRef.current !== stableUser?.user_id) {
      console.log("🔧 EventProvider - user changed:", stableUser?.user_id)
      userIdRef.current = stableUser?.user_id
    }
  }, [stableUser?.user_id])

  // Estabilizar el user_id para evitar cambios constantes
  const stableUserId = user?.user_id
  
  // Refs para control de llamadas
  const fetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const lastParamsRef = useRef(null)
  
  const fetchEvents = useCallback(async (params = {}) => {
    // Debug: contar llamadas para detectar loops
    const callCount = debugLogger.logWithCounter(
      'fetchEvents', 
      '🎉 fetchEvents llamado', 
      { params, eventsCount: events.length, url: `${API_URL_EVENTS}` }
    )
    
    // Evitar múltiples llamadas simultáneas
    if (fetchingRef.current) {
      debugLogger.throttledLog('fetchEvents-busy', "⏳ fetchEvents ya en progreso, ignorando llamada duplicada")
      return events
    }
    
    // Throttling más suave: evitar llamadas muy frecuentes (menos de 2 segundos)
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    
    // Comparar parámetros para evitar llamadas idénticas
    const paramsString = JSON.stringify(params)
    const lastParamsString = JSON.stringify(lastParamsRef.current)
    
    if (timeSinceLastFetch < 2000 && paramsString === lastParamsString) {
      debugLogger.throttledLog('fetchEvents-throttled', "🚫 fetchEvents throttled - mismos parámetros y muy reciente", {
        timeSinceLastFetch: `${timeSinceLastFetch}ms`,
        params,
        callCount
      })
      return events // Retornar eventos actuales
    }
    
    // Throttling adicional más suave: si hay muchas llamadas en poco tiempo, bloquear temporalmente
    if (callCount > 10 && timeSinceLastFetch < 5000) {
      debugLogger.throttledLog('fetchEvents-blocked', "🛑 fetchEvents bloqueado temporalmente - demasiadas llamadas", {
        callCount,
        timeSinceLastFetch: `${timeSinceLastFetch}ms`
      })
      return events // Retornar eventos actuales
    }
    
    fetchingRef.current = true
    lastFetchTimeRef.current = now
    lastParamsRef.current = params
    
    debugLogger.logOnChange('fetchEvents-execute', "🚀 Ejecutando fetchEvents", { 
      params, 
      callCount,
      timeSinceLastFetch: `${timeSinceLastFetch}ms`
    })
    
    setLoading(true)
    setError(null)
    
    try {
      console.log("🚀 EventContext: Llamando a eventService.getEvents con params:", params)
      const data = await eventService.getEvents(params)
      console.log("📦 EventContext: Respuesta cruda del servicio:", {
        data,
        type: typeof data, 
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
      })
      
      debugLogger.logOnChange('fetchEvents-response', "📦 Datos recibidos", { 
        type: typeof data, 
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0
      })
      
      if (Array.isArray(data)) {
        const validEvents = data.map((event) => ({
          ...event,
          tickets: event.tickets || [],
          likes: event.likes || 0,
          subscribers_count: event.subscribers_count || 0,
          subscribers: event.subscribers || [],
          // Normalizar URLs de imágenes (limpia blobs y arregla URLs malformadas)
          cover_image: normalizeImageUrl(event.cover_image)
        }))
        setEvents(validEvents)
        debugLogger.logOnChange('fetchEvents-success', "✅ Eventos obtenidos exitosamente", { 
          count: validEvents.length,
          callCount
        })
        return validEvents
      } else {
        console.warn("⚠️ Datos no son un array:", data)
        setEvents([])
        return []
      }
    } catch (e) {
      console.error("❌ Error al obtener eventos:", e)
      setError(e.message)
      setEvents([])
      return []
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, []) // Remover dependencia de events para evitar bucle infinito

  const fetchLikedEvents = useCallback(async (userId) => {
    if (!userId) {
      setLikedEvents([])
      return
    }
    try {
      const data = await interactionService.getUserLikedEvents(parseInt(userId))
      setLikedEvents(Array.isArray(data?.likedEventIds) ? data.likedEventIds : [])
    } catch (error) {
      console.error("❌ Error obteniendo likes:", error)
      setLikedEvents([])
    }
  }, []) // Sin dependencias del user_id

  const fetchSubscribedEvents = useCallback(async (userId) => {
    if (!userId) {
      setSubscribedEvents([])
      return
    }
    try {
      const data = await interactionService.getUserSubscribedEvents(userId)
      setSubscribedEvents(Array.isArray(data?.subscribedEventIds) ? data.subscribedEventIds : [])
    } catch (error) {
      console.error("❌ Error obteniendo suscripciones:", error)
      setSubscribedEvents([])
    }
  }, []) // Sin dependencias del user_id

  const createEvent = useCallback(async (eventData) => {
    try {
      console.log('📤 EventContext: Creando evento con FormData');
      const newEvent = await eventService.createEvent(eventData)
      const eventWithDefaults = {
        ...newEvent,
        tickets: newEvent.tickets || [],
        likes: newEvent.likes || 0,
        subscribers_count: newEvent.subscribers_count || 0,
        subscribers: newEvent.subscribers || [],
      }
      setEvents(prev => [eventWithDefaults, ...prev])

      // Emitir evento de Socket.IO para notificar a otros usuarios
      if (socket && isConnected) {
        socket.emit('event-created', eventWithDefaults)
      }

      return newEvent
    } catch (error) {
      console.error("❌ Error creando evento:", error)
      throw error
    }
  }, [socket, isConnected])

  const updateEvent = useCallback(async (eventId, eventData) => {
    try {
      const updatedEvent = await eventService.updateEvent(eventId, eventData)
      const updatedEventWithDefaults = {
        ...updatedEvent,
        tickets: updatedEvent.tickets || [],
        likes: updatedEvent.likes || 0,
        subscribers_count: updatedEvent.subscribers_count || 0,
        subscribers: updatedEvent.subscribers || [],
      }
      
      setEvents(prev => prev.map(event => 
        event.event_id === eventId ? { ...event, ...updatedEventWithDefaults } : event
      ))

      // Emitir evento de Socket.IO para notificar a otros usuarios
      if (socket && isConnected) {
        socket.emit('event-updated', updatedEventWithDefaults)
      }

      return updatedEvent
    } catch (error) {
      console.error("❌ Error actualizando evento:", error)
      throw error
    }
  }, [socket, isConnected])

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await eventService.deleteEvent(eventId)
      setEvents(prev => prev.filter(event => event.event_id !== eventId))

      // Emitir evento de Socket.IO para notificar a otros usuarios
      if (socket && isConnected) {
        socket.emit('event-deleted', { eventId })
      }

      return { success: true }
    } catch (error) {
      console.error("❌ Error eliminando evento:", error)
      return { success: false, message: error.message }
    }
  }, [socket, isConnected])

  const likeEvent = useCallback(async (eventId) => {
    const currentUserId = userIdRef.current
    if (!currentUserId) {
      throw new Error("Usuario no autenticado")
    }
    
    try {
      console.log('🔄 EventContext: Toggling like for event:', eventId, 'user:', currentUserId)
      const data = await interactionService.toggleEventLike(parseInt(eventId), parseInt(currentUserId))
      console.log('📦 EventContext: Toggle response:', data)
      
      // Determinar si se agregó o eliminó el like basado en diferentes posibles respuestas
      const isLiked = data.liked === true || 
                     data.message?.toLowerCase().includes('agregado') || 
                     data.message?.toLowerCase().includes('added') ||
                     data.message?.toLowerCase().includes('like agregado') ||
                     data.action === 'added'
      
      const isUnliked = data.liked === false || 
                       data.message?.toLowerCase().includes('eliminado') || 
                       data.message?.toLowerCase().includes('removed') ||
                       data.message?.toLowerCase().includes('like eliminado') ||
                       data.action === 'removed'
      
      console.log('👍 Like status:', { isLiked, isUnliked, message: data.message, rawData: data })
      
      // Actualizar estado local de eventos likeados
      setLikedEvents(prev => {
        const currentLiked = Array.isArray(prev) ? prev : []
        const eventIdNum = parseInt(eventId)
        
        if (isLiked) {
          const newLiked = currentLiked.includes(eventIdNum) ? currentLiked : [...currentLiked, eventIdNum]
          console.log('👍 Adding like, new liked events:', newLiked)
          return newLiked
        } else if (isUnliked) {
          const newLiked = currentLiked.filter(id => id !== eventIdNum)
          console.log('👍 Removing like, new liked events:', newLiked)
          return newLiked
        }
        
        // Si no podemos determinar el estado, toggle basado en estado actual
        const wasLiked = currentLiked.includes(eventIdNum)
        const newLiked = wasLiked 
          ? currentLiked.filter(id => id !== eventIdNum)
          : [...currentLiked, eventIdNum]
        console.log('👍 Toggling like (fallback), was liked:', wasLiked, 'new liked events:', newLiked)
        return newLiked
      })

      // Actualizar contador de likes en la lista de eventos
      const likesCount = data.like_count || data.likes_count || data.count || 0
      console.log('👍 Updating events list with likes count:', likesCount)
      setEvents(prev => prev.map(event => 
        event.event_id == eventId ? { 
          ...event, 
          likes: likesCount,
          likes_count: likesCount 
        } : event
      ))

      // Emitir evento de Socket.IO para notificar a otros usuarios
      if (socket && isConnected) {
        socket.emit('event-like-changed', {
          eventId: parseInt(eventId),
          userId: parseInt(currentUserId),
          action: isLiked ? 'added' : (isUnliked ? 'removed' : 'toggled'),
          likesCount: likesCount
        })
      }

      console.log('✅ EventContext: Like state updated successfully')
      return { ...data, like_count: likesCount, likes_count: likesCount }
    } catch (error) {
      console.error("❌ Error en like:", error)
      throw error
    }
  }, [socket, isConnected])

  const subscribeToEvent = useCallback(async (eventId) => {
    const currentUserId = userIdRef.current
    if (!currentUserId) return
    
    try {
      console.log(`📝 Subscribing to event ${eventId} for user ${currentUserId}`);
      const data = await interactionService.toggleEventSubscription(parseInt(eventId), parseInt(currentUserId))
      console.log(`✅ Subscription response:`, data);
      
      // Actualizar estado local inmediatamente para mejor UX
      setSubscribedEvents(prev => {
        const currentSubscribed = Array.isArray(prev) ? prev : []
        if (data.message === "Suscripción agregada") {
          return currentSubscribed.includes(parseInt(eventId)) ? currentSubscribed : [...currentSubscribed, parseInt(eventId)]
        } else if (data.message === "Suscripción eliminada") {
          return currentSubscribed.filter(id => id !== parseInt(eventId))
        }
        return currentSubscribed
      })

      setEvents(prev => prev.map(event => 
        event.event_id === eventId ? { ...event, subscribers_count: data.subscribers_count || 0 } : event
      ))

      // Emitir evento de Socket.IO para notificar a otros usuarios
      if (socket && isConnected) {
        socket.emit('event-subscription-changed', {
          eventId: parseInt(eventId),
          userId: parseInt(currentUserId),
          action: data.message === "Suscripción agregada" ? 'added' : 'removed',
          subscribersCount: data.subscribers_count || 0
        })
      }

      return data
    } catch (error) {
      console.error("❌ Error en suscripción:", {
        error: error.message,
        eventId,
        currentUserId,
        stack: error.stack
      })
      throw error
    }
  }, [socket, isConnected]) // Agregar dependencias de socket

  const getEventDetails = useCallback(async (eventId) => {
    try {
      const eventDetails = await eventService.getEventById(eventId)
      return {
        ...eventDetails,
        tickets: eventDetails.tickets || [],
        likes: eventDetails.likes || 0,
        subscribers_count: eventDetails.subscribers_count || 0,
        subscribers: eventDetails.subscribers || [],
      }
    } catch (error) {
      console.error("❌ Error obteniendo detalles:", error)
      throw error
    }
  }, [])

  const getEventLikes = useCallback(async (eventId) => {
    if (isGuest || user?.role === 'guest' || user?.is_guest || user?.user_id?.toString().startsWith('guest_')) {
      console.log("�Y'� getEventLikes: usuario guest, omitiendo llamada API")
      return 0
    }

    console.log("🔧 getEventLikes llamado con eventId:", eventId)
    if (!eventId || eventId === "undefined" || eventId === "null" || eventId === "") {
      console.warn("⚠️ getEventLikes: eventId inválido:", eventId)
      return 0
    }

    try {
      console.log("🔧 getEventLikes: llamando a interactionService.getEventLikesCount")
      const data = await interactionService.getEventLikesCount(eventId)
      console.log("🔧 getEventLikes: respuesta recibida:", data)
      return data.like_count || data.likes_count || data.likes || data.count || 0
    } catch (error) {
      console.error("❌ Error al obtener los likes del evento:", error.message)
      return 0
    }
  }, [isGuest, user?.is_guest, user?.role, user?.user_id])

  const getEventSubscribers = useCallback(async (eventId) => {
    if (isGuest || user?.role === 'guest' || user?.is_guest || user?.user_id?.toString().startsWith('guest_')) {
      console.log("�Y'� getEventSubscribers: usuario guest, omitiendo llamada API")
      return 0
    }
    console.log("🔧 getEventSubscribers llamado con eventId:", eventId)
    if (!eventId || eventId === "undefined" || eventId === "null" || eventId === "") {
      console.warn("⚠️ getEventSubscribers: eventId inválido:", eventId)
      return 0
    }

    try {
      console.log("🔧 getEventSubscribers: llamando a interactionService.getEventSubscriptionsCount")
      const data = await interactionService.getEventSubscriptionsCount(eventId)
      console.log("🔧 getEventSubscribers: respuesta recibida:", data)
      return data.subscribers_count || data.subscribers || data.count || 0
    } catch (error) {
      console.error("❌ Error al obtener los suscriptores del evento:", error.message)
      return 0
    }
  }, [isGuest, user?.is_guest, user?.role, user?.user_id])

  const clearEventData = useCallback(() => {
    setEvents([])
    setLikedEvents([])
    setSubscribedEvents([])
    setError(null)
    setLoading(false)
    hasInitialLoadRef.current = false
  }, [])

  const addEventToList = useCallback((event) => {
    const eventWithDefaults = {
      ...event,
      tickets: event.tickets || [],
      likes: event.likes || 0,
      subscribers_count: event.subscribers_count || 0,
      subscribers: event.subscribers || [],
    }
    
    setEvents(prev => {
      // Verificar si el evento ya existe para evitar duplicados
      const eventId = event.event_id || event.id
      const existingIndex = prev.findIndex(e => (e.event_id || e.id) === eventId)
      
      if (existingIndex !== -1) {
        // Si existe, reemplazarlo
        console.log('🔄 Actualizando evento existente:', eventId)
        const newEvents = [...prev]
        newEvents[existingIndex] = eventWithDefaults
        return newEvents
      } else {
        // Si no existe, agregarlo al principio
        console.log('➕ Agregando nuevo evento:', eventId)
        return [eventWithDefaults, ...prev]
      }
    })
  }, [])



  // Cargar datos cuando el usuario esté disponible - EVENTOS, LIKES Y SUBSCRIPCIONES
  useEffect(() => {
    // Si cambió el usuario, resetear flag de carga inicial
    if (userIdRef.current !== stableUser?.user_id) {
      hasInitialLoadRef.current = false
      userIdRef.current = stableUser?.user_id
    }
    
    if (stableUser?.user_id && !hasInitialLoadRef.current) {
      console.log("👤 Usuario detectado, cargando eventos, likes y subscripciones...")
      hasInitialLoadRef.current = true
      
      // Cargar eventos siempre (tanto para usuarios reales como invitados)
      fetchEvents()
      
      // Solo cargar likes y subscripciones para usuarios reales (no invitados)
      if (!stableUser.is_guest && stableUser.role !== 'guest') {
        fetchLikedEvents(stableUser.user_id)
        fetchSubscribedEvents(stableUser.user_id)
      } else {
        console.log("👤 Usuario invitado detectado, solo cargando eventos...")
        setLikedEvents([])
        setSubscribedEvents([])
      }
    } else if (!stableUser?.user_id) {
      console.log("👤 No hay usuario, cargando eventos públicos...")
      // Incluso sin usuario, cargar eventos públicos
      if (!hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true
        fetchEvents()
      }
      setLikedEvents([])
      setSubscribedEvents([])
    }
  }, [stableUser?.user_id]) // Solo depender del user_id para evitar bucles

  // Función pública para refrescar datos manualmente
  const refreshAllData = useCallback(async () => {
    if (!user?.user_id) return
    
    console.log("🔄 Refrescando todos los datos...")
    await Promise.all([
      fetchEvents(),
      fetchLikedEvents(user.user_id),
      fetchSubscribedEvents(user.user_id)
    ])
  }, [user?.user_id]) // Removemos las dependencias circulares

  // Socket.IO listeners para actualizaciones en tiempo real
  useEffect(() => {
    if (!socket || !isConnected || !user?.user_id) return

    console.log("🔌 Configurando listeners de Socket.IO para eventos...")

    // Unirse a la sala del usuario para recibir notificaciones
    socket.emit('join-user-room', user.user_id)

    // Listener para nuevos eventos
    const handleNewEvent = (eventData) => {
      console.log("🆕 Nuevo evento recibido via Socket.IO:", eventData)
      const eventWithDefaults = {
        ...eventData,
        tickets: eventData.tickets || [],
        likes: eventData.likes || 0,
        subscribers_count: eventData.subscribers_count || 0,
        subscribers: eventData.subscribers || [],
      }
      setEvents(prev => [eventWithDefaults, ...prev])
    }

    // Listener para eventos actualizados
    const handleEventUpdated = (eventData) => {
      console.log("📝 Evento actualizado via Socket.IO:", eventData)
      setEvents(prev => prev.map(event => 
        event.event_id === eventData.event_id ? { ...event, ...eventData } : event
      ))
    }

    // Listener para eventos eliminados
    const handleEventDeleted = (eventId) => {
      console.log("🗑️ Evento eliminado via Socket.IO:", eventId)
      setEvents(prev => prev.filter(event => event.event_id !== eventId))
    }

    // Listener para likes actualizados
    const handleLikeUpdated = (data) => {
      console.log("❤️ Like actualizado via Socket.IO:", data)
      const { eventId, userId, action, likesCount } = data
      
      // Actualizar la lista de eventos likeados del usuario
      if (userId === user.user_id) {
        setLikedEvents(prev => {
          const currentLiked = Array.isArray(prev) ? prev : []
          if (action === 'added') {
            return currentLiked.includes(parseInt(eventId)) ? currentLiked : [...currentLiked, parseInt(eventId)]
          } else if (action === 'removed') {
            return currentLiked.filter(id => id !== parseInt(eventId))
          }
          return currentLiked
        })
      }

      // Actualizar el contador de likes en la lista de eventos
      setEvents(prev => prev.map(event => 
        event.event_id === eventId ? { ...event, likes: likesCount || 0 } : event
      ))
    }

    // Listener para suscripciones actualizadas
    const handleSubscriptionUpdated = (data) => {
      console.log("🔔 Suscripción actualizada via Socket.IO:", data)
      const { eventId, userId, action, subscribersCount } = data
      
      // Actualizar la lista de eventos suscritos del usuario
      if (userId === user.user_id) {
        setSubscribedEvents(prev => {
          const currentSubscribed = Array.isArray(prev) ? prev : []
          if (action === 'added') {
            return currentSubscribed.includes(parseInt(eventId)) ? currentSubscribed : [...currentSubscribed, parseInt(eventId)]
          } else if (action === 'removed') {
            return currentSubscribed.filter(id => id !== parseInt(eventId))
          }
          return currentSubscribed
        })
      }

      // Actualizar el contador de suscriptores en la lista de eventos
      setEvents(prev => prev.map(event => 
        event.event_id === eventId ? { ...event, subscribers_count: subscribersCount || 0 } : event
      ))
    }

    // Registrar listeners
    socket.on('new-event', handleNewEvent)
    socket.on('event-updated', handleEventUpdated)
    socket.on('event-deleted', handleEventDeleted)
    socket.on('like-updated', handleLikeUpdated)
    socket.on('subscription-updated', handleSubscriptionUpdated)

    // Cleanup
    return () => {
      socket.off('new-event', handleNewEvent)
      socket.off('event-updated', handleEventUpdated)
      socket.off('event-deleted', handleEventDeleted)
      socket.off('like-updated', handleLikeUpdated)
      socket.off('subscription-updated', handleSubscriptionUpdated)
    }
  }, [socket, isConnected, user?.user_id])

  // Memoizar el value del contexto para evitar re-renders
  const value = useMemo(() => ({
    events: Array.isArray(events) ? events : [],
    loading,
    error,
    likedEvents: Array.isArray(likedEvents) ? likedEvents : [],
    subscribedEvents: Array.isArray(subscribedEvents) ? subscribedEvents : [],
    fetchEvents,
    fetchLikedEvents: () => fetchLikedEvents(stableUser?.user_id),
    fetchSubscribedEvents: () => fetchSubscribedEvents(stableUser?.user_id),
    refreshAllData,
    createEvent,
    updateEvent,
    deleteEvent,
    likeEvent,
    subscribeToEvent,
    getEventDetails,
    getEventLikes,
    getEventSubscribers,
    clearEventData,
    addEventToList,
    setEvents: (newEvents) => setEvents(Array.isArray(newEvents) ? newEvents : []),
  }), [
    events,
    loading,
    error,
    likedEvents,
    subscribedEvents,
    fetchEvents,
    fetchLikedEvents,
    fetchSubscribedEvents,
    refreshAllData,
    createEvent,
    updateEvent,
    deleteEvent,
    likeEvent,
    subscribeToEvent,
    getEventDetails,
    getEventLikes,
    getEventSubscribers,
    clearEventData,
    addEventToList,
    stableUser?.user_id
  ])

  // Solo log cuando realmente cambie el contexto
  useEffect(() => {
    console.log("🔧 EventProvider - Context value updated:", {
      eventsCount: value.events.length,
      loading: value.loading,
      error: value.error,
      hasInitialLoad: hasInitialLoadRef.current,
    })
  }, [value.events.length, value.loading, value.error])

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}

export const useEvents = () => {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error("useEvents debe usarse dentro de un EventProvider")
  }
  return context
}
