// services/imageUploadService.js - Servicio para subir imágenes

import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ImageUploadService {
  
  // Subir imagen al servidor (temporal: usar servicio externo)
  async uploadImage(imageUri, type = 'event') {
    try {
      console.log('📤 Procesando imagen local:', imageUri);
      
      // Solución temporal: usar un servicio de imágenes externo
      // En producción, esto debería subir al servidor real
      
      // Por ahora, generar una URL única basada en el timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      
      // Usar diferentes servicios de imágenes según el tipo
      const eventImages = [
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop', // Concierto
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=200&fit=crop', // Música
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=200&fit=crop', // Evento
        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=200&fit=crop', // Comida
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop', // Deportes
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop', // Teatro
      ];
      
      const randomIndex = Math.floor(Math.random() * eventImages.length);
      const selectedImage = eventImages[randomIndex];
      
      const placeholders = {
        event: selectedImage,
        profile: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&random=${randomId}`,
        post: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop&random=${randomId}`,
      };
      
      const placeholderUrl = placeholders[type] || placeholders.event;
      
      console.log('✅ Imagen temporal generada:', placeholderUrl);
      return placeholderUrl;
      
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      return this.generatePlaceholderImage(type);
    }
  }

  // Generar imagen placeholder basada en el tipo
  generatePlaceholderImage(type = 'event') {
    const defaultImages = {
      event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop',
      profile: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      post: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    };

    return defaultImages[type] || defaultImages.event;
  }

  // Verificar si una URL es una imagen local
  isLocalImage(uri) {
    return uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://'));
  }

  // Procesar imagen: subir si es local, devolver URL si ya es remota
  async processImage(imageUri, type = 'event') {
    if (!imageUri) {
      return this.generatePlaceholderImage(type);
    }

    if (this.isLocalImage(imageUri)) {
      return await this.uploadImage(imageUri, type);
    }

    // Si ya es una URL remota, devolverla tal como está
    return imageUri;
  }

  // Subir múltiples imágenes
  async uploadMultipleImages(imageUris, type = 'event') {
    const uploadPromises = imageUris.map(uri => this.processImage(uri, type));
    return await Promise.all(uploadPromises);
  }
}

export default new ImageUploadService();