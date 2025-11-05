// services/userService.js - Servicio de usuarios actualizado para Dashboard
import {
  API_URL_USERS_ME,
  API_URL_USERS_UPDATE,
  API_URL_PASSWORD_CHANGE,
  API_URL_USERS_UPLOAD_IMAGE,
  API_URL_NOTIFICATIONS_PREFERENCES,
  DASHBOARD_CONFIG
} from './config';
import { getAuthToken, getCurrentUserId } from './authService';
import { jwtDecode } from 'jwt-decode';

// Helper function to get userId (usando el servicio de auth)
const getUserId = () => {
  return getCurrentUserId();
};

// Export getCurrentUserId for backward compatibility
export { getCurrentUserId };

// Helper function to make authenticated fetch requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // Log para debugging
  console.log('🔵 fetchWithAuth - URL:', url);
  console.log('🔵 fetchWithAuth - Method:', options.method || 'GET');
  console.log('🔵 fetchWithAuth - Headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'Missing'
  });

  const response = await fetch(url, { ...options, headers });
  
  console.log('🔵 fetchWithAuth - Response status:', response.status);
  console.log('🔵 fetchWithAuth - Response ok:', response.ok);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    console.error('🔴 fetchWithAuth - Error response:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });
    
    if (response.status === 401) {
      // Sesión expirada, limpiar localStorage y redirigir
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_KEY);
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY);
      throw new Error('Sesión expirada: Por favor, inicia sesión nuevamente.');
    }
    
    if (response.status === 403) {
      throw new Error('Acceso denegado: No tienes permisos para realizar esta acción.');
    }
    
    throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
  }
  
  return response.json();
};

// Obtiene la configuración completa del usuario actual
export const getUserProfile = async () => {
  try {
    const data = await fetchWithAuth(API_URL_USERS_ME, {
      method: 'GET',
    });
    console.log('getUserProfile response:', data);
    if (data.data) {
      const userId = data.data.user_id || data.data.id || data.data._id;
      if (userId) {
        localStorage.setItem('userId', userId);
        localStorage.setItem('user', JSON.stringify(data.data));
      }
    }
    return data.data;
    console.log('getUserProfile data:', data);
  } catch (error) {
    console.error('Error en userService.getUserProfile:', error);
    throw error;
  }
};

// Actualiza la configuración del usuario
export const updateUserProfile = async (userData) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    const url = API_URL_USERS_UPDATE.replace(':userId', userId);
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    // Update localStorage with new user data usando configuración del dashboard
    const currentUser = JSON.parse(localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_KEY) || '{}');
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify({ ...currentUser, ...data.data }));
    
    // Update user ID with fallbacks
    const newUserId = data.data.user_id || data.data.id || data.data._id;
    if (newUserId) {
      localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, newUserId);
    }

    return data.data;
  } catch (error) {
    console.error('Error en userService.updateUserProfile:', error);
    throw error;
  }
};

// Sube una imagen de perfil
export const uploadProfilePicture = async (file) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'profile');

    const response = await fetch(API_URL_USERS_UPLOAD_IMAGE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al subir la imagen');
    }

    return data.url;
  } catch (error) {
    console.error('Error en userService.uploadProfilePicture:', error);
    throw error;
  }
};

// Cambia la contraseña del usuario
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    // Try multiple field name combinations that the backend might expect
    const payloadOptions = [
      { currentPassword, newPassword },
      { current_password: currentPassword, new_password: newPassword },
      { oldPassword: currentPassword, newPassword },
      { old_password: currentPassword, new_password: newPassword }
    ];

    for (let i = 0; i < payloadOptions.length; i++) {
      const payload = payloadOptions[i];
      console.log(`Attempt ${i + 1}: Sending password change with fields:`, Object.keys(payload));
      console.log(`Payload values check:`, {
        field1: Object.values(payload)[0] ? '[HIDDEN]' : 'EMPTY',
        field2: Object.values(payload)[1] ? '[HIDDEN]' : 'EMPTY'
      });

      const response = await fetch(API_URL_PASSWORD_CHANGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Success with payload format ${i + 1}:`, Object.keys(payload));
        return response.json();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`Attempt ${i + 1} failed:`, errorData);
        
        // If this is the last attempt, throw the error
        if (i === payloadOptions.length - 1) {
          throw new Error(errorData.error || errorData.message || `Error HTTP! status: ${response.status}`);
        }
      }
    }
  } catch (error) {
    console.error('Error en changePassword:', error);
    throw error;
  }
};

// Actualiza la configuración de seguridad del usuario
export const updateSecuritySettings = async (securitySettings) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    const url = `${API_URL_USERS_UPDATE.replace(':userId', userId)}/security`;
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(securitySettings),
    });
    return data;
  } catch (error) {
    console.error('Error en updateSecuritySettings:', error);
    throw error;
  }
};

// Actualiza la configuración de notificaciones del usuario
export const updateNotificationSettings = async (notificationSettings) => {
  try {
    const data = await fetchWithAuth(API_URL_NOTIFICATIONS_PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(notificationSettings),
    });
    return data;
  } catch (error) {
    console.error('Error en updateNotificationSettings:', error);
    throw error;
  }
};

// Actualiza las preferencias del dashboard del usuario
export const updateDashboardPreferences = async (preferences) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    const url = `${API_URL_USERS_UPDATE.replace(':userId', userId)}/preferences`;
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return data;
  } catch (error) {
    console.error('Error en updateDashboardPreferences:', error);
    throw error;
  }
};