// utils/tokenDebug.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.log('🔍 DEBUG: No token found');
      return null;
    }
    
    console.log('🔍 DEBUG: Token found:', token.substring(0, 30) + '...');
    
    // Decodificar el token
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('🔍 DEBUG: Invalid token format');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 DEBUG: Token payload:', {
        user_id: payload.user_id,
        email: payload.email,
        role: payload.role,
        provider: payload.provider,
        exp: payload.exp,
        iat: payload.iat,
        isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : 'unknown'
      });
      
      return payload;
    } catch (decodeError) {
      console.log('🔍 DEBUG: Error decoding token:', decodeError.message);
      return null;
    }
  } catch (error) {
    console.log('🔍 DEBUG: Error getting token:', error.message);
    return null;
  }
};

export const testTokenWithBackend = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('🔍 TEST: No token to test');
      return;
    }
    
    // Test con una ruta simple del backend
    const testUrl = 'https://api-v3-backend-ezploro.apps.ezploro.com/api/users/me';
    
    console.log('🔍 TEST: Testing token with backend...');
    console.log('🔍 TEST: Token preview:', token.substring(0, 30) + '...');
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔍 TEST: Response status:', response.status);
    console.log('🔍 TEST: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 TEST: Token is valid, user:', data.data?.user_id);
      return true;
    } else {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.log('🔍 TEST: Token validation failed:', error);
      return false;
    }
  } catch (error) {
    console.log('🔍 TEST: Network error:', error.message);
    return false;
  }
};