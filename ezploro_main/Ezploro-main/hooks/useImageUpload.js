import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import imageService from '../services/imageService';

/**
 * Hook personalizado para manejar la carga de imágenes
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estados para manejar imágenes
 */
export const useImageUpload = (options = {}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Configuración por defecto
  const defaultOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    ...options,
  };

  /**
   * Seleccionar imagen de la galería
   */
  const pickImageFromGallery = useCallback(async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Se requieren permisos para acceder a la galería');
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      setError(error.message);
      return null;
    }
  }, [defaultOptions]);

  /**
   * Tomar foto con la cámara
   */
  const takePhotoWithCamera = useCallback(async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Se requieren permisos para acceder a la cámara');
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync(defaultOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      setError(error.message);
      return null;
    }
  }, [defaultOptions]);

  /**
   * Subir imagen seleccionada
   */
  const uploadImage = useCallback(async (imageAsset, uploadOptions = {}) => {
    if (!imageAsset) {
      setError('No hay imagen para subir');
      return null;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await imageService.uploadImage({
        uri: imageAsset.uri,
        mimeType: imageAsset.mimeType || 'image/jpeg',
        fileName: imageAsset.fileName || `image_${Date.now()}.jpg`,
        ...uploadOptions,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadedImage(result);
        console.log('✅ Imagen subida exitosamente:', result.fullUrl);
        return result;
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      setError(error.message);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  /**
   * Flujo completo: seleccionar y subir imagen de galería
   */
  const selectAndUploadFromGallery = useCallback(async (uploadOptions = {}) => {
    const imageAsset = await pickImageFromGallery();
    if (imageAsset) {
      return await uploadImage(imageAsset, uploadOptions);
    }
    return null;
  }, [pickImageFromGallery, uploadImage]);

  /**
   * Flujo completo: tomar foto y subir
   */
  const takePhotoAndUpload = useCallback(async (uploadOptions = {}) => {
    const imageAsset = await takePhotoWithCamera();
    if (imageAsset) {
      return await uploadImage(imageAsset, uploadOptions);
    }
    return null;
  }, [takePhotoWithCamera, uploadImage]);

  /**
   * Limpiar estados
   */
  const clearStates = useCallback(() => {
    setError(null);
    setUploadedImage(null);
    setUploadProgress(0);
  }, []);

  return {
    // Estados
    uploading,
    uploadProgress,
    error,
    uploadedImage,

    // Funciones de selección
    pickImageFromGallery,
    takePhotoWithCamera,

    // Funciones de carga
    uploadImage,
    selectAndUploadFromGallery,
    takePhotoAndUpload,

    // Utilidades
    clearStates,
  };
};

export default useImageUpload;