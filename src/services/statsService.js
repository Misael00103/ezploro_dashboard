import { BASE_URL } from './config';

const API_URL_STATS = `${BASE_URL}/stats`;
import { fetchWithAuth } from './userService';

export const getStats = async () => {
  try {
    const response = await fetchWithAuth(API_URL_STATS, {
      method: 'GET',
    });
    return response.data || {
      totalEvents: 0,
      totalAttendees: 0,
      activeUsers: 0,
      totalUsers: 0,
      totalTestimonials: 0,
      totalPosts: 0,
      topCategories: []
    };
  } catch (error) {
    console.error('Error en getStats:', error);
    // Return default stats in case of error (including user ID errors)
    return {
      totalEvents: 0,
      totalAttendees: 0,
      activeUsers: 0,
      totalUsers: 0,
      totalTestimonials: 0,
      totalPosts: 0,
      topCategories: []
    };
  }
};

export const getEventStats = async (eventId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_STATS}/events/${eventId}`, {
      method: 'GET',
    });
    return response.data || {};
  } catch (error) {
    console.error('Error en getEventStats:', error);
    throw error;
  }
};