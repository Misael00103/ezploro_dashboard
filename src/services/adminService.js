import { fetchWithAuth } from './userService';
import { API_URL_USERS } from './config';

export const getAllPosts = async () => {
  try {
    // Since posts endpoint doesn't exist, return empty array
    console.log('Posts endpoint not available, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
};