// services/userService.js
import api from './api';
import {
  API_URL_USERS_BY_ID,
  API_URL_USERS_UPDATE,
  API_URL_USERS_UPLOAD_IMAGE,
  API_URL_POSTS_BY_USER
} from '../config';

export const userService = {
  // Obtener usuario por ID
  getUserById: (userId) => {
    console.log("👤 userService.getUserById llamado con:", userId);
    const url = API_URL_USERS_BY_ID.replace(':userId', userId);
    return api.get(url);
  },

  // Actualizar usuario
  updateUser: async (userId, userData) => {
    console.log("👤 userService.updateUser llamado con:", { userId, userData });
    
    try {
      // Verificar token antes de proceder
      await api.ensureValidToken();
      
      const url = API_URL_USERS_UPDATE.replace(':userId', userId);
      const response = await api.put(url, userData);
      
      console.log("✅ Usuario actualizado exitosamente");
      return response;
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
      
      // Manejo específico de errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      throw error;
    }
  },

  // Subir imagen de perfil
  uploadImage: async (imageData, type = 'profile') => {
    console.log("📸 userService.uploadImage llamado con tipo:", type);
    
    try {
      // Verificar token antes de proceder
      await api.ensureValidToken();
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageData.uri,
        type: imageData.type || 'image/jpeg',
        name: imageData.name || `${type}_${Date.now()}.jpg`,
      });
      formData.append('type', type);
      
      const response = await api.post(API_URL_USERS_UPLOAD_IMAGE, formData, {
        headers: {
          // No establecer Content-Type para FormData
        }
      });
      
      console.log("✅ Imagen subida exitosamente");
      return response;
    } catch (error) {
      console.error("❌ Error subiendo imagen:", error);
      
      // Manejo específico de errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      throw error;
    }
  },

  // Obtener posts del usuario
  getUserPosts: (userId) => {
    console.log("📝 userService.getUserPosts llamado con:", userId);
    const url = API_URL_POSTS_BY_USER.replace(':userId', userId);
    return api.get(url);
  },

  // Buscar usuarios
  searchUsers: (query) => {
    console.log("🔍 userService.searchUsers llamado con:", query);
    return api.get(`${API_URL_USERS_SEARCH_BY_QUERY}?q=${encodeURIComponent(query)}`);
  }
};

export default userService;