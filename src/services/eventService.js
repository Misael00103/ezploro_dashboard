import { 
  API_URL_EVENTS,
  API_URL_EVENTS_BY_ID,
  API_URL_EVENTS_CREATE,
  API_URL_EVENTS_UPDATE,
  API_URL_EVENTS_DELETE,
  API_URL_EVENTS_THIS_WEEK,
  API_URL_EVENTS_RECOMMENDATIONS,
  API_URL_EVENTS_BY_LIKES,
  BASE_URL_IMAGE,
  formatImageUrl
} from './config';
import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';

/**
 * Procesa los datos del evento para incluir URLs completas de imágenes
 * @param {Object} event - Datos del evento
 * @returns {Object} Evento procesado con URLs completas
 */
const processEventData = (event) => {
  if (!event) return event;

  return {
    ...event,
    image: formatImageUrl(event.image || event.cover_image),
    cover_image: formatImageUrl(event.cover_image || event.image),
    user: event.user ? {
      ...event.user,
      profile_picture: formatImageUrl(event.user.profile_picture || event.user.avatar),
      avatar: formatImageUrl(event.user.avatar || event.user.profile_picture),
    } : event.user,
    organizer: event.organizer ? {
      ...event.organizer,
      profile_picture: formatImageUrl(event.organizer.profile_picture || event.organizer.avatar),
      avatar: formatImageUrl(event.organizer.avatar || event.organizer.profile_picture),
    } : event.organizer,
    attendees: event.attendees ? event.attendees.map(attendee => ({
      ...attendee,
      profile_picture: formatImageUrl(attendee.profile_picture || attendee.avatar),
      avatar: formatImageUrl(attendee.avatar || attendee.profile_picture),
    })) : event.attendees,
    subscribers: event.subscribers ? event.subscribers.map(subscriber => ({
      ...subscriber,
      profile_picture: formatImageUrl(subscriber.profile_picture || subscriber.avatar),
      avatar: formatImageUrl(subscriber.avatar || subscriber.profile_picture),
    })) : event.subscribers,
  };
};

/**
 * Obtiene todos los eventos
 * @returns {Promise<Array>} Lista de eventos
 */
export const getEvents = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si está disponible para obtener más datos
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL_EVENTS, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.data || data || [];
    
    // Devolver eventos tal como vienen del backend
    return events;
  } catch (error) {
    console.error('Error en getEvents:', error);
    return [];
  }
};

/**
 * Obtiene un evento específico por ID
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object>} Datos del evento
 */
export const getEventById = async (eventId) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = API_URL_EVENTS_BY_ID.replace(':id', eventId);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const event = data.data || data;
    
    return event;
  } catch (error) {
    console.error('Error en getEventById:', error);
    throw error;
  }
};

/**
 * Crea un nuevo evento
 * @param {Object} eventData - Datos del evento
 * @returns {Promise<Object>} Evento creado
 */
export const createEvent = async (eventData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const formData = new FormData();
    
    // Convertir fechas a formato ISO si vienen de datetime-local
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      // Si ya es formato ISO completo, devolverlo tal cual
      if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
        return dateString;
      }
      // Si es formato datetime-local (YYYY-MM-DDTHH:mm), convertir a ISO
      if (dateString.includes('T') && !dateString.includes('Z')) {
        return new Date(dateString).toISOString();
      }
      // Si es solo fecha, agregar hora
      return new Date(dateString).toISOString();
    };
    
    const dateTime = formatDateTime(eventData.date_time || eventData.date);
    const endDateTime = formatDateTime(eventData.end_date_time || eventData.endDate);
    
    // Agregar todos los campos necesarios
    formData.append('title', eventData.title || '');
    formData.append('description', eventData.description || eventData.about || '');
    formData.append('resume', eventData.resume || '');
    formData.append('organizer_id', eventData.organizer_id || '');
    formData.append('date_time', dateTime);
    formData.append('end_date_time', endDateTime);
    formData.append('online', eventData.online || eventData.isOnline ? 'true' : 'false');
    formData.append('category', eventData.category || '');
    formData.append('subcategory', eventData.subcategory || '');
    formData.append('price', eventData.price || 0);
    formData.append('video_url', eventData.video_url || eventData.videoUrl || '');
    
    // Ubicación
    if (eventData.location && typeof eventData.location === 'object') {
      // Si es GeoJSON
      formData.append('location', JSON.stringify(eventData.location));
    } else if (eventData.location) {
      formData.append('location', eventData.location);
    }
    
    // Campos de dirección para eventos presenciales
    if (eventData.address) formData.append('address', eventData.address);
    if (eventData.city) formData.append('city', eventData.city);
    if (eventData.state) formData.append('state', eventData.state);
    if (eventData.country) formData.append('country', eventData.country);
    
    // Coordenadas
    if (eventData.latitude) formData.append('latitude', eventData.latitude);
    if (eventData.longitude) formData.append('longitude', eventData.longitude);
    
    // FAQs
    if (eventData.faqs && Array.isArray(eventData.faqs)) {
      formData.append('faqs', JSON.stringify(eventData.faqs));
    }
    
    // Campos de eventos recurrentes
    if (eventData.isRecurring) {
      formData.append('isRecurring', 'true');
      formData.append('recurrenceType', eventData.recurrenceType || 'daily');
      formData.append('recurrenceInterval', eventData.recurrenceInterval || 1);
      if (eventData.recurrenceEndDate) {
        formData.append('recurrenceEndDate', formatDateTime(eventData.recurrenceEndDate));
      }
      if (eventData.recurrenceCount) {
        formData.append('recurrenceCount', eventData.recurrenceCount);
      }
    }
    
    // Imagen de portada
    const imageSource = eventData.coverImageFile || eventData.cover_image || eventData.image || eventData.cover;
    if (imageSource) {
      if (imageSource instanceof File || imageSource instanceof Blob) {
        formData.append('cover_image', imageSource);
      } else if (typeof imageSource === 'string' && imageSource.trim()) {
        const trimmed = imageSource.trim();
        if (trimmed.startsWith('blob:') || trimmed.startsWith('file://')) {
          try {
            const response = await fetch(trimmed);
            const blob = await response.blob();
            const fileName = trimmed.split('/').pop() || 'cover.jpg';
            formData.append('cover_image', blob, fileName);
          } catch (e) {
            formData.append('cover_image', trimmed);
          }
        } else {
          formData.append('cover_image', trimmed);
        }
      }
    }

    const response = await fetch(API_URL_EVENTS_CREATE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // No establecer Content-Type, el navegador lo hará automáticamente con FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al crear evento: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error en createEvent:', error);
    throw error;
  }
};

/**
 * Actualiza un evento existente
 * @param {Object} eventData - Datos del evento (debe incluir id o event_id)
 * @returns {Promise<Object>} Evento actualizado
 */
export const updateEvent = async (eventData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const eventId = eventData.id || eventData.event_id;
    if (!eventId) {
      throw new Error('ID del evento es requerido');
    }

    const url = API_URL_EVENTS_UPDATE.replace(':id', eventId);
    
    // Convertir fechas a formato ISO si vienen de datetime-local
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      // Si ya es formato ISO completo, devolverlo tal cual
      if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
        return dateString;
      }
      // Si es formato datetime-local (YYYY-MM-DDTHH:mm), convertir a ISO
      if (dateString.includes('T') && !dateString.includes('Z')) {
        return new Date(dateString).toISOString();
      }
      // Si es solo fecha, agregar hora
      return new Date(dateString).toISOString();
    };
    
    const coverImageSource = eventData.coverImageFile || eventData.cover_image || eventData.image || eventData.cover;
    const hasImage = coverImageSource !== undefined && coverImageSource !== null && coverImageSource !== '';
    
    if (hasImage) {
      const formData = new FormData();
      
      // Agregar todos los campos
      if (eventData.title) formData.append('title', eventData.title);
      if (eventData.description !== undefined) formData.append('description', eventData.description || '');
      if (eventData.resume !== undefined) formData.append('resume', eventData.resume || '');
      if (eventData.date_time) formData.append('date_time', formatDateTime(eventData.date_time));
      if (eventData.end_date_time) formData.append('end_date_time', formatDateTime(eventData.end_date_time));
      if (eventData.online !== undefined) formData.append('online', eventData.online ? 'true' : 'false');
      if (eventData.category) formData.append('category', eventData.category);
      if (eventData.subcategory !== undefined) formData.append('subcategory', eventData.subcategory || '');
      if (eventData.price !== undefined) formData.append('price', eventData.price);
      if (eventData.video_url !== undefined) formData.append('video_url', eventData.video_url || '');
      
      // Ubicación
      if (eventData.location) {
        if (typeof eventData.location === 'object') {
          formData.append('location', JSON.stringify(eventData.location));
        } else {
          formData.append('location', eventData.location);
        }
      }
      
      // Dirección
      if (eventData.address !== undefined) formData.append('address', eventData.address || '');
      if (eventData.city !== undefined) formData.append('city', eventData.city || '');
      if (eventData.state !== undefined) formData.append('state', eventData.state || '');
      if (eventData.country !== undefined) formData.append('country', eventData.country || '');
      
      // Coordenadas
      if (eventData.latitude) formData.append('latitude', eventData.latitude);
      if (eventData.longitude) formData.append('longitude', eventData.longitude);
      
      // FAQs
      if (eventData.faqs) {
        formData.append('faqs', JSON.stringify(eventData.faqs));
      }
      
      // Imagen
      if (coverImageSource instanceof File || coverImageSource instanceof Blob) {
        formData.append('cover_image', coverImageSource);
      } else if (typeof coverImageSource === 'string' && coverImageSource.trim()) {
        const trimmed = coverImageSource.trim();
        if (trimmed.startsWith('blob:') || trimmed.startsWith('file://')) {
          try {
            const response = await fetch(trimmed);
            const blob = await response.blob();
            const fileName = trimmed.split('/').pop() || 'cover.jpg';
            formData.append('cover_image', blob, fileName);
          } catch (e) {
            formData.append('cover_image', trimmed);
          }
        } else {
          formData.append('cover_image', trimmed);
        }
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al actualizar evento: ${response.status}`);
      }

      const data = await response.json();
      return data.event || data.data || data;
    } else {
      // Sin imagen, usar JSON
      const updateData = { ...eventData };
      
      // Convertir fechas a formato ISO
      if (updateData.date_time) {
        updateData.date_time = formatDateTime(updateData.date_time);
      }
      if (updateData.end_date_time) {
        updateData.end_date_time = formatDateTime(updateData.end_date_time);
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al actualizar evento: ${response.status}`);
      }

      const data = await response.json();
      return data.event || data.data || data;
    }
  } catch (error) {
    console.error('Error en updateEvent:', error);
    throw error;
  }
};

/**
 * Elimina un evento
 * @param {string|number} eventId - ID del evento
 * @returns {Promise<Object>} Respuesta de la eliminación
 */
export const deleteEvent = async (eventId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    // Validar que el ID existe y es válido
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('ID de evento inválido.');
    }

    const url = API_URL_EVENTS_DELETE.replace(':id', String(eventId));
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al eliminar evento: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en deleteEvent:', error);
    throw error;
  }
};

/**
 * Elimina todos los eventos
 * @returns {Promise<Object>} Respuesta de la eliminación
 */
export const deleteAllEvents = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const url = `${API_URL_EVENTS}/all`;
    console.log('🔴 deleteAllEvents - URL:', url);
    console.log('🔴 deleteAllEvents - Token:', token ? 'Presente' : 'Ausente');
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('🔴 deleteAllEvents - Response status:', response.status);
    console.log('🔴 deleteAllEvents - Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🔴 deleteAllEvents - Error data:', errorData);
      
      // Verificar si es un error de permisos
      if (response.status === 403) {
        throw new Error('No tienes permisos para eliminar todos los eventos. Se requiere rol de administrador.');
      }
      
      throw new Error(errorData.message || `Error al eliminar todos los eventos: ${response.status}`);
    }

    const data = await response.json();
    console.log('🟢 deleteAllEvents - Success:', data);
    return data;
  } catch (error) {
    console.error('🔴 Error en deleteAllEvents:', error);
    throw error;
  }
};

/**
 * Obtiene eventos de esta semana
 * @returns {Promise<Array>} Lista de eventos de esta semana
 */
export const getEventsThisWeek = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL_EVENTS_THIS_WEEK, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.data || data || [];
    
    return events;
  } catch (error) {
    console.error('Error en getEventsThisWeek:', error);
    return [];
  }
};

/**
 * Obtiene recomendaciones de eventos para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de eventos recomendados
 */
export const getEventRecommendations = async (userId) => {
  try {
    const url = API_URL_EVENTS_RECOMMENDATIONS.replace(':user_id', userId);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    const events = response.data || response || [];
    return events;
  } catch (error) {
    console.error('Error en getEventRecommendations:', error);
    return [];
  }
};

/**
 * Obtiene eventos ordenados por likes
 * @returns {Promise<Array>} Lista de eventos ordenados por likes
 */
export const getEventsByLikes = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL_EVENTS_BY_LIKES, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.data || data || [];
    
    return events;
  } catch (error) {
    console.error('Error en getEventsByLikes:', error);
    return [];
  }
};

/**
 * Obtiene los asistentes de un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Array>} Lista de asistentes
 */
export const getEventAttendees = async (eventId) => {
  try {
    const url = `${API_URL_EVENTS}/${eventId}/attendees`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    const attendees = response.data || response || [];
    
    // Devolver asistentes tal como vienen del backend
    return attendees;
  } catch (error) {
    console.error('Error en getEventAttendees:', error);
    return [];
  }
};

/**
 * Obtiene los suscriptores de un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Array>} Lista de suscriptores
 */
export const getEventSubscribers = async (eventId) => {
  try {
    const url = `${API_URL_EVENTS}/${eventId}/subscribers`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    const subscribers = response.data || response || [];
    
    // Devolver suscriptores tal como vienen del backend
    return subscribers;
  } catch (error) {
    console.error('Error en getEventSubscribers:', error);
    return [];
  }
};

// Alias para compatibilidad hacia atrás
export const updateEvents = updateEvent;