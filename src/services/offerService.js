import { getAuthToken, getCurrentUserId } from './authService';
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
 * Helper para construir FormData para crear o actualizar oferta en el backend NestJS.
 * Compatible con FileInterceptor('image') y los DTOs CreateOfferDto / UpdateOfferDto.
 */
const buildOfferFormData = async (offerData, imageFile = null) => {
  const formData = new FormData();

  // 1. Manejo de imagen: archivo File/Blob o string base64 / URL
  if (imageFile instanceof File || imageFile instanceof Blob) {
    formData.append('image', imageFile);
  } else if (typeof offerData.image_url === 'string' && offerData.image_url.startsWith('data:')) {
    // Si viene en base64 de FileReader (vista previa local), convertir a Blob para que el servidor lo procese como archivo
    try {
      const res = await fetch(offerData.image_url);
      const blob = await res.blob();
      formData.append('image', blob, 'offer-image.jpg');
    } catch (e) {
      console.warn('⚠️ No se pudo convertir base64 a blob:', e);
    }
  } else if (typeof offerData.image_url === 'string' && (offerData.image_url.startsWith('http://') || offerData.image_url.startsWith('https://'))) {
    formData.append('image_url', offerData.image_url.trim());
  } else if (typeof offerData.image === 'string' && (offerData.image.startsWith('http://') || offerData.image.startsWith('https://'))) {
    formData.append('image_url', offerData.image.trim());
  }

  // 2. Título (requerido en create)
  const title = String(offerData.title || offerData.name || '').trim();
  if (title) {
    formData.append('title', title);
  }

  // 3. Puntos requeridos (entero requerido en create)
  const pointsRequired = parseInt(offerData.points_required ?? offerData.cost ?? 0, 10);
  if (!isNaN(pointsRequired)) {
    formData.append('points_required', String(pointsRequired));
  }

  // 4. is_active (debe ser estrictamente 'true' o 'false', NUNCA string vacío o null)
  const isActive = offerData.is_active !== undefined ? Boolean(offerData.is_active) : true;
  formData.append('is_active', String(isActive));

  // 5. Campos de texto opcionales (sólo agregar si tienen contenido real)
  if (offerData.category && String(offerData.category).trim()) {
    formData.append('category', String(offerData.category).trim());
  }
  if (offerData.description && String(offerData.description).trim()) {
    formData.append('description', String(offerData.description).trim());
  }
  if (offerData.offer_type && String(offerData.offer_type).trim()) {
    formData.append('offer_type', String(offerData.offer_type).trim());
  }
  if (offerData.target_audience && String(offerData.target_audience).trim()) {
    formData.append('target_audience', String(offerData.target_audience).trim());
  }
  if (offerData.promo_code && String(offerData.promo_code).trim()) {
    formData.append('promo_code', String(offerData.promo_code).trim().toUpperCase());
  }
  const terms = offerData.terms_conditions || offerData.terms_and_conditions;
  if (terms && String(terms).trim()) {
    formData.append('terms_and_conditions', String(terms).trim());
    formData.append('terms_conditions', String(terms).trim());
  }
  const mName = offerData.merchant_name || offerData.merchantName;
  if (mName && String(mName).trim()) {
    formData.append('merchant_name', String(mName).trim());
  }
  const mCode = offerData.merchant_code || offerData.merchantCode || offerData.merchant_pin || offerData.merchantPin;
  if (mCode && String(mCode).trim()) {
    formData.append('merchant_code', String(mCode).trim());
    formData.append('merchant_pin', String(mCode).trim());
  }

  // 6. Fechas en formato ISO (sólo si son válidas)
  if (offerData.start_date && String(offerData.start_date).trim()) {
    const d = new Date(offerData.start_date);
    if (!isNaN(d.getTime())) {
      formData.append('start_date', d.toISOString());
    }
  }
  if (offerData.end_date && String(offerData.end_date).trim()) {
    const d = new Date(offerData.end_date);
    if (!isNaN(d.getTime())) {
      if (typeof offerData.end_date === 'string' && offerData.end_date.length === 10) {
        d.setHours(23, 59, 59, 999);
      }
      formData.append('end_date', d.toISOString());
    }
  }

  // 7. Campos numéricos (sólo si son números válidos, NUNCA strings vacíos ni NaN)
  if (offerData.discount_percentage !== '' && offerData.discount_percentage !== null && offerData.discount_percentage !== undefined) {
    const num = parseFloat(offerData.discount_percentage);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      formData.append('discount_percentage', String(num));
    }
  }
  const discountFix = offerData.discount_amount ?? offerData.discount_fixed;
  if (discountFix !== '' && discountFix !== null && discountFix !== undefined) {
    const num = parseFloat(discountFix);
    if (!isNaN(num)) {
      formData.append('discount_fixed', String(num));
      formData.append('discount_amount', String(num));
    }
  }
  if (offerData.original_price !== '' && offerData.original_price !== null && offerData.original_price !== undefined) {
    const num = parseFloat(offerData.original_price);
    if (!isNaN(num)) {
      formData.append('original_price', String(num));
    }
  }
  if (offerData.final_price !== '' && offerData.final_price !== null && offerData.final_price !== undefined) {
    const num = parseFloat(offerData.final_price);
    if (!isNaN(num)) {
      formData.append('final_price', String(num));
    }
  }
  if (offerData.max_uses !== '' && offerData.max_uses !== null && offerData.max_uses !== undefined) {
    const num = parseInt(offerData.max_uses, 10);
    if (!isNaN(num)) {
      formData.append('max_uses', String(num));
    }
  }

  return formData;
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

    console.log('🔵 uploadOfferImage - Subiendo imagen...');
    const imageUrl = await uploadProfilePicture(imageFile);
    if (!imageUrl) {
      throw new Error('El servidor no devolvió una URL válida para la imagen');
    }
    console.log('✅ uploadOfferImage - Imagen subida exitosamente:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('🔴 Error en uploadOfferImage:', error);
    throw error;
  }
};

export const createOffer = async (offerData, imageFile = null) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
  }

  const formData = await buildOfferFormData(offerData, imageFile);
  const url = API_URL_OFFERS_CREATE;

  console.log('🔵 createOffer - Enviando petición multipart a', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // No incluir Content-Type: el navegador lo genera con el multipart boundary
    },
    body: formData
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    console.error('🔴 createOffer - Error respuesta del servidor:', response.status, result);
    const errMsg = Array.isArray(result.message)
      ? result.message.join(', ')
      : (result.message || result.error || `Error ${response.status}`);
    throw new Error(errMsg);
  }

  console.log('✅ createOffer - Oferta creada con éxito:', result);
  const serverOffer = result.offer || result.data || result;
  const created = {
    ...serverOffer,
    offer_id: serverOffer.offer_id || serverOffer.id,
    id: serverOffer.offer_id || serverOffer.id,
  };

  try {
    const localOffersStr = localStorage.getItem('ezploro_offers_config');
    let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
    localOffers.unshift(created);
    localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));
  } catch (e) {
    console.warn('⚠️ Error guardando en local storage:', e);
  }

  return created;
};

export const updateOffer = async (offerId, offerData, imageFile = null) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
  }

  const targetId = String(offerId || offerData.offer_id || offerData.id || '').trim();
  if (!targetId) {
    throw new Error('ID de oferta inválido');
  }

  const formData = await buildOfferFormData(offerData, imageFile);
  const url = API_URL_OFFERS_UPDATE.replace(':offerId', targetId);

  console.log('🔵 updateOffer - Enviando petición multipart PUT a', url);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    console.error('🔴 updateOffer - Error respuesta del servidor:', response.status, result);
    const errMsg = Array.isArray(result.message)
      ? result.message.join(', ')
      : (result.message || result.error || `Error ${response.status}`);
    throw new Error(errMsg);
  }

  console.log('✅ updateOffer - Oferta actualizada con éxito:', result);
  const serverOffer = result.offer || result.data || result;
  const updated = {
    ...offerData,
    ...serverOffer,
    offer_id: targetId,
    id: targetId,
  };

  try {
    const localOffersStr = localStorage.getItem('ezploro_offers_config');
    let localOffers = localOffersStr ? JSON.parse(localOffersStr) : [];
    const index = localOffers.findIndex(o => String(o.offer_id || o.id) === targetId);
    if (index !== -1) {
      localOffers[index] = { ...localOffers[index], ...updated };
    } else {
      localOffers.unshift(updated);
    }
    localStorage.setItem('ezploro_offers_config', JSON.stringify(localOffers));
  } catch (e) {
    console.warn('⚠️ Error guardando en local storage:', e);
  }

  return updated;
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


