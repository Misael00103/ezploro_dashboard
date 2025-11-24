import { getAuthToken } from './authService';
import { fetchWithAuth, uploadProfilePicture } from './userService';
import {
  API_URL_OFFERS,
  API_URL_OFFERS_CREATE,
  API_URL_OFFERS_LIST,
  API_URL_OFFERS_ACTIVE,
  API_URL_OFFERS_STATS,
  API_URL_OFFERS_BY_ID,
  API_URL_OFFERS_UPDATE,
  API_URL_OFFERS_DELETE,
  API_URL_OFFERS_TOGGLE_STATUS,
  API_URL_OFFERS_PROMO_VALIDATE,
  API_URL_OFFERS_PROMO_USE,
  API_URL_USERS_UPLOAD_IMAGE,
  BASE_URL,
} from './config';

/**
 * Verificar si el endpoint de ofertas está disponible
 * @returns {Promise<boolean>} true si el endpoint está disponible
 */
export const checkOffersEndpoint = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL_OFFERS, {
      method: 'GET',
      headers,
    });

    // Si obtenemos cualquier respuesta (incluso 401/403), el endpoint existe
    return response.status !== 404;
  } catch (error) {
    console.error('Error verificando endpoint de ofertas:', error);
    return false;
  }
};

/**
 * Obtener todas las ofertas con filtros opcionales
 * @param {Object} filters - Filtros opcionales (category, is_active, search, etc.)
 * @returns {Promise<Array>} Lista de ofertas
 */
export const getOffers = async (filters = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Construir query params
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() 
      ? `${API_URL_OFFERS}?${params.toString()}`
      : API_URL_OFFERS;

    console.log('🔵 getOffers - URL:', url);
    console.log('🔵 getOffers - Token presente:', !!token);
    if (token) {
      console.log('🔵 getOffers - Token preview:', token.substring(0, 20) + '...');
      try {
        // Decodificar el token para ver el userId
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔵 getOffers - Token payload:', {
          user_id: payload.user_id,
          id: payload.id,
          exp: payload.exp,
          exp_readable: new Date(payload.exp * 1000).toLocaleString()
        });
        
        // Verificar si el token expiró
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.error('🔴 getOffers - Token expirado!');
          console.error('🔴 getOffers - Expira:', new Date(payload.exp * 1000).toLocaleString());
          console.error('🔴 getOffers - Ahora:', new Date().toLocaleString());
        }
      } catch (e) {
        console.warn('⚠️ getOffers - No se pudo decodificar el token:', e);
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Error HTTP! status: ${response.status}` };
      }
      console.error('🔴 getOffers - Error response:', errorData);
      
      // Si es error de userId inválido, mostrar más información
      if (errorData.message && errorData.message.includes('ID de usuario inválido')) {
        console.error('🔴 getOffers - Problema con el userId del token');
        console.error('🔴 getOffers - Verifica que el token tenga un user_id válido (número positivo)');
        
        // Mostrar información del localStorage
        const userId = localStorage.getItem('userId');
        const userStr = localStorage.getItem('user');
        console.error('🔴 getOffers - localStorage userId:', userId, 'Tipo:', typeof userId);
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            console.error('🔴 getOffers - localStorage user object:', {
              user_id: user.user_id,
              id: user.id,
              _id: user._id
            });
          } catch (e) {
            console.error('🔴 getOffers - Error parseando user:', e);
          }
        }
      }
      
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔵 getOffers - Response data:', data);
    
    // El backend devuelve { offers, totalCount, limit, offset }
    if (data && Array.isArray(data.offers)) {
      return data.offers;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('⚠️ getOffers - Formato de respuesta inesperado:', data);
      return [];
    }
  } catch (error) {
    console.error('Error en getOffers:', error);
    throw error;
  }
};

/**
 * Obtener ofertas activas
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de ofertas activas
 */
export const getActiveOffers = async (filters = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() 
      ? `${API_URL_OFFERS_ACTIVE}?${params.toString()}`
      : API_URL_OFFERS_ACTIVE;

    console.log('🔵 getActiveOffers - URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Error HTTP! status: ${response.status}` };
      }
      console.error('🔴 getActiveOffers - Error response:', errorData);
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔵 getActiveOffers - Response data:', data);
    
    // El backend devuelve { offers, totalCount, limit, offset }
    if (data && Array.isArray(data.offers)) {
      return data.offers;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('⚠️ getActiveOffers - Formato de respuesta inesperado:', data);
      return [];
    }
  } catch (error) {
    console.error('Error en getActiveOffers:', error);
    throw error;
  }
};

/**
 * Obtener una oferta por ID
 * @param {number} offerId - ID de la oferta
 * @returns {Promise<Object>} Datos de la oferta
 */
export const getOfferById = async (offerId) => {
  try {
    const url = API_URL_OFFERS_BY_ID.replace(':id', offerId);
    return await fetchWithAuth(url);
  } catch (error) {
    console.error('Error en getOfferById:', error);
    throw error;
  }
};

/**
 * Crear una nueva oferta
 * @param {Object} offerData - Datos de la oferta
 * @param {File} imageFile - Archivo de imagen opcional
 * @returns {Promise<Object>} Oferta creada
 */
export const createOffer = async (offerData, imageFile = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const url = API_URL_OFFERS_CREATE;
    console.log('🔵 createOffer - URL completa:', url);
    console.log('🔵 createOffer - BASE_URL:', BASE_URL);
    console.log('🔵 createOffer - Tiene imagen archivo:', !!imageFile, 'Tiene image_url:', !!offerData.image_url);
    console.log('🔵 createOffer - Datos a enviar:', {
      ...offerData,
      imageFile: imageFile ? `File: ${imageFile.name} (${imageFile.size} bytes)` : null
    });

    // Si hay imagen, primero subirla para obtener la URL
    let finalOfferData = { ...offerData };
    
    if (imageFile) {
      console.log('🔵 createOffer - Hay imagen, subiendo primero...');
      console.log('🔵 createOffer - Tipo de archivo:', imageFile.constructor.name);
      console.log('🔵 createOffer - Nombre del archivo:', imageFile.name);
      console.log('🔵 createOffer - Tamaño del archivo:', imageFile.size, 'bytes');
      console.log('🔵 createOffer - Tipo MIME:', imageFile.type);
      try {
        // Subir imagen usando el servicio de upload
        const uploadResult = await uploadProfilePicture(imageFile);
        console.log('🔵 createOffer - Resultado completo de uploadProfilePicture:', uploadResult);
        console.log('🔵 createOffer - Tipo de resultado:', typeof uploadResult);
        
        // El backend puede devolver { url: "..." } o directamente la URL como string
        let imageUrl;
        if (typeof uploadResult === 'string') {
          imageUrl = uploadResult;
        } else if (uploadResult && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else if (uploadResult && uploadResult.data && uploadResult.data.url) {
          imageUrl = uploadResult.data.url;
        } else if (uploadResult && uploadResult.image_url) {
          imageUrl = uploadResult.image_url;
        } else {
          console.warn('⚠️ createOffer - Formato de respuesta inesperado de uploadProfilePicture:', uploadResult);
          imageUrl = uploadResult;
        }
        
        console.log('✅ createOffer - Imagen subida, URL obtenida:', imageUrl);
        finalOfferData.image_url = imageUrl;
      } catch (uploadError) {
        console.error('🔴 createOffer - Error al subir imagen:', uploadError);
        console.error('🔴 createOffer - Error stack:', uploadError.stack);
        console.error('🔴 createOffer - Error name:', uploadError.name);
        console.error('🔴 createOffer - Error message:', uploadError.message);
        
        // Proporcionar mensajes de error más específicos
        let errorMessage = 'Error al subir la imagen';
        
        if (uploadError.message) {
          errorMessage = uploadError.message;
        } else if (uploadError.name === 'TypeError') {
          errorMessage = 'Error de conexión al subir la imagen. Verifica tu conexión a internet.';
        } else if (uploadError.message && uploadError.message.includes('fetch')) {
          errorMessage = 'No se pudo conectar con el servidor para subir la imagen.';
        } else {
          errorMessage = `Error al subir la imagen: ${uploadError.toString()}`;
        }
        
        throw new Error(errorMessage);
      }
    } else if (offerData.image_url && offerData.image_url.trim()) {
      // Si no hay archivo pero hay URL, usar la URL directamente
      console.log('🔵 createOffer - Usando image_url del formulario:', offerData.image_url);
      finalOfferData.image_url = offerData.image_url.trim();
    }
    
    // Validar que image_url esté presente si se subió una imagen
    if (imageFile && !finalOfferData.image_url) {
      console.error('🔴 createOffer - ERROR: Se intentó subir una imagen pero no se obtuvo la URL');
      throw new Error('Error al obtener la URL de la imagen subida. Por favor, intenta nuevamente.');
    }
    
    // Siempre enviar JSON (el backend espera JSON)
    console.log('🔵 createOffer - Enviando JSON a:', url);
    console.log('🔵 createOffer - Datos finales:', JSON.stringify(finalOfferData, null, 2));
    console.log('🔵 createOffer - image_url en datos finales:', finalOfferData.image_url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(finalOfferData),
    });
    
    console.log('🔵 createOffer - Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 createOffer - Error text:', errorText);
      
      if (errorText.includes('Cannot POST') || errorText.includes('<!DOCTYPE html>') || response.status === 404) {
        throw new Error(`El endpoint POST no está disponible (404). Verifica que la ruta POST esté definida en rewards.routes.js y que el servidor esté reiniciado.`);
      }
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Error HTTP! status: ${response.status}` };
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.details || `Error HTTP! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('🔴 Error en createOffer:', error);
    throw error;
  }
};

/**
 * Actualizar una oferta
 * @param {number} offerId - ID de la oferta
 * @param {Object} offerData - Datos actualizados de la oferta
 * @param {File} imageFile - Archivo de imagen opcional
 * @returns {Promise<Object>} Oferta actualizada
 */
export const updateOffer = async (offerId, offerData, imageFile = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const url = API_URL_OFFERS_UPDATE.replace(':id', offerId);
    console.log('🔵 updateOffer - URL:', url);
    console.log('🔵 updateOffer - Tiene imagen archivo:', !!imageFile, 'Tiene image_url:', !!offerData.image_url);

    // Si hay imagen nueva (archivo o URL diferente), usar FormData
    if (imageFile || (offerData.image_url && offerData.image_url !== offerData.original_image_url)) {
      const formData = new FormData();
      
      // Agregar todos los campos de texto
      Object.keys(offerData).forEach(key => {
        if (key !== 'image_url' && key !== 'original_image_url' && offerData[key] !== null && offerData[key] !== undefined && offerData[key] !== '') {
          const value = offerData[key];
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else if (typeof value === 'object' && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });

      // Agregar imagen: archivo local tiene prioridad sobre URL
      if (imageFile) {
        console.log('🔵 updateOffer - Agregando archivo de imagen al FormData');
        formData.append('image', imageFile);
      } else if (offerData.image_url && (offerData.image_url.startsWith('http://') || offerData.image_url.startsWith('https://'))) {
        // Si es URL nueva, intentar descargarla y convertirla a archivo
        console.log('🔵 updateOffer - Descargando imagen desde URL:', offerData.image_url);
        try {
          const response = await fetch(offerData.image_url);
          const blob = await response.blob();
          const fileName = offerData.image_url.split('/').pop() || 'offer-image.jpg';
          formData.append('image', blob, fileName);
          console.log('✅ updateOffer - Imagen descargada y agregada al FormData');
        } catch (error) {
          console.warn('⚠️ updateOffer - No se pudo descargar la imagen desde la URL, enviando URL como string:', error);
          formData.append('image_url', offerData.image_url);
        }
      }

      console.log('🔵 updateOffer - Enviando FormData');

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No incluir Content-Type para FormData
        },
        body: formData,
      });

      console.log('🔵 updateOffer - Response status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Error HTTP! status: ${response.status}` };
        }
        console.error('🔴 updateOffer - Error response:', errorData);
        throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
      }

      return await response.json();
    } else {
      // Si no hay imagen nueva, usar JSON normal
      console.log('🔵 updateOffer - Enviando JSON sin imagen nueva');
      return await fetchWithAuth(url, {
        method: 'PUT',
        body: JSON.stringify(offerData),
      });
    }
  } catch (error) {
    console.error('🔴 Error en updateOffer:', error);
    throw error;
  }
};

/**
 * Eliminar una oferta
 * @param {number} offerId - ID de la oferta
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const deleteOffer = async (offerId) => {
  try {
    const url = API_URL_OFFERS_DELETE.replace(':id', offerId);
    return await fetchWithAuth(url, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error en deleteOffer:', error);
    throw error;
  }
};

/**
 * Activar/desactivar una oferta
 * @param {number} offerId - ID de la oferta
 * @param {boolean} isActive - Estado activo/inactivo
 * @returns {Promise<Object>} Oferta actualizada
 */
export const toggleOfferStatus = async (offerId, isActive) => {
  try {
    const url = API_URL_OFFERS_TOGGLE_STATUS.replace(':id', offerId);
    return await fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  } catch (error) {
    console.error('Error en toggleOfferStatus:', error);
    throw error;
  }
};

/**
 * Validar código promocional
 * @param {string} promoCode - Código promocional
 * @returns {Promise<Object>} Resultado de la validación
 */
export const validatePromoCode = async (promoCode) => {
  try {
    const url = API_URL_OFFERS_PROMO_VALIDATE.replace(':promo_code', promoCode);
    return await fetchWithAuth(url);
  } catch (error) {
    console.error('Error en validatePromoCode:', error);
    throw error;
  }
};

/**
 * Usar código promocional
 * @param {string} promoCode - Código promocional
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Resultado del uso del código
 */
export const usePromoCode = async (promoCode, userId) => {
  try {
    const url = API_URL_OFFERS_PROMO_USE.replace(':promo_code', promoCode);
    return await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  } catch (error) {
    console.error('Error en usePromoCode:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de ofertas
 * @param {Object} filters - Filtros opcionales (organizer_id, etc.)
 * @returns {Promise<Object>} Estadísticas de ofertas
 */
export const getOfferStats = async (filters = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() 
      ? `${API_URL_OFFERS_STATS}?${params.toString()}`
      : API_URL_OFFERS_STATS;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getOfferStats:', error);
    throw error;
  }
};

