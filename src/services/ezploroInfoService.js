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
