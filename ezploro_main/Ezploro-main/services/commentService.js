// services/commentService.js
import api from './api';
import {
  API_URL_COMMENTS,
  API_URL_COMMENTS_EVENT,
  API_URL_COMMENTS_CREATE,
  API_URL_COMMENTS_UPDATE,
  API_URL_COMMENTS_DELETE
} from '../config';

export const commentService = {
  // Comentarios de eventos
  getEventComments: (eventId) => api.get(API_URL_COMMENTS_EVENT.replace(':event_id', eventId)),
  createEventComment: (eventId, commentData) => 
    api.post(API_URL_COMMENTS_EVENT.replace(':event_id', eventId), commentData),
  updateComment: (id, commentData) => api.put(API_URL_COMMENTS_UPDATE.replace(':id', id), commentData),
  deleteComment: (id) => api.delete(API_URL_COMMENTS_DELETE.replace(':id', id)),
  
  // Respuestas a comentarios
  getCommentReplies: (eventId, commentId) => 
    api.get(`/comments/${eventId}/replies/${commentId}`),
  createCommentReply: (replyData) => api.post('/comments/reply', replyData),
};