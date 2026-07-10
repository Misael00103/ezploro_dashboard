/**
 * Normaliza URLs de imágenes para usar con Cloudinary
 * @param {string} imageUrl - URL de la imagen
 * @param {string} defaultImage - URL de imagen por defecto
 * @returns {string} URL normalizada
 */
export const normalizeImageUrl = (imageUrl, defaultImage = 'https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=Image') => {
  if (!imageUrl || typeof imageUrl !== 'string') return defaultImage;
  
  // Limpiar la URL de espacios y caracteres extraños
  let cleanUrl = imageUrl.trim();
  
  // Si ya es una URL completa, limpiarla y devolverla
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    // Arreglar dobles barras en la URL (excepto después del protocolo)
    cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
    return cleanUrl;
  }
  
  // Si es una ruta relativa, asumir que es de Cloudinary
  if (cleanUrl.startsWith('/')) {
    return `https://res.cloudinary.com/dxa1augjh/image/upload${cleanUrl}`;
  }
  
  return defaultImage;
};

/**
 * Optimiza imágenes de Cloudinary con transformaciones
 * @param {string} imageUrl - URL de la imagen
 * @param {Object} options - Opciones de transformación
 * @returns {string} URL optimizada
 */
export const optimizeImage = (imageUrl, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = '85',
    format = 'auto'
  } = options;
  
  const normalizedUrl = normalizeImageUrl(imageUrl);
  
  // Solo optimizar si es una imagen de Cloudinary
  if (normalizedUrl.includes('cloudinary.com')) {
    const transformations = `w_${width},h_${height},c_fill,q_${quality},f_${format}`;
    
    // Verificar si ya tiene transformaciones
    if (normalizedUrl.includes('/upload/') && !normalizedUrl.includes('/upload/v')) {
      // Ya tiene transformaciones, reemplazarlas
      return normalizedUrl.replace(/\/upload\/[^\/]+\//, `/upload/${transformations}/`);
    } else {
      // No tiene transformaciones, agregarlas
      // Asegurar que solo reemplazamos la primera ocurrencia de /upload/
      return normalizedUrl.replace(/\/upload\//, `/upload/${transformations}/`);
    }
  }
  
  return normalizedUrl;
};

/**
 * Genera URL de avatar por defecto
 * @param {string} name - Nombre del usuario
 * @returns {string} URL del avatar
 */
export const getDefaultAvatar = (name = 'User') => {
  const initial = name.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=200&font-size=0.6`;
};