// services/messageService.js - Wrapper para compatibilidad con el nuevo chatService
import chatService from './chatService';

export const messageService = {
  // Mensajes privados
  getUserChats: async (userId) => {
    const result = await chatService.getUserChats(userId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  getMessagesBetweenUsers: async (senderId, receiverId) => {
    const result = await chatService.getMessagesBetweenUsers(senderId, receiverId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  createPrivateMessage: async (messageData) => {
    const { senderId, receiverId, content, images } = messageData;
    const result = await chatService.createPrivateMessage(senderId, receiverId, content, images);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  getChatUserInfo: async (userId) => {
    const result = await chatService.getChatUserInfo(userId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  // Mensajes de eventos
  getEventMessages: async (eventId) => {
    const result = await chatService.getEventMessages(eventId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  createEventMessage: async (messageData) => {
    const { senderId, eventId, content, image } = messageData;
    const result = await chatService.createEventMessage(senderId, eventId, content, image);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  getWebSocketStatus: async () => {
    const result = await chatService.getWebSocketStatus();
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  joinEventChat: async (eventId) => {
    const result = await chatService.joinEventChat(eventId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
  
  getUserEventChats: async (userId) => {
    const result = await chatService.getUserEventChats(userId);
    if (!result.success) throw new Error(result.error);
    return { data: result.data };
  },
};

// Exportar también el chatService directamente para uso avanzado
export { default as chatService } from './chatService';