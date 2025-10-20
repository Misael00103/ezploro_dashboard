// useAuth.js - Hook personalizado para manejo de autenticación en el Dashboard
import { useState, useEffect, useCallback } from 'react';
import { 
  login as authLogin, 
  logout as authLogout, 
  getCurrentUser, 
  getCurrentUserId,
  isAuthenticated, 
  isSessionExpired,
  hasRole,
  isAdmin,
  updateUserData
} from '../services/authService';
import { DASHBOARD_CONFIG } from '../services/config';

/**
 * Hook personalizado para manejo de autenticación
 * @returns {Object} Estado y funciones de autenticación
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar el hook
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Verificar sesión periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated() && isSessionExpired()) {
        handleSessionExpired();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, []);

  /**
   * Verifica el estado de autenticación actual
   */
  const checkAuthStatus = useCallback(() => {
    try {
      setLoading(true);
      
      if (isAuthenticated() && !isSessionExpired()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setError(null);
      } else {
        setUser(null);
        if (isSessionExpired()) {
          handleSessionExpired();
        }
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Error al verificar autenticación');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Maneja la expiración de sesión
   */
  const handleSessionExpired = useCallback(() => {
    setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    logout(false); // No redirigir automáticamente
  }, []);

  /**
   * Inicia sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authLogin(email, password);
      setUser(userData);
      
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cierra sesión
   * @param {boolean} redirect - Si debe redirigir al login
   */
  const logout = useCallback(async (redirect = true) => {
    try {
      setLoading(true);
      await authLogout(redirect);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Continuar con logout local aunque falle el servidor
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualiza los datos del usuario
   * @param {Object} newUserData - Nuevos datos del usuario
   */
  const updateUser = useCallback((newUserData) => {
    try {
      updateUserData(newUserData);
      setUser(newUserData);
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Error al actualizar datos del usuario');
    }
  }, []);

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {boolean} True si tiene el rol
   */
  const checkRole = useCallback((role) => {
    return hasRole(role);
  }, []);

  /**
   * Verifica si el usuario es administrador
   * @returns {boolean} True si es admin
   */
  const checkIsAdmin = useCallback(() => {
    return isAdmin();
  }, []);

  /**
   * Obtiene el ID del usuario actual
   * @returns {string|null} ID del usuario
   */
  const getUserId = useCallback(() => {
    return getCurrentUserId();
  }, []);

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresca los datos del usuario
   */
  const refreshUser = useCallback(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    // Estado
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: checkIsAdmin(),
    userId: getUserId(),
    
    // Funciones
    login,
    logout,
    updateUser,
    checkRole,
    checkIsAdmin,
    getUserId,
    clearError,
    refreshUser,
    checkAuthStatus,
    
    // Utilidades
    sessionTimeRemaining: () => {
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      if (!loginTimestamp) return 0;
      
      const sessionAge = Date.now() - parseInt(loginTimestamp);
      const remaining = DASHBOARD_CONFIG.AUTH.SESSION_TIMEOUT - sessionAge;
      return Math.max(0, remaining);
    },
    
    isSessionExpiring: () => {
      const remaining = this?.sessionTimeRemaining?.() || 0;
      return remaining <= DASHBOARD_CONFIG.AUTH.AUTO_LOGOUT_WARNING;
    }
  };
};

export default useAuth;