import { API_URL_LANDING_PAGE } from './config';
import { fetchWithAuth } from './userService';

export const getLandingPageContent = async () => {
  try {
    const response = await fetchWithAuth(API_URL_LANDING_PAGE, {
      method: 'GET',
    });
    return response.data || {};
  } catch (error) {
    console.error('Error en getLandingPageContent:', error);
    // Return empty object if server returns 400 or user ID errors
    if (error.message.includes('400') || error.message.includes('ID de usuario inválido')) {
      return {};
    }
    throw error;
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