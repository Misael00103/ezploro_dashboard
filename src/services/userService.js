// services/userService.js
import {
  API_URL_USERS_ME,
  API_URL_USERS_UPDATE,
  API_URL_PASSWORD_CHANGE,
  API_URL_USERS_UPLOAD_IMAGE,
  API_URL_NOTIFICATIONS_PREFERENCES
} from './config';
import { jwtDecode } from 'jwt-decode';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token') || '';
};

// Helper function to get userId from localStorage or token
const getUserId = () => {
  const userId = localStorage.getItem('userId');
  if (userId) return userId;

  // Fallback: Extract user_id from token
  const token = getAuthToken();
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.user_id || '';
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  }
  return '';
};

// Helper function to make authenticated fetch requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('No autorizado: Por favor, inicia sesión nuevamente.');
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
    if (data.data && data.data.user_id) {
      localStorage.setItem('userId', data.data.user_id);
    }
    return data.data;
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
      throw new Error('No se encontró el ID de usuario. Por favor, inicia sesión.');
    }
    const url = API_URL_USERS_UPDATE.replace(':userId', userId);
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    // Update localStorage with new user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.data }));
    localStorage.setItem('userId', data.data.user_id);

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
    const data = await fetchWithAuth(API_URL_PASSWORD_CHANGE, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data;
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
      throw new Error('No se encontró el ID de usuario. Por favor, inicia sesión.');
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
      throw new Error('No se encontró el ID de usuario. Por favor, inicia sesión.');
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