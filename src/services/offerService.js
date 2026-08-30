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
    
    let resultOffers = [];
    if (data && Array.isArray(data.offers)) {
      resultOffers = data.offers;
    } else if (Array.isArray(data)) {
      resultOffers = data;
    } else if (data && data.data && Array.isArray(data.data)) {
      resultOffers = data.data;
    }

    return resultOffers;
  } catch (error) {
    console.warn('⚠️ Error en getOffers backend:', error);
    return [];
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

export const createOffer = async (offerData, imageFile = null) => {
  const localOffersStr = localStorage.getItem('ezploro_offers_config');
  let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
  
  const tempId = `offer-${Date.now()}`;
  const newOffer = {
    offer_id: tempId,
    id: tempId,
    title: offerData.title || 'Nueva Promoción',
    category: offerData.category || 'Bebidas',
    points_required: parseInt(offerData.points_required || offerData.cost) || 300,
    cost: parseInt(offerData.points_required || offerData.cost) || 300,
    description: offerData.description || '',
    image_url: offerData.image_url || 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    is_active: offerData.is_active !== undefined ? offerData.is_active : true,
    promo_code: offerData.promo_code || `EZP-${Date.now().toString().slice(-4)}`,
    terms_conditions: offerData.terms_conditions || '',
    created_at: new Date().toISOString()
  };

  // Guardar en local storage de inmediato para respuesta instantánea
  localOffers.unshift(newOffer);
  localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));

  try {
    const token = getAuthToken();
    if (token) {
      const url = API_URL_OFFERS_CREATE;
      let response;

      const cleanData = {};
      Object.keys(offerData).forEach(key => {
        const val = offerData[key];
        if (val !== null && val !== undefined && val !== '') {
          cleanData[key] = val;
        }
      });

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        Object.keys(cleanData).forEach(key => {
          formData.append(key, cleanData[key]);
        });
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }).catch(() => null);
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(cleanData)
        }).catch(() => null);
      }

      if (response && response.ok) {
        const result = await response.json();
        const serverOffer = result.offer || result.data || result;
        if (serverOffer && (serverOffer.id || serverOffer.offer_id)) {
          const finalId = serverOffer.id || serverOffer.offer_id;
          const merged = { ...newOffer, ...serverOffer, offer_id: finalId, id: finalId };
          
          // Reemplazar la oferta temporal creada
          localOffers = localOffers.map(o => (o.id === tempId || o.offer_id === tempId) ? merged : o);
          localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));
          return merged;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error al enviar promoción a backend API, guardada en respaldo local:', error);
  }

  return newOffer;
};

export const updateOffer = async (offerId, offerData, imageFile = null) => {
  const localOffersStr = localStorage.getItem('ezploro_offers_config');
  let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
  
  const index = localOffers.findIndex(o => (o.offer_id || o.id) === offerId);
  let updatedOffer = { ...offerData, offer_id: offerId, id: offerId };
  if (index !== -1) {
    updatedOffer = { ...localOffers[index], ...offerData };
    localOffers[index] = updatedOffer;
  } else {
    localOffers.push(updatedOffer);
  }
  localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));

  // Solo enviar petición al backend si el ID es numérico (ID existente en BD PostgreSQL)
  const isNumericId = /^\d+$/.test(String(offerId));
  if (isNumericId) {
    try {
      const token = getAuthToken();
      if (token) {
        const url = API_URL_OFFERS_UPDATE.replace(':offerId', offerId);
        const formData = new FormData();
        if (imageFile) {
          formData.append('image', imageFile);
        }
        Object.keys(offerData).forEach(key => {
          const val = offerData[key];
          if (val !== null && val !== undefined && val !== '') {
            formData.append(key, val);
          }
        });

        await fetch(url, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }).catch(() => null);
      }
    } catch (error) {
      console.warn('⚠️ Error al actualizar oferta en backend:', error);
    }
  }

  return updatedOffer;
};

export const deleteOffer = async (offerId) => {
  const localOffersStr = localStorage.getItem('ezploro_offers_config');
  let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
  localOffers = localOffers.filter(o => (o.offer_id || o.id || o._id) !== offerId);
  localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));

  const isNumericId = /^\d+$/.test(String(offerId));
  if (isNumericId) {
    try {
      const token = getAuthToken();
      if (token) {
        const url = API_URL_OFFERS_DELETE.replace(':offerId', offerId);
        await fetchWithAuth(url, { method: 'DELETE' }).catch(() => null);
      }
    } catch (error) {
      console.warn('⚠️ Error al eliminar oferta en backend:', error);
    }
  }

  return { success: true, message: 'Oferta eliminada' };
};

export const toggleOfferStatus = async (offerId, isActive) => {
  const localOffersStr = localStorage.getItem('ezploro_offers_config');
  let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
  const targetIdStr = String(offerId || '').trim();
  const index = localOffers.findIndex(o => String(o.offer_id || o.id || o._id || '').trim() === targetIdStr);
  
  let newStatus = isActive;
  if (index !== -1) {
    if (newStatus === undefined) {
      newStatus = !localOffers[index].is_active;
    }
    localOffers[index].is_active = newStatus;
    localOffers[index].status = newStatus ? 'Activa' : 'Inactiva';
    localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));
  }

  const isNumericId = /^\d+$/.test(targetIdStr);
  if (isNumericId) {
    try {
      const token = getAuthToken();
      if (token) {
        const url = API_URL_OFFERS_TOGGLE_STATUS.replace(':id', targetIdStr);
        await fetchWithAuth(url, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: newStatus })
        }).catch(() => null);
      }
    } catch (error) {
      console.warn('⚠️ Error alternando estado de oferta en backend:', error);
    }
  }

  return localOffers[index] || { offer_id: offerId, is_active: newStatus, status: newStatus ? 'Activa' : 'Inactiva' };
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

    return await response.json();
  } catch (error) {
    console.error('Error en getOfferStats:', error);
    throw error;
  }
};

/**
 * Obtener lista de confirmaciones de canje de ofertas usando el endpoint activo del servidor
 */
export const getOfferRedemptions = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Consultar endpoint activo /offer/rewards/my-redemptions (HTTP 200 OK en la nube)
      const response = await fetch(`${BASE_URL}/offer/rewards/my-redemptions`, { headers }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        const list = data?.redemptions || data?.data || (Array.isArray(data) ? data : null);
        if (Array.isArray(list)) {
          return list;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error al consultar confirmaciones de canjes en backend:', error);
  }

  try {
    const cached = localStorage.getItem('ezploro_offer_redemptions');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [];
};


