import { fetchWithAuth } from './userService';
import { 
  API_URL_EVENT_COMMENTS, 
  API_URL_COMMENTS_UPDATE, 
  API_URL_COMMENTS_DELETE, 
  API_URL_COMMENT_REPLIES, 
  API_URL_COMMENT_REPLIES_CREATE,
  BASE_URL,
  BASE_URL_IMAGE
} from './config';
import { getAuthToken } from './authService';

/**
 * Procesa los datos del comentario para incluir URLs completas de imágenes
 * @param {Object} comment - Datos del comentario
 * @returns {Object} Comentario procesado con URLs completas
 */
const processCommentData = (comment) => {
  if (!comment) return comment;

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

  return {
    ...comment,
    // Procesar imágenes del comentario
    image: comment.image ? comment.image.map(processImageUrl) : comment.image,
    
    // Procesar datos del usuario que hizo el comentario
    user: comment.user ? {
      ...comment.user,
      profile_picture: comment.user.profile_picture ? processImageUrl(comment.user.profile_picture) : comment.user.profile_picture,
      avatar: comment.user.avatar ? processImageUrl(comment.user.avatar) : comment.user.avatar,
    } : comment.user,
  };
};

/**
 * Obtiene los comentarios de un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Array>} Lista de comentarios
 */
export const getEventComments = async (eventId) => {
  try {
    // Usar la ruta correcta: /events/:event_id/comments
    const url = `${BASE_URL}/events/${eventId}/comments`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    const comments = response.data || response || [];
    
    // Procesar fotos de perfil en comentarios
    return comments.map(processCommentData);
  } catch (error) {
    console.error('Error getting event comments:', error);
    return [];
  }
};

/**
 * Crea un comentario en un evento
 * @param {string} eventId - ID del evento
 * @param {Object} commentData - Datos del comentario
 * @returns {Promise<Object>} Comentario creado
 */
export const createEventComment = async (eventId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Usar la ruta correcta: /events/:event_id/comments
    const url = `${BASE_URL}/events/${eventId}/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const comment = result.data || result;
    
    return processCommentData(comment);
  } catch (error) {
    console.error('Error creating event comment:', error);
    throw error;
  }
};

/**
 * Actualiza un comentario
 * @param {string} commentId - ID del comentario
 * @param {Object} commentData - Nuevos datos del comentario
 * @returns {Promise<Object>} Comentario actualizado
 */
export const updateEventComment = async (commentId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    if (commentData.clearImages) {
      formData.append('clearImages', 'true');
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Usar la ruta correcta: /comments/:id
    const url = `${BASE_URL}/comments/${commentId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const comment = result.data || result;
    
    return processCommentData(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Elimina un comentario
 * @param {string} commentId - ID del comentario
 * @returns {Promise<Object>} Respuesta de la eliminación
 */
export const deleteEventComment = async (commentId) => {
  try {
    // Usar la ruta correcta: /comments/:id
    const url = `${BASE_URL}/comments/${commentId}`;
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Obtiene las respuestas a un comentario
 * @param {string} eventId - ID del evento
 * @param {string} commentId - ID del comentario
 * @returns {Promise<Array>} Lista de respuestas
 */
export const getCommentReplies = async (eventId, commentId) => {
  try {
    // Usar la ruta correcta: /comments/:eventId/replies/:commentId
    const url = `${BASE_URL}/comments/${eventId}/replies/${commentId}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    const replies = response.data || response || [];
    
    // Procesar fotos de perfil en respuestas
    return replies.map(processCommentData);
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};

/**
 * Crea una respuesta a un comentario
 * @param {Object} replyData - Datos de la respuesta
 * @returns {Promise<Object>} Respuesta creada
 */
export const createCommentReply = async (replyData) => {
  try {
    const formData = new FormData();
    formData.append('userId', replyData.userId);
    formData.append('commentId', replyData.commentId);
    formData.append('eventId', replyData.eventId);
    formData.append('text', replyData.text);
    
    if (replyData.images && replyData.images.length > 0) {
      replyData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Usar la ruta correcta: /comments/reply
    const url = `${BASE_URL}/comments/reply`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const reply = result.data || result;
    
    return processCommentData(reply);
  } catch (error) {
    console.error('Error creating comment reply:', error);
    throw error;
  }
};

// Alias para mantener compatibilidad
export const updateComment = updateEventComment;
export const deleteComment = deleteEventComment;
export const createComment = createEventComment;