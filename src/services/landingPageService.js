import { API_URL_LANDING_PAGE } from './config';
import { fetchWithAuth } from './userService';

export const getLandingPageContent = async () => {
  try {
    console.log('🔵 getLandingPageContent - Iniciando petición...');
    const response = await fetchWithAuth(API_URL_LANDING_PAGE, {
      method: 'GET',
    });
    console.log('✅ getLandingPageContent - Respuesta recibida');
    return response.data || response || {};
  } catch (error) {
    console.error('❌ Error en getLandingPageContent:', error);
    // Return empty object for any error to prevent dashboard from breaking
    return {};
  }
};

export const updateLandingPageContent = async (content) => {
  try {
    const response = await fetchWithAuth(API_URL_LANDING_PAGE, {
      method: 'PUT',
      body: JSON.stringify(content),
    });
    return response.data;
  } catch (error) {
    console.error('Error en updateLandingPageContent:', error);
    throw error;
  }
};