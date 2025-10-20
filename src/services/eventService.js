import { 
  API_URL_EVENTS,
  API_URL_EVENTS_BY_ID,
  API_URL_EVENTS_CREATE,
  API_URL_EVENTS_UPDATE,
  API_URL_EVENTS_DELETE,
  API_URL_EVENTS_THIS_WEEK,
  API_URL_EVENTS_RECOMMENDATIONS,
  API_URL_EVENTS_BY_LIKES,
  BASE_URL_IMAGE
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

  // Función helper para procesar URLs de imágenes
  const processImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Si comienza con /, es una ruta absoluta del servidor
    if (imageUrl.startsWith('/')) {
      return `${BASE_URL_IMAGE}${imageUrl}`;
    }
    // Si es una ruta relativa, agregar la base URL con /
    return `${BASE_URL_IMAGE}/${imageUrl}`;
  };

  // Solo procesar si realmente necesitamos hacerlo
  const needsProcessing = (event.image && !event.image.startsWith('http')) || 
                         (event.user?.profile_picture && !event.user.profile_picture.startsWith('http')) ||
                         (event.user?.avatar && !event.user.avatar.startsWith('http')) ||
                         (event.organizer?.profile_picture && !event.organizer.profile_picture.startsWith('http')) ||
                         (event.organizer?.avatar && !event.organizer.avatar.startsWith('http'));

  if (!needsProcessing) {
    return event; // Devolver sin cambios si no necesita procesamiento
  }

  return {
    ...event,
    // Procesar imagen del evento solo si existe y no es URL completa
    image: event.image ? processImageUrl(event.image) : event.image,
    
    // Procesar datos del creador del evento
    user: event.user ? {
      ...event.user,
      profile_picture: event.user.profile_picture ? processImageUrl(event.user.profile_picture) : event.user.profile_picture,
      avatar: event.user.avatar ? processImageUrl(event.user.avatar) : event.user.avatar,
    } : event.user,
    
    // Procesar datos del organizador si existe
    organizer: event.organizer ? {
      ...event.organizer,
      profile_picture: event.organizer.profile_picture ? processImageUrl(event.organizer.profile_picture) : event.organizer.profile_picture,
      avatar: event.organizer.avatar ? processImageUrl(event.organizer.avatar) : event.organizer.avatar,
    } : event.organizer,
    
    // Procesar asistentes si existen
    attendees: event.attendees ? event.attendees.map(attendee => ({
      ...attendee,
      profile_picture: attendee.profile_picture ? processImageUrl(attendee.profile_picture) : attendee.profile_picture,
      avatar: attendee.avatar ? processImageUrl(attendee.avatar) : attendee.avatar,
    })) : event.attendees,
    
    // Procesar suscriptores si existen
    subscribers: event.subscribers ? event.subscribers.map(subscriber => ({
      ...subscriber,
      profile_picture: subscriber.profile_picture ? processImageUrl(subscriber.profile_picture) : subscriber.profile_picture,
      avatar: subscriber.avatar ? processImageUrl(subscriber.avatar) : subscriber.avatar,
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
    const response = await fetchWithAuth(API_URL_EVENTS_CREATE, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    
    const event = response.data || response;
    return event;
  } catch (error) {
    console.error('Error en createEvent:', error);
    throw error;
  }
};

/**
 * Actualiza un evento existente
 * @param {Object} eventData - Datos del evento (debe incluir id)
 * @returns {Promise<Object>} Evento actualizado
 */
export const updateEvent = async (eventData) => {
  try {
    const url = API_URL_EVENTS_UPDATE.replace(':id', eventData.id);
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    
    const event = response.data || response;
    return event;
  } catch (error) {
    console.error('Error en updateEvent:', error);
    throw error;
  }
};

/**
 * Elimina un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object>} Respuesta de la eliminación
 */
export const deleteEvent = async (eventId) => {
  try {
    const url = API_URL_EVENTS_DELETE.replace(':id', eventId);
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
    });
    return response.data || response;
  } catch (error) {
    console.error('Error en deleteEvent:', error);
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