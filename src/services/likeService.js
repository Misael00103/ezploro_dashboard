import { fetchWithAuth } from './userService';
import { API_URL_LIKES_BY_USER, API_URL_LIKES_EVENTS_BY_USER } from './config';

// Get all likes from a user
export const getUserLikes = async (userId) => {
  try {
    const response = await fetchWithAuth(API_URL_LIKES_BY_USER.replace(':userId', userId), {
      method: 'GET',
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting user likes:', error);
    return [];
  }
};

// Get event likes from a user
export const getUserEventLikes = async (userId) => {
  try {
    const response = await fetchWithAuth(API_URL_LIKES_EVENTS_BY_USER.replace(':userId', userId), {
      method: 'GET',
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting user event likes:', error);
    return [];
  }
};