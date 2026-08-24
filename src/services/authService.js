// authService.js - Servicio de autenticación mejorado para Dashboard
import { 
  BASE_URL, 
  API_URL_AUTH_LOGIN, 
  API_URL_AUTH_LOGOUT, 
  API_URL_AUTH_REGISTER,
  DASHBOARD_CONFIG 
} from './config';
import { jwtDecode } from 'jwt-decode';

const API_URL = BASE_URL;

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token de autenticación
 */
export const login = async (email, password) => {
  try {
    console.log('🔵 Login - Iniciando login con email:', email);
    
    const response = await fetch(API_URL_AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('🔵 Login - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Login - Error response:', errorData);
      throw new Error(errorData.message || 'Credenciales inválidas');
    }
    
    const data = await response.json();
    console.log('🔵 Login - Response data structure:', {
      hasData: !!data.data,
      hasUser: !!data.user,
      hasToken: !!data.token,
      dataKeys: Object.keys(data)
    });

    // El backend puede devolver los datos en data.data o directamente en data
    const responseData = data.data || data;
    const token = responseData.token || data.token;
    const user = responseData.user || data.user;

    if (!user || !token) {
      console.error('❌ Login - Respuesta incompleta:', { hasUser: !!user, hasToken: !!token });
      throw new Error('No se recibió un token de autenticación válido');
    }

    console.log('🔵 Login - Token recibido (primeros 20 chars):', token.substring(0, 20));
    console.log('🔵 Login - User data:', {
      user_id: user.user_id,
      email: user.email,
      name: user.name
    });

    // Decodificar el token para verificar su contenido
    try {
      const decoded = jwtDecode(token);
      console.log('🔑 Token decoded:', {
        user_id: decoded.user_id,
        id: decoded.id,
        sub: decoded.sub,
        email: decoded.email,
        exp: decoded.exp,
        isExpired: decoded.exp < Date.now() / 1000
      });
    } catch (e) {
      console.error('❌ Error decodificando token:', e);
    }

    // Almacenar token
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY, token);
    localStorage.setItem('token', token); // Fallback
    console.log('✅ Login - Token guardado');
    
    // Store user ID with multiple fallbacks
    let userId = user.user_id || user.id || user._id;
    if (userId) {
      // Convertir a número para asegurar consistencia
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum) && userIdNum > 0) {
        // Guardar como número en ambas claves
        localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
        localStorage.setItem('userId', userIdNum.toString());
        
        // También actualizar el objeto user para que tenga userId como número
        const updatedUser = { ...user, user_id: userIdNum };
        localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Fallback
        
        console.log('✅ Login - userId guardado como número:', userIdNum);
        console.log('✅ Login - User object guardado');
      } else {
        console.error('❌ Login - userId no es un número válido:', userId);
      }
    } else {
      console.warn('⚠️ Login - No se encontró userId en la respuesta del usuario');
      // Intentar obtener del token JWT como último recurso
      try {
        const decoded = jwtDecode(token);
        const tokenUserId = decoded.user_id || decoded.id || decoded.sub;
        if (tokenUserId) {
          const userIdNum = parseInt(tokenUserId, 10);
          if (!isNaN(userIdNum) && userIdNum > 0) {
            localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
            localStorage.setItem('userId', userIdNum.toString());
            
            // Actualizar el objeto user con el userId del token
            const updatedUser = { ...user, user_id: userIdNum };
            localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            console.log('✅ Login - userId obtenido del token JWT como número:', userIdNum);
          }
        }
      } catch (e) {
        console.error('❌ Error decodificando token para obtener userId:', e);
      }
    }

    // Almacenar timestamp de login para control de sesión
    localStorage.setItem('loginTimestamp', Date.now().toString());
    
    // Si hay refresh token, almacenarlo
    if (responseData.refreshToken || data.refreshToken) {
      const refreshToken = responseData.refreshToken || data.refreshToken;
      localStorage.setItem(DASHBOARD_CONFIG.AUTH.REFRESH_TOKEN_KEY, refreshToken);
      console.log('✅ Login - Refresh token guardado');
    }
    
    console.log('✅ Login - Proceso completado exitosamente');
    return user;
  } catch (error) {
    console.error('❌ Error en authService.login:', error);
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
 * @returns {string|number|null} ID del usuario o null si no hay sesión activa
 */
export const getCurrentUserId = () => {
  // Intentar obtener de múltiples fuentes
  let userId = localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY);
  
  // Si no está en la clave configurada, intentar con 'userId' (fallback)
  if (!userId) {
    userId = localStorage.getItem('userId');
  }
  
  // Si aún no hay userId, intentar obtenerlo del objeto user
  if (!userId) {
    try {
      const userStr = localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_KEY) || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.user_id || user.id || user._id;
        // Si encontramos el userId, guardarlo para futuras consultas
        if (userId) {
          const userIdNum = parseInt(userId, 10);
          if (!isNaN(userIdNum) && userIdNum > 0) {
            localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
            localStorage.setItem('userId', userIdNum.toString());
            
            // Actualizar el objeto user para que tenga userId como número
            user.user_id = userIdNum;
            localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
    } catch (e) {
      console.error('Error parseando user para obtener userId:', e);
    }
  }
  
  // Si aún no hay userId, intentar decodificar el token JWT
  if (!userId) {
    try {
      const token = getAuthToken();
      if (token) {
        const decoded = jwtDecode(token);
        userId = decoded.user_id || decoded.id || decoded.sub;
        if (userId) {
          const userIdNum = parseInt(userId, 10);
          if (!isNaN(userIdNum) && userIdNum > 0) {
            localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
            localStorage.setItem('userId', userIdNum.toString());
          }
        }
      }
    } catch (e) {
      console.error('Error decodificando token para obtener userId:', e);
    }
  }
  
  // Validar que el userId sea válido y convertir a número
  if (userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum) || userIdNum <= 0) {
      console.warn('⚠️ getCurrentUserId - userId no es válido:', userId);
      return null;
    }
    
    // Auto-corrección: si está guardado como string, convertir a número
    if (typeof userId === 'string' && userId !== userIdNum.toString()) {
      console.log('🔧 Auto-corrigiendo userId de string a número:', userId, '->', userIdNum);
      localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
      localStorage.setItem('userId', userIdNum.toString());
    }
    
    return userIdNum;
  }
  
  return null;
};

/**
 * Obtiene el token de autenticación actual
 * @returns {string|null} Token de autenticación o null si no hay sesión activa
 */
export const getAuthToken = () => {
  return (
    localStorage.getItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('authToken')
  );
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