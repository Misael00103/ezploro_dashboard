import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_URL_AUTH_GOOGLE,
  API_URL_AUTH_LOGIN,
  API_URL_AUTH_LOGOUT,
  API_URL_AUTH_REGISTER
} from '../config';
import api from './api';

export const authService = {
  login: async (email, password) => {
    console.log("🔐 authService.login llamado");
    
    try {
      const response = await api.post(API_URL_AUTH_LOGIN, { email, password });
      
      let token, user;
      
      if (response.data && response.data.token && response.data.user) {
        token = response.data.token;
        user = response.data.user;
      } else if (response.token && response.user) {
        token = response.token;
        user = response.user;
      } else {
        throw new Error(response.message || 'Respuesta del servidor inválida');
      }
      
      if (token && user && user.user_id) {
        api.setToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        return { data: { token, user } };
      }
      
      throw new Error('Credenciales inválidas');
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    }
  },

  register: async (userData) => {
    console.log("🔐 authService.register llamado");
    try {
      const response = await api.post(API_URL_AUTH_REGISTER, userData);
      
      let token, user;
      
      if (response.data && response.data.token && response.data.user) {
        token = response.data.token;
        user = response.data.user;
      } else if (response.token && response.user) {
        token = response.token;
        user = response.user;
      } else {
        throw new Error(response.message || 'Respuesta del servidor inválida');
      }
      
      if (token && user) {
        api.setToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        return { data: { token, user } };
      }
      
      throw new Error('Error en el registro');
    } catch (error) {
      console.error("❌ Error en registro:", error);
      throw error;
    }
  },

  logout: async () => {
    console.log("🔐 authService.logout llamado");
    try {
      try {
        await api.post(API_URL_AUTH_LOGOUT);
      } catch (serverError) {
        console.warn("⚠️ Error en logout del servidor:", serverError.message);
      }
      
      api.clearToken();
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error("❌ Error en logout:", error);
      api.clearToken();
      await AsyncStorage.removeItem('user');
    }
  },

  // ✅ GOOGLE AUTH REAL - Actualizado
  googleAuth: async (accessToken) => {
    console.log("🔐 authService.googleAuth llamado con accessToken real");
    console.log("🔗 URL:", API_URL_AUTH_GOOGLE);
    
    try {
      const response = await api.post(API_URL_AUTH_GOOGLE, { 
        access_token: accessToken // Backend espera access_token, no idToken
      });
      
      console.log("📦 Respuesta completa del backend:", JSON.stringify(response, null, 2));
      
      if (response.data && response.data.token && response.data.user) {
        const token = response.data.token;
        const user = response.data.user;
        
        // Guardar en storage
        api.setToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        console.log("✅ Google auth exitoso para:", user.email);
        return { data: { token, user } };
      }
      
      throw new Error(response.message || 'Error en Google auth');
      
    } catch (error) {
      console.error("❌ Error en Google auth:", error.response?.data || error.message);
      
      // Re-lanzar el error para que el componente maneje el fallback
      if (error.response?.status === 401) {
        throw new Error('Token de Google inválido');
      }
      if (error.response?.status >= 500) {
        throw new Error('Servidor no disponible - modo offline activado');
      }
      
      throw error;
    }
  },

  isLoggedIn: async () => {
    try {
      const token = await api.getToken();
      if (!token) return false;
      await api.ensureValidToken();
      return true;
    } catch (error) {
      return false;
    }
  },

  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("❌ Error obteniendo usuario actual:", error);
      return null;
    }
  },

  guestLogin: async () => {
    console.log("👤 authService.guestLogin llamado");
    try {
      // Crear usuario invitado con datos únicos
      const guestId = `guest_${Date.now()}`;
      const guestUser = {
        user_id: guestId,
        email: `${guestId}@guest.local`,
        name: 'Invitado',
        lastname: '',
        display_name: 'Usuario Invitado',
        username: guestId,
        role: 'guest',
        profile_picture: `https://ui-avatars.com/api/?name=Guest&background=6B7280&color=fff&size=150`,
        is_guest: true,
        bio: "Este es un perfil de invitado temporal.",
        created_at: new Date().toISOString()
      };

      const guestToken = `guest_token_${guestId}_${Date.now()}`;

      // Guardar sesión de invitado
      await AsyncStorage.setItem('user', JSON.stringify(guestUser));
      api.setToken(guestToken);

      console.log("✅ Sesión de invitado creada exitosamente");
      
      return {
        data: {
          token: guestToken,
          user: guestUser
        }
      };
    } catch (error) {
      console.error("❌ Error en guest login:", error);
      throw error;
    }
  }
};

export default authService;