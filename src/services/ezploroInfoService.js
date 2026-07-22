import { fetchWithAuth } from './userService';
import { BASE_URL } from './config';

// URLs para el endpoint de información de Ezploro
const API_URL_EZPLORO_INFO = `${BASE_URL}/ezploro-info`;

/**
 * Obtener la información de Ezploro
 * @returns {Promise<Object>} Información de Ezploro
 */
export const getEzploroInfo = async () => {
  try {
    console.log('🔵 getEzploroInfo - URL:', API_URL_EZPLORO_INFO);
    
    const data = await fetchWithAuth(API_URL_EZPLORO_INFO, {
      method: 'GET',
    });
    
    console.log('🔵 getEzploroInfo - Response:', data);
    return data;
  } catch (error) {
    console.error('🔴 Error en getEzploroInfo:', error);
    throw error;
  }
};

/**
 * Crear la información de Ezploro
 * @param {Object} infoData - Datos de la información
 * @returns {Promise<Object>} Información creada
 */
export const createEzploroInfo = async (infoData) => {
  try {
    const data = await fetchWithAuth(API_URL_EZPLORO_INFO, {
      method: 'POST',
      body: JSON.stringify(infoData),
    });
    
    return data;
  } catch (error) {
    console.error('Error en createEzploroInfo:', error);
    throw error;
  }
};

/**
 * Actualizar la información de Ezploro
 * @param {Object} infoData - Datos a actualizar
 * @returns {Promise<Object>} Información actualizada
 */
export const updateEzploroInfo = async (infoData) => {
  try {
    const data = await fetchWithAuth(API_URL_EZPLORO_INFO, {
      method: 'PUT',
      body: JSON.stringify(infoData),
    });
    
    return data;
  } catch (error) {
    console.error('Error en updateEzploroInfo:', error);
    throw error;
  }
};

/**
 * Actualización parcial de la información de Ezploro
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Información actualizada
 */
export const patchEzploroInfo = async (updates) => {
  try {
    const data = await fetchWithAuth(API_URL_EZPLORO_INFO, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    return data;
  } catch (error) {
    console.error('Error en patchEzploroInfo:', error);
    throw error;
  }
};

/**
 * Eliminar la información de Ezploro
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const deleteEzploroInfo = async () => {
  try {
    const data = await fetchWithAuth(API_URL_EZPLORO_INFO, {
      method: 'DELETE',
    });
    
    return data;
  } catch (error) {
    console.error('Error en deleteEzploroInfo:', error);
    throw error;
  }
};

/**
 * Subir el logo de Ezploro
 * @param {File} file - Archivo de imagen del logo
 * @param {Object} currentInfo - Información actual de Ezploro para evitar limpiar otros campos
 * @returns {Promise<Object>} Respuesta del servidor con los datos actualizados
 */
export const uploadEzploroLogo = async (file, currentInfo = {}) => {
  try {
    // Importación dinámica o local para evitar dependencias circulares si existieran
    const { getAuthToken } = await import('./authService');
    const token = getAuthToken();
    
    const formData = new FormData();
    formData.append('logo', file);

    // Adjuntar los campos de texto actuales para que el backend no los borre al actualizar
    Object.keys(currentInfo).forEach((key) => {
      if (key !== 'logo' && currentInfo[key] !== undefined && currentInfo[key] !== null) {
        formData.append(key, currentInfo[key]);
      }
    });

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Usamos PATCH por defecto para actualizar el registro existente
    let response = await fetch(API_URL_EZPLORO_INFO, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    // Si el registro no existe aún (404), usamos POST para crearlo por primera vez
    if (response.status === 404) {
      console.log('🔵 El registro no existe, intentando crear con POST...');
      response = await fetch(API_URL_EZPLORO_INFO, {
        method: 'POST',
        headers,
        body: formData,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al subir el logo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en uploadEzploroLogo:', error);
    throw error;
  }
};

/**
 * Subir el icono de Ezploro
 * @param {File} file - Archivo de imagen del icono
 * @param {Object} currentInfo - Información actual de Ezploro para evitar limpiar otros campos
 * @returns {Promise<Object>} Respuesta del servidor con los datos actualizados
 */
export const uploadEzploroIcon = async (file, currentInfo = {}) => {
  try {
    const { getAuthToken } = await import('./authService');
    const token = getAuthToken();
    
    const formData = new FormData();
    formData.append('icono', file);

    // Adjuntar los campos de texto actuales para que el backend no los borre al actualizar
    Object.keys(currentInfo).forEach((key) => {
      if (key !== 'icono' && currentInfo[key] !== undefined && currentInfo[key] !== null) {
        formData.append(key, currentInfo[key]);
      }
    });

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Usamos PATCH por defecto para actualizar el registro existente
    let response = await fetch(API_URL_EZPLORO_INFO, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    // Si el registro no existe aún (404), usamos POST para crearlo por primera vez
    if (response.status === 404) {
      console.log('🔵 El registro no existe, intentando crear con POST...');
      response = await fetch(API_URL_EZPLORO_INFO, {
        method: 'POST',
        headers,
        body: formData,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al subir el icono');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en uploadEzploroIcon:', error);
    throw error;
  }
};

