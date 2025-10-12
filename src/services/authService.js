// authService.js
const API_URL = process.env.REACT_APP_API_URL || 'https://api-v3-backend-ezploro.apps.ezploro.com/api';

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token de autenticación
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Credenciales inválidas');
    }

    if (!data.data || !data.data.token) {
      throw new Error('No se recibió un token de autenticación');
    }

    // Almacenar token y datos del usuario
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    localStorage.setItem('userId', data.data.user._id || data.data.user.id);
    
    return data.data;
  } catch (error) {
    console.error('Error en authService.login:', error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario actual
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  // Redirigir a la página de inicio de sesión
  window.location.href = '/login';
};

/**
 * Obtiene el usuario actualmente autenticado
 * @returns {Object|null} Datos del usuario o null si no hay sesión activa
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si el usuario está autenticado, false en caso contrario
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};