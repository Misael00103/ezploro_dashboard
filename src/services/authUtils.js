// authUtils.js - Authentication utilities
import { jwtDecode } from 'jwt-decode';

/**
 * Debug function to check current authentication state
 */
export const debugAuthState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const userId = localStorage.getItem('userId');
  
  console.log('🔍 Auth Debug State:', {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    hasUser: !!user,
    userId: userId,
    userObject: user ? JSON.parse(user) : null
  });
  
  if (token) {
    try {
      const decoded = jwtDecode(token);
      console.log('🔑 Token decoded:', {
        user_id: decoded.user_id,
        id: decoded.id,
        sub: decoded.sub,
        exp: decoded.exp,
        isExpired: decoded.exp < Date.now() / 1000
      });
    } catch (error) {
      console.error('❌ Token decode error:', error);
    }
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  console.log('🧹 Auth data cleared');
};

/**
 * Validate current authentication state
 */
export const validateAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  
  if (!token) {
    return { valid: false, reason: 'No token found' };
  }
  
  if (!userId || userId === 'undefined' || userId === 'null') {
    return { valid: false, reason: 'Invalid user ID' };
  }
  
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      return { valid: false, reason: 'Token expired' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid token format' };
  }
};