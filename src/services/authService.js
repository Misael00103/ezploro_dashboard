// authService.js - Servicio de autenticación mejorado para Dashboard
import { 
  BASE_URL, 
  API_URL_AUTH_LOGIN, 
  API_URL_AUTH_LOGOUT, 
  API_URL_AUTH_REGISTER,
  DASHBOARD_CONFIG 
} from './config';

const API_URL = BASE_URL;

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token de autenticación
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(API_URL_AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Credenciales inválidas');
    }
    
    const data = await response.json();

    if (!data.user || !data.token) {
      throw new Error('No se recibió un token de autenticación');
    }

    // Almacenar datos usando la configuración del dashboard
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY, data.token);
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(data.user));
    
    // Store user ID with multiple fallbacks
    const userId = data.user.user_id || data.user.id;
    if (userId) {
      localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userId);
    } else {
      console.warn('No user ID found in login response');
    }

    // Almacenar timestamp de login para control de sesión
    localStorage.setItem('loginTimestamp', Date.now().toString());
    
    // Si hay refresh token, almacenarlo
    if (data.refreshToken) {
      localStorage.setItem(DASHBOARD_CONFIG.AUTH.REFRESH_TOKEN_KEY, data.refreshToken);
    }
    
    return data.user;
  } catch (error) {
    console.error('Error en authService.login:', error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario
 * @param {Object} userData - Datos del usuario a registrar
 * @returns {Promise<Object>} Datos del usuario registrado
 */
export const register = async (userData) => {
  try {
    const response = await fetch(API_URL_AUTH_REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al registrar usuario');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en authService.register:', error);
    throw error;
  }
};
/**
 * Cierra la sesión del usuario actual
 * @param {boolean} redirect - Si debe redirigir automáticamente al login
 */
export const logout = async (redirect = true) => {
  try {
    const token = localStorage.getItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
    
    // Intentar hacer logout en el servidor si hay token
    if (token) {
      await fetch(API_URL_AUTH_LOGOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignorar errores del servidor en logout
        console.warn('Error al hacer logout en el servidor, continuando con logout local');
      });
    }
  } catch (error) {
    console.warn('Error durante logout:', error);
  } finally {
    // Limpiar localStorage usando la configuración del dashboard
    localStorage.removeItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY);
    localStorage.removeItem(DASHBOARD_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    localStorage.removeItem('loginTimestamp');
    
    // Redirigir a la página de inicio de sesión si se solicita
    if (redirect) {
      window.location.href = '/login';
    }
  }
};

/**
 * Obtiene el usuario actualmente autenticado
 * @returns {Object|null} Datos del usuario o null si no hay sesión activa
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

/**
 * Obtiene el ID del usuario actual
 * @returns {string|null} ID del usuario o null si no hay sesión activa
 */
export const getCurrentUserId = () => {
  return localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY);
};

/**
 * Obtiene el token de autenticación actual
 * @returns {string|null} Token de autenticación o null si no hay sesión activa
 */
export const getAuthToken = () => {
  return localStorage.getItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si el usuario está autenticado, false en caso contrario
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
  const user = localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_KEY);
  return !!(token && user);
};

/**
 * Verifica si la sesión ha expirado
 * @returns {boolean} true si la sesión ha expirado, false en caso contrario
 */
export const isSessionExpired = () => {
  const loginTimestamp = localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return true;
  
  const now = Date.now();
  const sessionAge = now - parseInt(loginTimestamp);
  return sessionAge > DASHBOARD_CONFIG.AUTH.SESSION_TIMEOUT;
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar
 * @returns {boolean} true si el usuario tiene el rol, false en caso contrario
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

/**
 * Verifica si el usuario es administrador
 * @returns {boolean} true si el usuario es admin, false en caso contrario
 */
export const isAdmin = () => {
  return hasRole(DASHBOARD_CONFIG.ROLES.ADMIN);
};

/**
 * Actualiza los datos del usuario en localStorage
 * @param {Object} userData - Nuevos datos del usuario
 */
export const updateUserData = (userData) => {
  try {
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error al actualizar datos del usuario:', error);
  }
};