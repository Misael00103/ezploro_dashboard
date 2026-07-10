import { API_URL_USERS_UPLOAD_IMAGE } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeImageUrl, optimizeImage } from '../utils/image';

class ImageService {
  constructor() {
    this.uploadEndpoint = API_URL_USERS_UPLOAD_IMAGE;
  }

  /**
   * Normaliza un URI para RN (asegura prefijo file:// cuando corresponde)
   */
  normalizeLocalUri(rawUri) {
    if (!rawUri) return null;
    // Evitar placeholders o URIs no válidos
    if (typeof rawUri !== 'string') return null;
    const trimmed = rawUri.trim();
    if (!trimmed || trimmed.includes('/placeholder.svg')) return null;
    // Si ya es http(s) lo dejamos (puede venir de caché local), backend igualmente requiere archivo local
    // Preferimos URIs locales de ImagePicker: file:///...
    if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) return trimmed;
    // En Android/iOS a veces viene sin schema
    if (/^\/.+/.test(trimmed)) return `file://${trimmed}`;
    return trimmed;
  }

  /**
   * Subir cualquier tipo de imagen a la app
   * @param {Object} imageData - Datos de la imagen
   * @param {string} imageData.uri - URI local de la imagen
   * @param {string} imageData.type - Tipo de imagen (profile, event, banner, post, etc.)
   * @param {string} imageData.category - Categoría específica (opcional)
   * @param {number} imageData.userId - ID del usuario (opcional)
   * @param {number} imageData.eventId - ID del evento (opcional)
   * @returns {Promise<Object>} Respuesta con la URL de la imagen subida
   */
  async uploadImage(imageData) {
    try {
      console.log('📤 Subiendo imagen:', imageData.type);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      // Validación estricta de URI
      const normalizedUri = this.normalizeLocalUri(imageData?.uri);
      if (!normalizedUri) {
        throw new Error('No se proporcionó ninguna imagen');
      }

      // Crear FormData para la imagen
      const formData = new FormData();
      
      // Determinar tipo MIME y nombre de archivo
      const mimeType = imageData.mimeType || 'image/jpeg';
      const fileName = imageData.fileName || `${imageData.type}_${Date.now()}.jpg`;
      
      // Agregar la imagen
      const filePart = {
        uri: normalizedUri,
        type: mimeType,
        name: fileName,
      };
      
      formData.append('image', filePart);
      formData.append('type', imageData.type || 'profile');

      // Solo agregar metadatos esenciales que el backend espera
      if (imageData.category) formData.append('category', imageData.category);
      if (imageData.description) formData.append('description', imageData.description);

      // Debug logging
      console.log('📋 FormData being sent:', {
        imageType: imageData.type,
        category: imageData.category,
        userId: imageData.userId,
        eventId: imageData.eventId,
        mimeType: imageData.mimeType,
        fileName: imageData.fileName,
        uri: normalizedUri
      });

      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No establecer Content-Type manualmente para FormData en React Native
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Imagen subida exitosamente:', result);

      return {
        success: true,
        data: result,
        imageUrl: result.URL || result.url || result.imageUrl || result.path,
        fullUrl: result.URL || result.url || result.imageUrl || result.path,
      };

    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Subir imagen de perfil de usuario
   */
  async uploadProfileImage(imageUri, userId) {
    return this.uploadImage({
      uri: imageUri,
      type: 'profile',
      category: 'user_avatar',
      userId: userId,
    });
  }

  /**
   * Subir imagen de banner de usuario
   */
  async uploadBannerImage(imageUri, userId) {
    return this.uploadImage({
      uri: imageUri,
      type: 'banner',
      category: 'user_banner',
      userId: userId,
    });
  }

  /**
   * Subir imagen de evento usando endpoint de usuarios
   */
  async uploadEventImage(imageUri, eventId, userId, mimeType = 'image/jpeg', fileName = null) {
    try {
      console.log('🔍 Debug uploadEventImage:', { imageUri, eventId, userId, mimeType, fileName });
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      const normalizedUri = this.normalizeLocalUri(imageUri);
      if (!normalizedUri) {
        throw new Error('No se proporcionó ninguna imagen');
      }

      const formData = new FormData();
      
      // Usar el formato que espera el backend de usuarios
      const filePart = {
        uri: normalizedUri,
        type: mimeType || 'image/jpeg',
        name: fileName || `event_${Date.now()}.jpg`,
      };
      
      formData.append('image', filePart);
      formData.append('type', 'profile');

      console.log('📤 Subiendo imagen usando endpoint de usuarios...');

      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Upload success:', result);

      // El endpoint de usuarios devuelve { message, URL }
      const imageUrl = result.URL || result.url || result.imageUrl || result.path;

      return {
        success: true,
        data: result,
        imageUrl: imageUrl,
        fullUrl: imageUrl, // Ya viene como URL completa de Cloudinary
      };

    } catch (error) {
      console.error('❌ Error en uploadEventImage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Subir imagen de post/publicación
   */
  async uploadPostImage(imageUri, userId, description = '') {
    const normalizedUri = this.normalizeLocalUri(imageUri);
    if (!normalizedUri) {
      return { success: false, error: 'No se proporcionó ninguna imagen' };
    }
    return this.uploadImage({
      uri: normalizedUri,
      type: 'post',
      category: 'user_post',
      userId: userId,
      description: description,
    });
  }

  /**
   * Subir imagen de chat/mensaje
   */
  async uploadChatImage(imageUri, userId) {
    return this.uploadImage({
      uri: imageUri,
      type: 'chat',
      category: 'message_image',
      userId: userId,
    });
  }

  /**
   * Subir imagen de oferta/promoción
   */
  async uploadOfferImage(imageUri, userId) {
    return this.uploadImage({
      uri: imageUri,
      type: 'offer',
      category: 'promotion',
      userId: userId,
    });
  }

  /**
   * Obtener URL completa de una imagen (usa normalizeImageUrl)
   */
  getFullImageUrl(imagePath) {
    return normalizeImageUrl(imagePath);
  }

  /**
   * Optimizar imagen con transformaciones de Cloudinary
   */
  getOptimizedImageUrl(imagePath, options = {}) {
    return optimizeImage(imagePath, options);
  }

  /**
   * Obtener todas las imágenes de un usuario
   */
  async getUserImages(userId, type = null) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      let url = `${this.uploadEndpoint}/user/${userId}`;
      if (type) {
        url += `?type=${type}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Procesar URLs de imágenes
      const images = result.data || result.images || [];
      return images.map(img => ({
        ...img,
        fullUrl: normalizeImageUrl(img.path || img.url || img.imageUrl),
      }));

    } catch (error) {
      console.error('❌ Error obteniendo imágenes del usuario:', error);
      return [];
    }
  }

  /**
   * Obtener todas las imágenes de un evento
   */
  async getEventImages(eventId) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      const response = await fetch(`${this.uploadEndpoint}/event/${eventId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Procesar URLs de imágenes
      const images = result.data || result.images || [];
      return images.map(img => ({
        ...img,
        fullUrl: normalizeImageUrl(img.path || img.url || img.imageUrl),
      }));

    } catch (error) {
      console.error('❌ Error obteniendo imágenes del evento:', error);
      return [];
    }
  }

  /**
   * Eliminar una imagen
   */
  async deleteImage(imageId) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      const response = await fetch(`${this.uploadEndpoint}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Imagen eliminada exitosamente');

      return {
        success: true,
        data: result,
      };

    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener estadísticas de imágenes
   */
  async getImageStats() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }

      const response = await fetch(`${this.uploadEndpoint}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de imágenes:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
const imageService = new ImageService();
export default imageService;

// Exportar también métodos específicos para facilidad de uso
export const {
  uploadImage,
  uploadProfileImage,
  uploadBannerImage,
  uploadEventImage,
  uploadPostImage,
  uploadChatImage,
  uploadOfferImage,
  getFullImageUrl,
  getOptimizedImageUrl,
  getUserImages,
  getEventImages,
  deleteImage,
  getImageStats,
} = imageService;