import { useMemo } from 'react';
import { normalizeImageUrl, optimizeImage } from '../utils/imageUtils';

/**
 * Hook personalizado para manejar URLs de imágenes
 * @param {string} imageUrl - URL de la imagen
 * @param {Object} options - Opciones de optimización
 * @returns {string} URL normalizada y optimizada
 */
export const useImageUrl = (imageUrl, options = {}) => {
  return useMemo(() => {
    const normalizedUrl = normalizeImageUrl(imageUrl);
    
    // Si hay opciones de optimización, aplicarlas
    if (options.width || options.height || options.quality) {
      return optimizeImage(normalizedUrl, options);
    }
    
    return normalizedUrl;
  }, [imageUrl, options.width, options.height, options.quality]);
};

/**
 * Hook para imágenes de eventos con optimización predeterminada
 */
export const useEventImageUrl = (imageUrl) => {
  return useImageUrl(imageUrl, {
    width: 800,
    height: 600,
    quality: '85'
  });
};

/**
 * Hook para imágenes de perfil con optimización predeterminada
 */
export const useProfileImageUrl = (imageUrl) => {
  return useImageUrl(imageUrl, {
    width: 400,
    height: 400,
    quality: '90'
  });
};

/**
 * Hook para thumbnails con optimización predeterminada
 */
export const useThumbnailImageUrl = (imageUrl) => {
  return useImageUrl(imageUrl, {
    width: 300,
    height: 300,
    quality: '80'
  });
};

export default useImageUrl;