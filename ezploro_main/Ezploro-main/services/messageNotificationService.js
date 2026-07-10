import { notificationService } from './notificationService'
import { BASE_URL_IMAGE } from '../config'
import AsyncStorage from '@react-native-async-storage/async-storage'

class MessageNotificationService {
  /**
   * Enviar notificación cuando se recibe un mensaje privado
   */
  async sendMessageNotification(senderId, receiverId, messageContent, conversationId) {
    try {
      // Obtener información del remitente
      const token = await AsyncStorage.getItem('token')
      const senderResponse = await fetch(`${BASE_URL_IMAGE}/api/users/${senderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!senderResponse.ok) return

      const senderData = await senderResponse.json()
      const sender = senderData.data || senderData

      const shortMessage = messageContent.length > 50 
        ? messageContent.substring(0, 50) + '...' 
        : messageContent

      // Enviar notificación local
      await notificationService.sendLocalNotification(
        `Nuevo mensaje de ${sender.display_name || sender.username}`,
        shortMessage,
        {
          type: 'message',
          senderId: senderId.toString(),
          conversationId: conversationId?.toString(),
          deepLink: `chat/${conversationId || senderId}`
        }
      )

      console.log('Message notification sent successfully')
    } catch (error) {
      console.error('Error sending message notification:', error)
    }
  }

  /**
   * Enviar notificación cuando se recibe un mensaje de grupo
   */
  async sendGroupMessageNotification(senderId, groupId, messageContent, groupName) {
    try {
      const token = await AsyncStorage.getItem('token')
      const senderResponse = await fetch(`${BASE_URL_IMAGE}/api/users/${senderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!senderResponse.ok) return

      const senderData = await senderResponse.json()
      const sender = senderData.data || senderData

      const shortMessage = messageContent.length > 50 
        ? messageContent.substring(0, 50) + '...' 
        : messageContent

      await notificationService.sendLocalNotification(
        `${sender.display_name || sender.username} en ${groupName}`,
        shortMessage,
        {
          type: 'group_message',
          senderId: senderId.toString(),
          groupId: groupId.toString(),
          deepLink: `group/${groupId}`
        }
      )

      console.log('Group message notification sent successfully')
    } catch (error) {
      console.error('Error sending group message notification:', error)
    }
  }

  /**
   * Enviar notificación cuando alguien se une a un evento
   */
  async sendEventJoinNotification(userId, eventId, eventTitle, organizerId) {
    try {
      if (userId === organizerId) return // No notificar al organizador

      const token = await AsyncStorage.getItem('token')
      const userResponse = await fetch(`${BASE_URL_IMAGE}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!userResponse.ok) return

      const userData = await userResponse.json()
      const user = userData.data || userData

      await notificationService.sendLocalNotification(
        'Nuevo asistente a tu evento',
        `${user.display_name || user.username} se unió a "${eventTitle}"`,
        {
          type: 'event_join',
          userId: userId.toString(),
          eventId: eventId.toString(),
          deepLink: `event/${eventId}`
        }
      )

      console.log('Event join notification sent successfully')
    } catch (error) {
      console.error('Error sending event join notification:', error)
    }
  }

  /**
   * Enviar notificación de recordatorio de evento
   */
  async sendEventReminderNotification(eventId, eventTitle, eventDate) {
    try {
      const eventDateTime = new Date(eventDate)
      const now = new Date()
      const timeDiff = eventDateTime - now
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60))

      let message = ''
      if (hoursLeft < 1) {
        message = `¡Tu evento "${eventTitle}" comienza en menos de 1 hora!`
      } else if (hoursLeft < 24) {
        message = `¡Tu evento "${eventTitle}" comienza en ${hoursLeft} horas!`
      } else {
        const daysLeft = Math.floor(hoursLeft / 24)
        message = `¡Tu evento "${eventTitle}" comienza en ${daysLeft} días!`
      }

      await notificationService.sendLocalNotification(
        'Recordatorio de evento',
        message,
        {
          type: 'event_reminder',
          eventId: eventId.toString(),
          deepLink: `event/${eventId}`
        }
      )

      console.log('Event reminder notification sent successfully')
    } catch (error) {
      console.error('Error sending event reminder notification:', error)
    }
  }

  /**
   * Enviar notificación cuando alguien comenta en un evento
   */
  async sendEventCommentNotification(commenterId, eventId, eventTitle, commentText, eventOwnerId) {
    try {
      if (commenterId === eventOwnerId) return // No notificar al dueño del evento

      const token = await AsyncStorage.getItem('token')
      const commenterResponse = await fetch(`${BASE_URL_IMAGE}/api/users/${commenterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!commenterResponse.ok) return

      const commenterData = await commenterResponse.json()
      const commenter = commenterData.data || commenterData

      const shortComment = commentText.length > 50 
        ? commentText.substring(0, 50) + '...' 
        : commentText

      await notificationService.sendLocalNotification(
        'Nuevo comentario en tu evento',
        `${commenter.display_name || commenter.username}: "${shortComment}"`,
        {
          type: 'event_comment',
          commenterId: commenterId.toString(),
          eventId: eventId.toString(),
          deepLink: `event/${eventId}`
        }
      )

      console.log('Event comment notification sent successfully')
    } catch (error) {
      console.error('Error sending event comment notification:', error)
    }
  }

  /**
   * Enviar notificación cuando alguien da like a un evento
   */
  async sendEventLikeNotification(likerId, eventId, eventTitle, eventOwnerId) {
    try {
      if (likerId === eventOwnerId) return // No notificar al dueño del evento

      const token = await AsyncStorage.getItem('token')
      const likerResponse = await fetch(`${BASE_URL_IMAGE}/api/users/${likerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!likerResponse.ok) return

      const likerData = await likerResponse.json()
      const liker = likerData.data || likerData

      await notificationService.sendLocalNotification(
        '¡Nuevo like en tu evento!',
        `${liker.display_name || liker.username} le dio like a "${eventTitle}"`,
        {
          type: 'event_like',
          likerId: likerId.toString(),
          eventId: eventId.toString(),
          deepLink: `event/${eventId}`
        }
      )

      console.log('Event like notification sent successfully')
    } catch (error) {
      console.error('Error sending event like notification:', error)
    }
  }

  /**
   * Función de prueba para enviar notificaciones locales
   */
  async sendTestNotification(type = 'test', title = 'Test Notification', message = 'This is a test notification') {
    try {
      console.log('📱 Sending test notification:', { type, title, message })
      
      const result = await notificationService.sendLocalNotification(
        title,
        message,
        {
          type: type,
          timestamp: Date.now(),
          deepLink: 'event/123' // Link de prueba
        },
        type === 'message' ? 'message' : 'event'
      )

      if (result) {
        console.log('✅ Test notification sent successfully with ID:', result)
        return result
      } else {
        console.error('❌ Failed to send test notification')
        return null
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error)
      return null
    }
  }

  /**
   * Crear notificación de prueba en el servidor
   */
  async createServerTestNotification(userId) {
    try {
      console.log('🔔 Creating test notification on server for user:', userId)
      
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${BASE_URL_IMAGE}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: 'Notificación de Prueba',
          message: 'Esta es una notificación de prueba creada desde la app',
          type: 'test',
          priority: 'normal',
          data: {
            type: 'test',
            timestamp: Date.now(),
            deepLink: 'event/123'
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Server error:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Test notification created on server:', result)
      return result
    } catch (error) {
      console.error('❌ Error creating server test notification:', error)
      return null
    }
  }

  /**
   * Crear múltiples notificaciones de prueba
   */
  async createMultipleTestNotifications(userId) {
    try {
      console.log('🔔 Creating multiple test notifications...')
      
      const notifications = [
        {
          title: '🎉 Nuevo evento disponible',
          message: 'Hay un nuevo evento de música en tu área',
          type: 'event',
          data: { eventId: '123', deepLink: 'event/123' }
        },
        {
          title: '❤️ Alguien le gustó tu evento',
          message: 'Juan Pérez le dio like a tu evento "Concierto de Rock"',
          type: 'like',
          data: { eventId: '456', userId: '789', deepLink: 'event/456' }
        },
        {
          title: '💬 Nuevo comentario',
          message: 'María comentó en tu evento: "¡Se ve increíble!"',
          type: 'comment',
          data: { eventId: '456', commentId: '101', deepLink: 'event/456' }
        },
        {
          title: '👥 Nuevo seguidor',
          message: 'Carlos Rodríguez comenzó a seguirte',
          type: 'follow',
          data: { userId: '202', deepLink: 'profile/202' }
        },
        {
          title: '📅 Recordatorio de evento',
          message: 'Tu evento "Festival de Jazz" comienza en 2 horas',
          type: 'event_reminder',
          data: { eventId: '789', deepLink: 'event/789' }
        }
      ]

      const results = []
      for (const notification of notifications) {
        const result = await this.createServerTestNotification(userId, notification)
        if (result) {
          results.push(result)
        }
        // Pequeño delay entre notificaciones
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('✅ Created', results.length, 'test notifications')
      return results
    } catch (error) {
      console.error('❌ Error creating multiple test notifications:', error)
      return []
    }
  }

  /**
   * Crear notificación de prueba en el servidor con datos personalizados
   */
  async createServerTestNotification(userId, notificationData = {}) {
    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${BASE_URL_IMAGE}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: notificationData.title || 'Notificación de Prueba',
          message: notificationData.message || 'Esta es una notificación de prueba',
          type: notificationData.type || 'test',
          priority: notificationData.priority || 'normal',
          data: notificationData.data || { type: 'test', timestamp: Date.now() }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Server error:', errorText)
        return null
      }

      const result = await response.json()
      console.log('✅ Notification created on server:', result)
      return result
    } catch (error) {
      console.error('❌ Error creating server notification:', error)
      return null
    }
  }

  /**
   * Función para programar una notificación de recordatorio
   */
  async scheduleTestReminder(delayInSeconds = 10) {
    try {
      const triggerDate = new Date(Date.now() + (delayInSeconds * 1000))
      
      console.log('⏰ Scheduling test reminder for:', triggerDate)
      
      const result = await notificationService.scheduleNotification(
        'Recordatorio de Evento',
        `Tu evento comienza en ${delayInSeconds} segundos (esto es una prueba)`,
        triggerDate,
        {
          type: 'event_reminder',
          timestamp: Date.now(),
          deepLink: 'event/123'
        }
      )

      if (result) {
        console.log('✅ Test reminder scheduled successfully with ID:', result)
        return result
      } else {
        console.error('❌ Failed to schedule test reminder')
        return null
      }
    } catch (error) {
      console.error('❌ Error scheduling test reminder:', error)
      return null
    }
  }
}

export default new MessageNotificationService()