import { API_URL_SOCIAL_MEDIA } from './config';
import { fetchWithAuth } from './userService';

export const getSocialMedia = async () => {
  try {
    const response = await fetchWithAuth(API_URL_SOCIAL_MEDIA, {
      method: 'GET',
    });
    return response.data || [];
  } catch (error) {
    console.error('Error en getSocialMedia:', error);
    // Return empty array if server returns 400 or user ID errors
    if (error.message.includes('400') || error.message.includes('ID de usuario inválido')) {
      return [];
    }
    throw error;
  }
};

export const updateSocialMedia = async (socialMediaData) => {
  try {
    const response = await fetchWithAuth(API_URL_SOCIAL_MEDIA, {
      method: 'PUT',
      body: JSON.stringify(socialMediaData),
    });
    return response.data;
  } catch (error) {
    console.error('Error en updateSocialMedia:', error);
    throw error;
  }
};