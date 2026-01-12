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

    // Use the /all endpoint for admin to get all offers with offer_id
    const url = params.toString() 
      ? `${API_URL_OFFERS_LIST}?${params.toString()}`
      : API_URL_OFFERS_LIST;

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
 * Subir imagen de oferta
 * @param {File} imageFile - Archivo de imagen
 * @returns {Promise<string>} URL de la imagen subida
 */
export const uploadOfferImage = async (imageFile) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    console.log('🔵 uploadOfferImage - Subiendo imagen de oferta...');
    console.log('🔵 uploadOfferImage - Archivo:', imageFile.name, imageFile.size, 'bytes');

    // Primero intentar con el endpoint de ofertas si existe
    let response = await fetch(`${BASE_URL}/offer/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    // Si no existe ese endpoint, usar el genérico
    if (!response.ok && response.status === 404) {
      console.log('🔵 uploadOfferImage - Endpoint de ofertas no disponible, usando endpoint genérico');
      response = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al subir imagen: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ uploadOfferImage - Imagen subida:', data);
    
    // Retornar la URL de la imagen
    return data.url || data.image_url || data.secure_url || data.data?.url;
  } catch (error) {
    console.error('🔴 Error en uploadOfferImage:', error);
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
    console.log('🔵 createOffer - Tiene imagen archivo:', !!imageFile);

    if (!imageFile && !offerData.image_url) {
      throw new Error('Debes proporcionar una imagen');
    }

    // El backend espera multipart/form-data con el archivo y los datos
    const formData = new FormData();
    
    // Agregar la imagen si existe
    if (imageFile) {
      formData.append('image', imageFile);
      console.log('🔵 createOffer - Imagen agregada al FormData:', imageFile.name);
    }
    
    // Agregar todos los campos del offerData al FormData
    // Limpiar y validar datos antes de enviar
    Object.keys(offerData).forEach(key => {
      const value = offerData[key];
      
      // Saltar campos vacíos, null, undefined, o image_url
      if (value === null || value === undefined || value === '' || key === 'image_url') {
        return;
      }
      
      // Para campos numéricos, asegurarse de que sean números válidos
      const numericFields = ['discount_percentage', 'discount_amount', 'original_price', 'final_price', 
                             'points_required', 'max_uses', 'stock_available', 'organizer_id'];
      
      if (numericFields.includes(key)) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          formData.append(key, numValue);
        }
      } else {
        formData.append(key, value);
      }
    });
    
    // Log para debug
    console.log('🔵 createOffer - Campos enviados en FormData:');
    for (let [key, value] of formData.entries()) {
      if (key !== 'image') {
        console.log(`  ${key}: ${value} (${typeof value})`);
      }
    }
    
    console.log('🔵 createOffer - Enviando FormData con imagen');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir Content-Type, el browser lo establece automáticamente con boundary
      },
      body: formData,
    });
    
    console.log('🔵 createOffer - Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 createOffer - Error text:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Error HTTP! status: ${response.status}` };
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.details || `Error HTTP! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ createOffer - Oferta creada exitosamente:', result);
    return result;
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

    const url = API_URL_OFFERS_UPDATE.replace(':offerId', offerId);
    console.log('🔵 updateOffer - URL:', url);
    console.log('🔵 updateOffer - Tiene imagen archivo:', !!imageFile);

    // El backend espera multipart/form-data con el archivo y los datos
    const formData = new FormData();
    
    // Agregar la imagen si existe
    if (imageFile) {
      formData.append('image', imageFile);
      console.log('🔵 updateOffer - Nueva imagen agregada al FormData:', imageFile.name);
    }
    
    // Agregar todos los campos del offerData al FormData
    // Limpiar y validar datos antes de enviar
    Object.keys(offerData).forEach(key => {
      const value = offerData[key];
      
      // Saltar campos vacíos, null, undefined, original_image_url
      if (value === null || value === undefined || value === '' || key === 'original_image_url') {
        return;
      }
      
      // Para campos numéricos, asegurarse de que sean números válidos
      const numericFields = ['discount_percentage', 'discount_amount', 'original_price', 'final_price', 
                             'points_required', 'max_uses', 'stock_available', 'organizer_id'];
      
      if (numericFields.includes(key)) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          formData.append(key, numValue);
        }
      } else {
        formData.append(key, value);
      }
    });
    
    // Log para debug
    console.log('🔵 updateOffer - Campos enviados en FormData:');
    for (let [key, value] of formData.entries()) {
      if (key !== 'image') {
        console.log(`  ${key}: ${value} (${typeof value})`);
      }
    }

    console.log('🔵 updateOffer - Enviando FormData');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir Content-Type, el browser lo establece automáticamente con boundary
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
      throw new Error(errorData.error || errorData.message || errorData.details || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ updateOffer - Oferta actualizada exitosamente:', result);
    return result;
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
    const url = API_URL_OFFERS_DELETE.replace(':offerId', offerId);
    console.log('🔵 deleteOffer - URL:', url);
    console.log('🔵 deleteOffer - offerId:', offerId);
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

