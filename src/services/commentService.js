// services/commentService.js
import { fetchWithAuth } from './userService';
import { 
  BASE_URL,
  BASE_URL_IMAGE
} from './config';
import { getAuthToken } from './authService';

/**
 * Procesa URLs de imágenes (perfil, comentarios, etc.)
 */
const processImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BASE_URL_IMAGE}${url}`;
  return `${BASE_URL_IMAGE}/${url}`;
};

const processCommentData = (comment) => {
  if (!comment) return comment;

  return {
    ...comment,
    id: comment.comment_id || comment.id,
    createdAt: comment.created_at || comment.createdAt,
    text: comment.text || comment.content,
    image: Array.isArray(comment.image) 
      ? comment.image.map(processImageUrl)
      : (comment.image ? [processImageUrl(comment.image)] : []),
    user: comment.user ? {
      ...comment.user,
      id: comment.user.user_id || comment.user.id,
      display_name: comment.user.display_name || comment.user.name,
      profile_picture: processImageUrl(comment.user.profile_picture || comment.user.avatar),
    } : null,
    replies: comment.replies || []
  };
};

/**
 * Obtiene comentarios raíz del evento
 */
export const getEventComments = async (eventId) => {
  try {
    const url = `${BASE_URL}/events/${eventId}/comments`;
    const response = await fetchWithAuth(url, { method: 'GET' });
    const comments = response.data || response || [];
    return comments.map(processCommentData);
  } catch (error) {
    console.error('Error getting event comments:', error);
    return [];
  }
};

/**
 * Crea comentario principal
 */
export const createEventComment = async (eventId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    commentData.images?.forEach(img => formData.append('images', img));

    const token = getAuthToken();
    const url = `${BASE_URL}/events/${eventId}/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) throw new Error('Error al crear comentario');
    const result = await response.json();
    return { data: processCommentData(result.data || result) };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Obtiene replies de un comentario
 */
export const getCommentReplies = async (eventId, commentId) => {
  try {
    const url = `${BASE_URL}/comments/${eventId}/replies/${commentId}`;
    const response = await fetchWithAuth(url, { method: 'GET' });
    const replies = response.data || response || [];
    return replies.map(processCommentData);
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
};

/**
 * Crea una respuesta (reply)
 */
export const createCommentReply = async (replyData) => {
  try {
    const formData = new FormData();
    formData.append('eventId', replyData.eventId);
    formData.append('commentId', replyData.commentId);
    formData.append('text', replyData.text);
    replyData.images?.forEach(img => formData.append('images', img));

    const token = getAuthToken();
    const url = `${BASE_URL}/comments/reply`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) throw new Error('Error al responder');
    const result = await response.json();
    return processCommentData(result.data || result);
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

/**
 * Actualiza comentario
 */
export const updateEventComment = async (commentId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    if (commentData.clearImages) formData.append('clearImages', 'true');

    const token = getAuthToken();
    const url = `${BASE_URL}/comments/${commentId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) throw new Error('Error al actualizar');
    const result = await response.json();
    return processCommentData(result.data || result);
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Elimina comentario
 */
export const deleteEventComment = async (commentId) => {
  try {
    const url = `${BASE_URL}/comments/${commentId}`;
    await fetchWithAuth(url, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Compatibilidad
export const updateComment = updateEventComment;
export const deleteComment = deleteEventComment;
export const createComment = createEventComment;