import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { 
  API_URL_SOCIAL_NETWORKS,
  API_URL_SOCIAL_NETWORKS_ALL,
  API_URL_SOCIAL_NETWORKS_ACTIVE,
  API_URL_SOCIAL_NETWORKS_TOTAL_FOLLOWERS,
  API_URL_SOCIAL_NETWORKS_COUNT,
  API_URL_SOCIAL_NETWORKS_BY_ID,
  API_URL_SOCIAL_NETWORKS_CREATE,
  API_URL_SOCIAL_NETWORKS_UPDATE,
  API_URL_SOCIAL_NETWORKS_TOGGLE,
  API_URL_SOCIAL_NETWORKS_DELETE
} from './config';

/**
 * Obtener todas las redes sociales
 */
export const getAllSocialNetworks = async () => {
  try {
    console.log('🔵 getAllSocialNetworks - URL:', API_URL_SOCIAL_NETWORKS_ALL);
    
    const data = await fetchWithAuth(API_URL_SOCIAL_NETWORKS_ALL, {
      method: 'GET',
    });
    
    console.log('🟢 getAllSocialNetworks - Response:', data);
    
    // El backend devuelve { success: true, data: [...] }
    if (data.success && data.data) {
      return data.data;
    }
    // Si viene directamente como array
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('🔴 Error en getAllSocialNetworks:', error);
    console.error('🔴 URL intentada:', API_URL_SOCIAL_NETWORKS_ALL);
    
    // Si es 404, verificar si el router está montado correctamente
    if (error.message.includes('404')) {
      console.warn('⚠️ Ruta no encontrada. Verifica que el router esté montado en el backend.');
      console.warn('⚠️ Ruta esperada:', API_URL_SOCIAL_NETWORKS_ALL);
    }
    
    throw error;
  }
};

/**
 * Obtener una red social por ID
 */
export const getSocialNetworkById = async (id) => {
  try {
    const url = API_URL_SOCIAL_NETWORKS_BY_ID.replace(':id', id);
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    // El backend devuelve { success: true, data: {...} }
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error en getSocialNetworkById:', error);
    throw error;
  }
};

/**
 * Crear una nueva red social
 */
export const createSocialNetwork = async (networkData) => {
  try {
    console.log('🔵 createSocialNetwork - URL:', API_URL_SOCIAL_NETWORKS_CREATE);
    console.log('🔵 createSocialNetwork - Payload:', {
      plataforma: networkData.platform || networkData.plataforma,
      nombre_usuario: networkData.name || networkData.nombre_usuario,
      url: networkData.url,
      icono: networkData.icon || networkData.icono,
      cantidad_seguidores: networkData.followers || networkData.cantidad_seguidores || 0,
      activa: networkData.active !== undefined ? networkData.active : (networkData.activa !== undefined ? networkData.activa : true),
    });
    
    const data = await fetchWithAuth(API_URL_SOCIAL_NETWORKS_CREATE, {
      method: 'POST',
      body: JSON.stringify({
        plataforma: networkData.platform || networkData.plataforma,
        nombre_usuario: networkData.name || networkData.nombre_usuario,
        url: networkData.url,
        icono: networkData.icon || networkData.icono,
        cantidad_seguidores: networkData.followers || networkData.cantidad_seguidores || 0,
        activa: networkData.active !== undefined ? networkData.active : (networkData.activa !== undefined ? networkData.activa : true),
      }),
    });
    
    // El backend devuelve { success: true, data: {...} }
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error en createSocialNetwork:', error);
    throw error;
  }
};

/**
 * Actualizar una red social
 */
export const updateSocialNetwork = async (id, networkData) => {
  try {
    const url = API_URL_SOCIAL_NETWORKS_UPDATE.replace(':id', id);
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify({
        plataforma: networkData.platform || networkData.plataforma,
        nombre_usuario: networkData.name || networkData.nombre_usuario,
        url: networkData.url,
        icono: networkData.icon !== undefined ? networkData.icon : networkData.icono,
        cantidad_seguidores: networkData.followers !== undefined ? networkData.followers : networkData.cantidad_seguidores,
        activa: networkData.active !== undefined ? networkData.active : networkData.activa,
      }),
    });
    
    // El backend devuelve { success: true, data: {...} }
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error en updateSocialNetwork:', error);
    throw error;
  }
};

/**
 * Eliminar una red social
 */
export const deleteSocialNetwork = async (id) => {
  try {
    const url = API_URL_SOCIAL_NETWORKS_DELETE.replace(':id', id);
    const data = await fetchWithAuth(url, {
      method: 'DELETE',
    });
    return data;
  } catch (error) {
    console.error('Error en deleteSocialNetwork:', error);
    throw error;
  }
};

/**
 * Activar/Desactivar una red social
 */
export const toggleSocialNetwork = async (id) => {
  try {
    const url = API_URL_SOCIAL_NETWORKS_TOGGLE.replace(':id', id);
    const data = await fetchWithAuth(url, {
      method: 'PATCH',
    });
    
    // El backend devuelve { success: true, data: {...} }
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error en toggleSocialNetwork:', error);
    throw error;
  }
};

/**
 * Obtener solo redes activas
 */
export const getActiveSocialNetworks = async () => {
  try {
    const data = await fetchWithAuth(API_URL_SOCIAL_NETWORKS_ACTIVE, {
      method: 'GET',
    });
    
    // El backend devuelve { success: true, data: [...] }
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error en getActiveSocialNetworks:', error);
    throw error;
  }
};

/**
 * Obtener total de seguidores
 */
export const getTotalFollowers = async () => {
  try {
    const data = await fetchWithAuth(API_URL_SOCIAL_NETWORKS_TOTAL_FOLLOWERS, {
      method: 'GET',
    });
    
    // El backend devuelve { success: true, data: { seguidores_totales: ... } }
    if (data.success && data.data) {
      return data.data.seguidores_totales || 0;
    }
    return data.seguidores_totales || 0;
  } catch (error) {
    console.error('Error en getTotalFollowers:', error);
    return 0;
  }
};

/**
 * Contar redes sociales por plataforma
 */
export const countByPlatform = async (plataforma) => {
  try {
    const url = API_URL_SOCIAL_NETWORKS_COUNT.replace(':plataforma', plataforma);
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    // El backend devuelve { success: true, data: { count: ... } } o similar
    if (data.success && data.data) {
      return data.data.count || data.data;
    }
    return data.count || data;
  } catch (error) {
    console.error('Error en countByPlatform:', error);
    throw error;
  }
};

// Mantener compatibilidad con el código existente
export const getSocialMedia = getAllSocialNetworks;
export const updateSocialMedia = updateSocialNetwork;
