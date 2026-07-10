// services/chatService.js - Servicio completo de chat conectado al backend
import {
    BASE_URL
} from '../config';
import api from './api';

class ChatService {
  // ==================== MENSAJES PRIVADOS ====================
  
  /**
   * Obtiene información específica del usuario para el chat
   */
  async getChatUserInfo(userId) {
    try {
      console.log(`🔍 getChatUserInfo: Fetching user info for ${userId}`);
      const response = await api.get(`${BASE_URL}/users/${userId}`);
      
      console.log(`📋 getChatUserInfo response:`, {
        responseType: typeof response,
        data: response,
        hasData: !!response
      });
      
      // Manejar diferentes tipos de respuesta del backend
      let userData = response;
      
      // Si la respuesta es null o undefined, intentar fallback
      if (!userData) {
        console.warn('getChatUserInfo: No user data received, trying fallback endpoint');
        return await this.getChatUserInfoFallback(userId);
      }
      
      // Si la respuesta tiene una propiedad data, usarla
      if (userData.data) {
        userData = userData.data;
      }
      
      // Verificar que tengamos al menos un campo de identificación
      if (!userData.id && !userData.user_id) {
        console.warn('getChatUserInfo: Response missing user ID fields, trying fallback');
        return await this.getChatUserInfoFallback(userId);
      }
      
      // Verificar que el nombre no sea genérico
      if (!userData.name || userData.name === 'Usuario' || userData.name === 'Unknown') {
        console.warn('getChatUserInfo: Generic name detected, trying fallback');
        const fallbackResult = await this.getChatUserInfoFallback(userId);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
      
      console.log(`✅ getChatUserInfo: Returning user data:`, userData);
      return { success: true, data: userData };
    } catch (error) {
      console.error('❌ Error getting chat user info:', error);
      console.log('🔄 Trying fallback endpoint due to error');
      return await this.getChatUserInfoFallback(userId);
    }
  }

  /**
   * Fallback para obtener información del usuario usando el endpoint general de usuarios
   */
  async getChatUserInfoFallback(userId) {
    try {
      console.log(`🔄 getChatUserInfoFallback: Trying general users endpoint for ${userId}`);
      const response = await api.get(`${BASE_URL}/users/${userId}`);
      
      console.log(`📋 getChatUserInfoFallback response:`, {
        responseType: typeof response,
        data: response,
        hasData: !!response
      });
      
      let userData = response;
      
      if (!userData) {
        console.warn('getChatUserInfoFallback: No user data received from fallback');
        return { 
          success: false, 
          error: 'No se pudo obtener información del usuario' 
        };
      }
      
      // Si la respuesta tiene una propiedad data, usarla
      if (userData.data) {
        userData = userData.data;
      }
      
      // Normalizar los campos para que coincidan con lo que espera el frontend
      const normalizedData = {
        id: userData.user_id || userData.id,
        user_id: userData.user_id || userData.id,
        name: userData.name || userData.display_name || userData.username,
        lastname: userData.lastname || '',
        username: userData.username || '',
        display_name: userData.display_name || userData.name,
        profile_picture: userData.profile_picture || ''
      };
      
      console.log(`✅ getChatUserInfoFallback: Returning normalized data:`, normalizedData);
      return { success: true, data: normalizedData };
    } catch (error) {
      console.error('❌ Error in fallback getChatUserInfo:', error);
      return { 
        success: false, 
        error: 'Error al obtener información del usuario (fallback)' 
      };
    }
  }

  /**
   * Obtiene mensajes entre dos usuarios específicos
   */
  async getMessagesBetweenUsers(senderId, receiverId) {
    try {
      const response = await api.get(`${BASE_URL}/conversation/${receiverId}`);
      
      // El backend puede devolver el array directamente o en response.data
      let messagesData = response.data;
      
      // Si response.data es undefined, usar response directamente
      if (messagesData === undefined && Array.isArray(response)) {
        messagesData = response;
      }
      
      // Si aún es undefined, devolver array vacío
      if (messagesData === undefined) {
        console.warn('getMessagesBetweenUsers: Backend returned undefined data');
        messagesData = [];
      }
      
      return { success: true, data: messagesData };
    } catch (error) {
      console.error('❌ Error getting messages between users:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al obtener mensajes' 
      };
    }
  }

  /**
   * Crea un nuevo mensaje privado
   */
  async createPrivateMessage(senderId, receiverId, content, images = []) {
    try {
      const formData = new FormData();
      formData.append('senderId', String(senderId));
      formData.append('receiverId', String(receiverId));
      formData.append('content', content);

      // Agregar imágenes si existen
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          if (image.uri) {
            formData.append('images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || `image_${index}.jpg`,
            });
          }
        });
      }

      const response = await api.post(`${BASE_URL}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error creating private message:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al crear mensaje privado' 
      };
    }
  }

  /**
   * Obtiene la lista de chats de un usuario
   */
  async getUserChats(userId) {
    try {
      console.log('🔍 ChatService: Obteniendo chats para usuario:', userId);
      
      // Usar la ruta correcta de conversaciones
      const response = await api.get(`${BASE_URL}/conversations`);
      const chatsData = response.data || response;
      
      console.log('📋 getUserChats response:', { 
        dataType: typeof chatsData, 
        isArray: Array.isArray(chatsData),
        length: Array.isArray(chatsData) ? chatsData.length : 'N/A'
      });
      
      return { success: true, data: chatsData };
    } catch (error) {
      console.error('❌ Error getting user chats:', error);
      
      // Fallback: usar servicio de fallback
      console.log('🔄 Usando servicio de fallback para chats');
      try {
        const { default: chatFallbackService } = await import('./chatFallbackService');
        const fallbackChats = await chatFallbackService.getUserChats(userId);
        return { success: true, data: fallbackChats };
      } catch (fallbackError) {
        console.error('❌ Error también en fallback:', fallbackError);
        return { success: true, data: [] };
      }
    }
  }

  // ==================== MENSAJES DE EVENTOS ====================

  /**
   * Obtiene mensajes de un evento específico
   */
  async getEventMessages(eventId) {
    try {
      const response = await api.get(`${BASE_URL}/event-messages/${eventId}`);
      
      // El backend puede devolver el array directamente o en response.data
      let messagesData = response.data;
      
      // Si response.data es undefined, usar response directamente
      if (messagesData === undefined && Array.isArray(response)) {
        messagesData = response;
      }
      
      // Si aún es undefined, devolver array vacío
      if (messagesData === undefined) {
        console.warn('getEventMessages: Backend returned undefined data');
        messagesData = [];
      }
      
      return { success: true, data: messagesData };
    } catch (error) {
      console.error('❌ Error getting event messages:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al obtener mensajes del evento' 
      };
    }
  }

  /**
   * Crea un nuevo mensaje para un evento
   */
  async createEventMessage(senderId, eventId, content, image = null) {
    try {
      const formData = new FormData();
      formData.append('senderId', String(senderId));
      formData.append('eventId', String(eventId));
      formData.append('content', content);

      // Agregar imagen si existe
      if (image && image.uri) {
        formData.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || 'event_message_image.jpg',
        });
      }

      const response = await api.post(`${BASE_URL}/event-messages/create-message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Event message created, response:', response.data);
      
      // Verificar que la respuesta tenga los datos necesarios
      if (!response.data) {
        console.warn('⚠️ Event message response is empty, but status is success');
        // Crear un objeto de respuesta mínimo si el backend no devuelve datos
        const fallbackData = {
          id: Date.now(), // ID temporal
          senderId: senderId,
          eventId: eventId,
          content: content,
          image: image?.uri || null,
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        return { success: true, data: fallbackData };
      }
      
      // Si no tiene ID, agregarlo
      if (!response.data.id) {
        console.warn('⚠️ Event message response missing id, adding fallback');
        response.data.id = Date.now();
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error creating event message:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al crear mensaje del evento' 
      };
    }
  }

  /**
   * Obtiene el estado de las conexiones WebSocket
   */
  async getWebSocketStatus() {
    try {
      const response = await api.get(`${BASE_URL}/event-messages/websocket/status`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error getting WebSocket status:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al obtener estado de WebSocket' 
      };
    }
  }

  /**
   * Unirse al chat de un evento
   */
  async joinEventChat(eventId) {
    try {
      const response = await api.post(`${BASE_URL}/event-messages/events/${eventId}/join-chat`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error joining event chat:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al unirse al chat del evento' 
      };
    }
  }

  /**
   * Obtiene la lista de chats de eventos para un usuario
   */
  async getUserEventChats(userId) {
    try {
      console.log(`🔍 Fetching event chats for user ${userId} from: ${BASE_URL}/event-messages/events/chat-list/${userId}`);
      const response = await api.get(`${BASE_URL}/event-messages/events/chat-list/${userId}`);
      
      console.log(`📋 getUserEventChats response:`, {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A',
        data: response.data
      });
      
      // El backend puede devolver el array directamente o en response.data
      let chatsData = response.data;
      
      // Si response.data es undefined, usar response directamente
      if (chatsData === undefined && Array.isArray(response)) {
        chatsData = response;
        console.log('📋 Using response directly as chatsData');
      }
      
      // Si aún es undefined, devolver array vacío
      if (chatsData === undefined) {
        console.warn('getUserEventChats: Backend returned undefined data');
        chatsData = [];
      }
      
      console.log(`✅ Returning ${Array.isArray(chatsData) ? chatsData.length : 0} event chats`);
      return { success: true, data: chatsData };
    } catch (error) {
      console.error('❌ Error getting user event chats:', error);
      
      // Si es un error HTTP 500, intentar un fallback
      if (error.response?.status === 500) {
        console.log('🔄 HTTP 500 detected, trying fallback approach...');
        try {
          // Fallback: obtener eventos suscritos y construir la lista manualmente
          const { interactionService } = await import('./index');
          const subscribedEventsResponse = await interactionService.getUserSubscribedEvents(userId);
          
          if (subscribedEventsResponse?.data?.subscribedEventIds) {
            console.log('✅ Using fallback: subscribed events approach');
            return { 
              success: true, 
              data: subscribedEventsResponse.data.subscribedEventIds.map(eventId => ({
                event_id: eventId,
                title: `Event ${eventId}`,
                last_message: null,
                last_message_date: null
              }))
            };
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback also failed:', fallbackError.message);
        }
      }
      
      return { 
        success: false, 
        error: error.response?.status === 500 
          ? 'Servidor temporalmente no disponible. Usando datos locales.'
          : error.response?.data?.error || 'Error al obtener chats de eventos del usuario' 
      };
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatea un mensaje para mostrar en la UI
   */
  formatMessage(message) {
    return {
      id: message.id,
      content: message.content || '',
      image: message.image || [],
      createdAt: new Date(message.createdAt || message.created_at || Date.now()),
      created_at: message.createdAt || message.created_at || new Date().toISOString(),
      sender: {
        id: message.sender?.id || message.senderId || message.senderid,
        name: message.sender?.name || message.sender?.display_name || message.sender?.username || 'Usuario',
        lastname: message.sender?.lastname || '',
        profile_picture: message.sender?.profile_picture || '',
        display_name: message.sender?.display_name || message.sender?.name || message.sender?.username || 'Usuario',
        username: message.sender?.username || '',
      },
      receiver: message.receiver ? {
        id: message.receiver.id || message.receiverId || message.receiverid,
        name: message.receiver.name || message.receiver.display_name || message.receiver.username || 'Usuario',
        lastname: message.receiver.lastname || '',
        profile_picture: message.receiver.profile_picture || '',
        display_name: message.receiver.display_name || message.receiver.name || message.receiver.username || 'Usuario',
        username: message.receiver.username || '',
      } : null,
      eventId: message.eventId || message.event_id || null,
    };
  }

  /**
   * Formatea una conversación para mostrar en la lista de chats
   */
  formatChatListItem(chat) {
    // Obtener el mejor nombre disponible
    const getBestName = () => {
      const possibleNames = [
        chat.name,
        chat.display_name,
        chat.username
      ].filter(name => name && 
                      name.trim() !== '' && 
                      name !== 'Usuario' && 
                      name !== 'Unknown' && 
                      name !== 'Unknown User' &&
                      !name.startsWith('User '));
      
      if (possibleNames.length > 0) {
        return possibleNames[0];
      }
      
      // Si no hay nombres válidos, crear uno descriptivo
      const userId = chat.userId || chat.user_id;
      return userId ? `Usuario ${userId}` : 'Usuario Desconocido';
    };

    const bestName = getBestName();

    return {
      userId: chat.userId || chat.user_id,
      name: bestName,
      lastname: chat.lastname || '',
      username: chat.username || '',
      display_name: chat.display_name || bestName,
      profile_picture: chat.profile_picture || '',
      lastMessage: chat.lastMessage || chat.last_message || '',
      lastMessageDate: new Date(chat.lastMessageDate || chat.last_message_date || Date.now()),
      // Para chats de eventos
      eventId: chat.event_id || null,
      title: chat.title || null,
      cover_image: chat.cover_image || null,
      last_sender: chat.last_sender || null,
    };
  }

  /**
   * Valida si un mensaje es válido antes de enviarlo
   */
  validateMessage(content, images = []) {
    if (!content || content.trim().length === 0) {
      if (!images || images.length === 0) {
        return { valid: false, error: 'El mensaje debe tener contenido o al menos una imagen' };
      }
    }

    if (content && content.length > 1000) {
      return { valid: false, error: 'El mensaje no puede tener más de 1000 caracteres' };
    }

    if (images && images.length > 5) {
      return { valid: false, error: 'No se pueden enviar más de 5 imágenes por mensaje' };
    }

    return { valid: true };
  }

  /**
   * Obtiene el nombre de visualización de un usuario
   */
  getUserDisplayName(user) {
    if (!user) return 'Usuario';
    
    // Priorizar diferentes campos de nombre
    const name = user.display_name || user.name || user.username;
    
    // Validar que el nombre no sea un placeholder
    if (name && 
        name !== "Unknown" && 
        name !== "Unknown User" && 
        name !== "Usuario Desconocido" &&
        !name.startsWith("User ")) {
      return name;
    }
    
    // Si tenemos un ID válido, crear un nombre más descriptivo
    if (user.id || user.user_id) {
      return `Usuario ${user.id || user.user_id}`;
    }
    
    return 'Usuario';
  }

  /**
   * Obtiene la URL de la imagen de perfil de un usuario
   */
  getUserProfilePicture(user) {
    if (!user) return null;
    
    // Intentar diferentes campos de imagen, igual que UserAvatar
    let imageUrl = null;
    
    if (user.profile_picture && 
        user.profile_picture !== "" && 
        !user.profile_picture.includes("placeholder")) {
      imageUrl = user.profile_picture;
    } else if (user.avatar && 
               user.avatar !== "" && 
               !user.avatar.includes("placeholder")) {
      imageUrl = user.avatar;
    }
    
    if (!imageUrl) return null;
    
    // Usar la misma función de normalización que UserAvatar
    const { normalizeImageUrl } = require('../utils/image');
    return normalizeImageUrl(imageUrl);
  }
}

export default new ChatService();