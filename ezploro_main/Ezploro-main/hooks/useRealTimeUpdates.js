import { useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

/**
 * Hook personalizado para manejar actualizaciones en tiempo real
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onNewEvent - Callback para nuevos eventos
 * @param {Function} options.onEventUpdated - Callback para eventos actualizados
 * @param {Function} options.onEventDeleted - Callback para eventos eliminados
 * @param {Function} options.onLikeUpdated - Callback para likes actualizados
 * @param {Function} options.onSubscriptionUpdated - Callback para suscripciones actualizadas
 * @param {Function} options.onNewMessage - Callback para nuevos mensajes
 * @param {Function} options.onNewNotification - Callback para nuevas notificaciones
 * @param {boolean} options.autoJoinUserRoom - Si debe unirse automáticamente a la sala del usuario
 */
export const useRealTimeUpdates = (options = {}) => {
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()

  const {
    onNewEvent,
    onEventUpdated,
    onEventDeleted,
    onLikeUpdated,
    onSubscriptionUpdated,
    onNewMessage,
    onNewNotification,
    autoJoinUserRoom = true
  } = options

  // Función para unirse a la sala del usuario
  const joinUserRoom = useCallback(() => {
    if (socket && isConnected && user?.user_id && autoJoinUserRoom) {
      console.log(`🔌 Uniéndose a la sala del usuario: ${user.user_id}`)
      socket.emit('join-user-room', user.user_id)
    }
  }, [socket, isConnected, user?.user_id, autoJoinUserRoom])

  // Función para unirse a la sala de un evento específico
  const joinEventRoom = useCallback((eventId) => {
    if (socket && isConnected && eventId) {
      console.log(`🔌 Uniéndose a la sala del evento: ${eventId}`)
      socket.emit('join-event-room', eventId)
    }
  }, [socket, isConnected])

  // Función para salir de la sala de un evento específico
  const leaveEventRoom = useCallback((eventId) => {
    if (socket && isConnected && eventId) {
      console.log(`🔌 Saliendo de la sala del evento: ${eventId}`)
      socket.emit('leave-event-room', eventId)
    }
  }, [socket, isConnected])

  // Configurar listeners de Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log('🔌 Configurando listeners de tiempo real...')

    // Unirse a la sala del usuario automáticamente
    joinUserRoom()

    // Listeners para eventos
    if (onNewEvent) {
      const handleNewEvent = (eventData) => {
        console.log('🆕 Nuevo evento recibido:', eventData)
        onNewEvent(eventData)
      }
      socket.on('new-event', handleNewEvent)
    }

    if (onEventUpdated) {
      const handleEventUpdated = (eventData) => {
        console.log('📝 Evento actualizado:', eventData)
        onEventUpdated(eventData)
      }
      socket.on('event-updated', handleEventUpdated)
    }

    if (onEventDeleted) {
      const handleEventDeleted = (data) => {
        console.log('🗑️ Evento eliminado:', data)
        onEventDeleted(data.eventId || data)
      }
      socket.on('event-deleted', handleEventDeleted)
    }

    // Listeners para interacciones
    if (onLikeUpdated) {
      const handleLikeUpdated = (data) => {
        console.log('❤️ Like actualizado:', data)
        onLikeUpdated(data)
      }
      socket.on('like-updated', handleLikeUpdated)
    }

    if (onSubscriptionUpdated) {
      const handleSubscriptionUpdated = (data) => {
        console.log('🔔 Suscripción actualizada:', data)
        onSubscriptionUpdated(data)
      }
      socket.on('subscription-updated', handleSubscriptionUpdated)
    }

    // Listeners para mensajes
    if (onNewMessage) {
      const handleNewMessage = (messageData) => {
        console.log('💬 Nuevo mensaje recibido:', messageData)
        onNewMessage(messageData)
      }
      socket.on('new-message', handleNewMessage)
      socket.on('eventMessage', handleNewMessage) // Compatibilidad con el sistema existente
      socket.on('privateMessage', handleNewMessage) // Compatibilidad con el sistema existente
    }

    // Listeners para notificaciones
    if (onNewNotification) {
      const handleNewNotification = (notificationData) => {
        console.log('🔔 Nueva notificación recibida:', notificationData)
        onNewNotification(notificationData)
      }
      socket.on('new-notification', handleNewNotification)
    }

    // Cleanup function
    return () => {
      console.log('🔌 Limpiando listeners de tiempo real...')
      if (onNewEvent) socket.off('new-event')
      if (onEventUpdated) socket.off('event-updated')
      if (onEventDeleted) socket.off('event-deleted')
      if (onLikeUpdated) socket.off('like-updated')
      if (onSubscriptionUpdated) socket.off('subscription-updated')
      if (onNewMessage) {
        socket.off('new-message')
        socket.off('eventMessage')
        socket.off('privateMessage')
      }
      if (onNewNotification) socket.off('new-notification')
    }
  }, [
    socket,
    isConnected,
    onNewEvent,
    onEventUpdated,
    onEventDeleted,
    onLikeUpdated,
    onSubscriptionUpdated,
    onNewMessage,
    onNewNotification,
    joinUserRoom
  ])

  return {
    isConnected,
    joinUserRoom,
    joinEventRoom,
    leaveEventRoom,
    socket
  }
}

export default useRealTimeUpdates