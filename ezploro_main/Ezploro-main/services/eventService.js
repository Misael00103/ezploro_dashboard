// services/eventService.js
import {
    API_URL_EVENTS,
    API_URL_EVENTS_ATTENDEES_CONFIRM,
    API_URL_EVENTS_ATTENDEES_LIST,
    API_URL_EVENTS_BY_ID,
    API_URL_EVENTS_BY_LIKES,
    API_URL_EVENTS_CREATE,
    API_URL_EVENTS_DELETE,
    API_URL_EVENTS_FILTER_STATUS,
    API_URL_EVENTS_INSIGHTS,
    API_URL_EVENTS_RECOMMENDATIONS,
    API_URL_EVENTS_SUBSCRIBERS,
    API_URL_EVENTS_THIS_WEEK,
    API_URL_EVENTS_UPDATE,
    API_URL_EVENT_SUBSCRIPTIONS_BY_USER
} from '../config';
import api from './api';

export const eventService = {
  getEvents: async (params = {}) => {
    const timestamp = Date.now()
    const queryParams = new URLSearchParams({ t: timestamp })
    
    // Agregar parámetros de filtrado si existen
    if (params.category) queryParams.append('category', params.category)
    if (params.subcategory) queryParams.append('subcategory', params.subcategory)
    if (params.online !== undefined) queryParams.append('online', params.online)
    if (params.search) queryParams.append('search', params.search)
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params.longitude) queryParams.append('longitude', params.longitude)
    if (params.latitude) queryParams.append('latitude', params.latitude)
    if (params.radius) queryParams.append('radius', params.radius)
    if (params.popularity) queryParams.append('popularity', params.popularity)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.offset) queryParams.append('offset', params.offset)
    
    const url = `${API_URL_EVENTS}?${queryParams.toString()}`
    console.log("🔗 eventService.getEvents URL:", url)
    
    try {
      const response = await api.get(url)
      console.log("✅ eventService.getEvents response:", {
        type: typeof response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'N/A',
        sample: Array.isArray(response) ? response.slice(0, 2) : response
      })
      return response
    } catch (error) {
      console.error("❌ eventService.getEvents error:", error)
      throw error
    }
  },
  getEventById: (id) => api.get(API_URL_EVENTS_BY_ID.replace(':id', id)),
  createEvent: async (eventData) => {
    console.log("🚀 eventService.createEvent llamado con:", JSON.stringify(eventData, null, 2));
    console.log("📡 URL de la API:", API_URL_EVENTS_CREATE);
    
    // Debug del token antes de hacer la request
    try {
      const { debugToken, testTokenWithBackend } = require('../utils/tokenDebug');
      await debugToken();
      
      // Test del token con el backend (no bloquear si falla)
      console.log('🔍 Testing token with backend before creating event...');
      const tokenIsValid = await testTokenWithBackend();
      if (!tokenIsValid) {
        console.warn('⚠️ Token validation failed, but proceeding with event creation...');
      }
    } catch (debugError) {
      console.warn('⚠️ Token debug failed, but proceeding with event creation:', debugError.message);
    }
    
    // Verificar que hay un token válido antes de proceder
    await api.ensureValidToken();
    
    try {
      const coverImg = eventData.coverImageFile || eventData.cover_image || eventData.image || eventData.cover;
      
      if (coverImg) {
        const formData = new FormData();

        if (typeof coverImg === 'object' && coverImg.uri) {
          formData.append('cover_image', coverImg);
        } else if (typeof coverImg === 'string' && coverImg.trim()) {
          const trimmed = coverImg.trim();
          if (
            trimmed.startsWith('file://') ||
            trimmed.startsWith('content://') ||
            trimmed.startsWith('ph://') ||
            trimmed.startsWith('assets-library://') ||
            trimmed.startsWith('data:image/')
          ) {
            const imageType = trimmed.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
            formData.append('cover_image', {
              uri: trimmed,
              type: imageType,
              name: `event_${Date.now()}.${imageType.split('/')[1]}`,
            });
          } else {
            formData.append('cover_image', trimmed);
          }
        }
        
        // Agregar todos los otros campos, excluyendo campos de imagen
        Object.keys(eventData).forEach(key => {
          if (
            key !== 'coverImageFile' &&
            key !== 'cover_image' &&
            key !== 'image' &&
            key !== 'cover' &&
            eventData[key] !== null &&
            eventData[key] !== undefined &&
            eventData[key] !== ''
          ) {
            try {
              if (key === 'faqs') {
                if (!Array.isArray(eventData[key]) || eventData[key].length === 0) {
                  console.warn(`⚠️ Campo 'faqs' no es un array válido o está vacío:`, eventData[key]);
                  return;
                }
                formData.append(key, JSON.stringify(eventData[key]));
              } else if (key === 'location') {
                if (typeof eventData[key] !== 'object' || eventData[key] === null) {
                  console.warn(`⚠️ Campo 'location' no es un objeto válido:`, eventData[key]);
                  return;
                }
                formData.append(key, JSON.stringify(eventData[key]));
              } else if (typeof eventData[key] === 'boolean') {
                formData.append(key, eventData[key] ? 'true' : 'false');
              } else {
                formData.append(key, String(eventData[key]));
              }
            } catch (serializationError) {
              console.error(`❌ Error serializando campo '${key}':`, serializationError, 'Valor:', eventData[key]);
              throw new Error(`Error al serializar el campo '${key}': ${serializationError.message}`);
            }
          }
        });
        
        console.log('📤 Enviando FormData al backend...');
        return api.post(API_URL_EVENTS_CREATE, formData);
      }
      
      // Si no hay imagen, enviar como JSON normal pero asegurando cover_image si fue especificada
      console.log('📤 Enviando JSON al backend...');
      return api.post(API_URL_EVENTS_CREATE, eventData);
    } catch (error) {
      console.error('❌ Error en createEvent:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        console.error('🔑 Error de autenticación en createEvent - token expirado o inválido');
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        console.error('📝 Error de validación en createEvent');
        throw new Error('Datos del evento inválidos. Verifica todos los campos.');
      }
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        console.error('🌐 Error de red en createEvent');
        throw new Error('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      }
      
      throw error;
    }
  },
  updateEvent: async (id, eventData) => {
    console.log("🚀 eventService.updateEvent llamado con:", JSON.stringify(eventData, null, 2));
    console.log("📡 URL de la API:", API_URL_EVENTS_UPDATE.replace(':id', id));
    
    await api.ensureValidToken();
    
    try {
      const coverImg = eventData.coverImageFile || eventData.cover_image || eventData.image || eventData.cover;
      
      if (coverImg) {
        const formData = new FormData();

        if (typeof coverImg === 'object' && coverImg.uri) {
          formData.append('cover_image', coverImg);
        } else if (typeof coverImg === 'string' && coverImg.trim()) {
          const trimmed = coverImg.trim();
          if (
            trimmed.startsWith('file://') ||
            trimmed.startsWith('content://') ||
            trimmed.startsWith('ph://') ||
            trimmed.startsWith('assets-library://') ||
            trimmed.startsWith('data:image/')
          ) {
            const imageType = trimmed.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
            formData.append('cover_image', {
              uri: trimmed,
              type: imageType,
              name: `event_${Date.now()}.${imageType.split('/')[1]}`,
            });
          } else {
            formData.append('cover_image', trimmed);
          }
        }
        
        Object.keys(eventData).forEach(key => {
          if (
            key !== 'coverImageFile' &&
            key !== 'cover_image' &&
            key !== 'image' &&
            key !== 'cover' &&
            eventData[key] !== null &&
            eventData[key] !== undefined &&
            eventData[key] !== ''
          ) {
            try {
              if (key === 'faqs') {
                if (!Array.isArray(eventData[key]) || eventData[key].length === 0) {
                  console.warn(`⚠️ Campo 'faqs' no es un array válido o está vacío:`, eventData[key]);
                  return;
                }
                formData.append(key, JSON.stringify(eventData[key]));
              } else if (key === 'location') {
                if (typeof eventData[key] !== 'object' || eventData[key] === null) {
                  console.warn(`⚠️ Campo 'location' no es un objeto válido:`, eventData[key]);
                  return;
                }
                formData.append(key, JSON.stringify(eventData[key]));
              } else if (typeof eventData[key] === 'boolean') {
                formData.append(key, eventData[key] ? 'true' : 'false');
              } else {
                formData.append(key, String(eventData[key]));
              }
            } catch (serializationError) {
              console.error(`❌ Error serializando campo '${key}':`, serializationError, 'Valor:', eventData[key]);
              throw new Error(`Error al serializar el campo '${key}': ${serializationError.message}`);
            }
          }
        });
        
        console.log('📤 Enviando FormData al backend para update...');
        return api.put(API_URL_EVENTS_UPDATE.replace(':id', id), formData);
      }
      
      console.log('📤 Enviando JSON al backend para update...');
      return api.put(API_URL_EVENTS_UPDATE.replace(':id', id), eventData);
    } catch (error) {
      console.error('❌ Error en updateEvent:', error);
      
      // Manejo específico de errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        console.error('🔑 Error de autenticación en updateEvent - token expirado o inválido');
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      throw error;
    }
  },
  deleteEvent: async (id) => {
    console.log("🗑️ eventService.deleteEvent llamado con ID:", id);
    console.log("📡 URL de la API:", API_URL_EVENTS_DELETE.replace(':id', id));

    // Verificar que hay un token válido antes de proceder
    await api.ensureValidToken();

    try {
      const response = await api.delete(API_URL_EVENTS_DELETE.replace(':id', id));
      console.log("✅ eventService.deleteEvent response:", response);
      return response;
    } catch (error) {
      console.error('❌ Error en deleteEvent:', error);

      // Manejo específico de errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        console.error('🔑 Error de autenticación en deleteEvent - token expirado o inválido');
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
        console.error('🚫 Error de permisos en deleteEvent - no tienes permisos');
        throw new Error('No tienes permisos para eliminar este evento.');
      }

      throw error;
    }
  },
  filterByStatus: (status) => api.get(`${API_URL_EVENTS_FILTER_STATUS}?status=${status}`),
  getThisWeekEvents: () => api.get(API_URL_EVENTS_THIS_WEEK),
  getRecommendations: (userId) => api.get(API_URL_EVENTS_RECOMMENDATIONS.replace(':user_id', userId)),
  getEventsByLikes: () => api.get(API_URL_EVENTS_BY_LIKES),
  confirmAttendance: (id, attendeeData) => api.post(API_URL_EVENTS_ATTENDEES_CONFIRM.replace(':id', id), attendeeData),
  getAttendees: (id) => api.get(API_URL_EVENTS_ATTENDEES_LIST.replace(':id', id)),
  getInsights: (id) => api.get(API_URL_EVENTS_INSIGHTS.replace(':id', id)),
  getSubscribers: (id) => api.get(API_URL_EVENTS_SUBSCRIBERS.replace(':id', id)),
  getEventsByOrganizer: (organizerId) => api.get(`${API_URL_EVENTS}?organizer_id=${organizerId}`),
  getUserEvents: (userId, type = 'all') => {
    console.log("🎯 eventService.getUserEvents llamado con:", { userId, type });
    
    // Para usuarios guest, devolver array vacío sin hacer llamadas API
    if (userId.toString().startsWith('guest_')) {
      console.log('👤 Usuario guest detectado, devolviendo eventos vacíos para tipo:', type);
      return Promise.resolve([]);
    }
    
    // Usar endpoints específicos según el tipo
    if (type === 'subscribed') {
      const url = API_URL_EVENT_SUBSCRIPTIONS_BY_USER.replace(':user_id', userId);
      console.log("🎯 Using subscriptions endpoint:", url);
      return api.get(url);
    } else if (type === 'created') {
      const url = `${API_URL_EVENTS}?organizer_id=${userId}`;
      console.log("🎯 Using created events endpoint:", url);
      return api.get(url);
    } else {
      // Fallback al endpoint genérico
      const url = `${API_URL_EVENTS}/user/${userId}?type=${type}`;
      console.log("🎯 Using generic endpoint:", url);
      return api.get(url);
    }
  },
};