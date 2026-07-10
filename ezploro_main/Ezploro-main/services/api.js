// services/api.js - Cliente HTTP base
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiClient {
  constructor() {
    this.token = null;
    this.onTokenInvalid = null; // Callback para cuando el token es inválido
  }

  // Método para registrar callback de token inválido
  setTokenInvalidCallback(callback) {
    this.onTokenInvalid = callback;
  }

  async getToken() {
    try {
      if (!this.token) {
        const storedToken = await AsyncStorage.getItem('token');
        this.token = storedToken;
      }
      
      // Verificar que el token no esté vacío o sea null
      if (!this.token || this.token === 'null' || this.token === 'undefined') {
        console.warn('⚠️ Token no válido encontrado:', this.token);
        this.token = null;
        return null;
      }
      
      return this.token;
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      this.token = null;
      return null;
    }
  }

  setToken(token) {
    try {
      this.token = token;
      if (token) {
        console.log('🔑 Guardando token:', token.substring(0, 20) + '...');
        AsyncStorage.setItem('token', token);
      } else {
        console.log('🔑 Eliminando token del storage');
        AsyncStorage.removeItem('token');
      }
    } catch (error) {
      console.error('❌ Error estableciendo token:', error);
    }
  }

  async request(url, options = {}) {
    let token = await this.getToken();
    let useToken = true; // Variable para controlar si usar el token
    
    // Verificar si es un token de invitado
    if (token && token.startsWith('guest_token_')) {
      console.log('👤 Token de invitado detectado');
      
      // Para usuarios invitados, permitir ver eventos pero bloquear funciones de usuario
      if (url.includes('/notifications') && !url.includes('/events')) {
        console.log('👤 Bloqueando notificaciones para invitado');
        return { data: [], notifications: [], total: 0, unread: 0 };
      }
      
      if (url.includes('/subscriptions') || url.includes('/bookmarks')) {
        console.log('👤 Bloqueando suscripciones/bookmarks para invitado');
        return { data: [], subscriptions: [], bookmarks: [] };
      }
      
      // Para likes de eventos, permitir la consulta pero devolver 0
      if (url.includes('/event-likes/count/')) {
        console.log('👤 Permitiendo consulta de likes para invitado (devolviendo 0)');
        return { count: 0, userLiked: false };
      }
      
      if (url.includes('/likes')) {
        console.log('👤 Bloqueando otras operaciones de likes para invitado');
        return { data: [], likes: [] };
      }
      
      if (url.includes('/stats') && url.includes('/notifications')) {
        console.log('👤 Bloqueando stats de notificaciones para invitado');
        return { data: { total: 0, unread: 0 } };
      }
      
      if (url.includes('/register-device') || url.includes('/preferences')) {
        console.log('👤 Bloqueando registro de dispositivo para invitado');
        throw new Error('Funcionalidad no disponible para usuarios invitados');
      }
      
      // Para eventos, ubicaciones y categorías, usar el token guest para identificación
      if (url.includes('/events') || url.includes('/locations') || url.includes('/categories') || url.includes('/tools')) {
        console.log('👤 Permitiendo acceso a eventos/ubicaciones/categorías para invitado (con token guest)');
        // Mantener useToken = true para enviar el token guest
      }
    }
    
    // Intentar decodificar el token para ver si está expirado (solo si vamos a usar el token)
    if (token && useToken) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp && payload.exp < now;
        console.log('🔑 Token Info:', {
          userId: payload.user_id || payload.id,
          exp: payload.exp,
          now: now,
          isExpired: isExpired,
          expiresIn: payload.exp ? `${payload.exp - now}s` : 'unknown',
          expDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'no expiration',
          nowDate: new Date(now * 1000).toISOString()
        });
        
        if (isExpired) {
          console.warn('⚠️ Token is expired, clearing it');
          this.setToken(null);
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
      } catch (decodeError) {
        console.warn('⚠️ Could not decode token:', decodeError.message);
      }
    }
    
    const config = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Solo agregar Authorization si hay token y debemos usarlo
    if (token && useToken) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Solo agregar Content-Type si no es FormData
    if (!(config.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      
      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }
    }
    // Para FormData, el navegador establecerá automáticamente el Content-Type correcto

    // Debug: Log del token para verificar que existe (después de configurar headers)
    console.log('🔑 API Request Debug:', {
      url: url.substring(0, 100) + '...',
      hasToken: !!token,
      useToken: useToken,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      method: options.method || 'GET',
      hasAuthHeader: !!config.headers.Authorization,
      authHeaderValue: config.headers.Authorization ? config.headers.Authorization.substring(0, 20) + '...' : 'NO AUTH',
      contentType: config.headers['Content-Type'],
      isFormData: config.body instanceof FormData,
      allHeaders: Object.keys(config.headers),
      fullAuthHeader: config.headers.Authorization ? 'PRESENT' : 'MISSING'
    });

    let response;
    try {
      console.log('🌐 Making request to:', url);
      console.log('🌐 Request config:', {
        method: config.method || 'GET',
        hasAuth: !!config.headers.Authorization,
        contentType: config.headers['Content-Type']
      });
      
      response = await fetch(url, config);
      
      console.log('🌐 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
    } catch (networkError) {
      console.error('🌐 Network error:', networkError);
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
    }
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (jsonError) {
        error = { message: `Error ${response.status}: ${response.statusText}` };
      }
      
      console.error('🚨 API Error Details:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Si es error 401 o 403, probablemente el token esté expirado o sea inválido
      if (response.status === 401 || response.status === 403) {
        console.log('🔑 Token inválido o expirado detectado (401/403), limpiando token...');
        
        // Para usuarios guest, no activar logout automático en ciertas URLs
        const currentToken = await this.getToken();
        const isGuestToken = currentToken && currentToken.startsWith('guest_token_');
        const isGuestRestrictedUrl = url.includes('/followers-count') || 
                                   url.includes('/following-count') || 
                                   url.includes('/friend-request') ||
                                   url.includes('/posts/user/') ||
                                   url.includes('/event-subscriptions') ||
                                   url.includes('/event-messages') ||
                                   url.includes('/event-likes/count/');
        
        if (isGuestToken && isGuestRestrictedUrl) {
          console.log('👤 Usuario guest intentando acceder a URL restringida, no hacer logout automático');
          // No limpiar token ni activar callback para usuarios guest en URLs restringidas
        } else {
          this.setToken(null);
          
          // Llamar al callback para notificar al AuthContext
          if (this.onTokenInvalid) {
            console.log('🔑 Notificando al AuthContext sobre token inválido...');
            this.onTokenInvalid();
          }
        }
      }
      
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Intentar parsear JSON, pero manejar respuestas vacías
    try {
      const text = await response.text();
      console.log('🌐 Response text:', text ? text.substring(0, 200) + '...' : 'EMPTY RESPONSE');
      
      if (!text || text.trim() === '') {
        console.warn('⚠️ Empty response received from server');
        return null;
      }
      
      const jsonData = JSON.parse(text);
      console.log('🌐 Parsed JSON:', typeof jsonData, jsonData);
      return jsonData;
    } catch (parseError) {
      console.error('🚨 JSON Parse Error:', parseError);
      console.error('🚨 Response was not valid JSON');
      throw new Error('El servidor devolvió una respuesta inválida');
    }
  }

  get(url, options = {}) {
    return this.request(url, { method: 'GET', ...options });
  }

  post(url, data, options = {}) {
    return this.request(url, { method: 'POST', body: data, ...options });
  }

  put(url, data, options = {}) {
    return this.request(url, { method: 'PUT', body: data, ...options });
  }

  patch(url, data, options = {}) {
    return this.request(url, { method: 'PATCH', body: data, ...options });
  }

  delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options });
  }

  // Función para verificar si hay un token válido
  async hasValidToken() {
    const token = await this.getToken();
    return !!token;
  }

  // Función para limpiar token manualmente
  clearToken() {
    this.setToken(null);
  }

  // Función para verificar y refrescar token si es necesario
  async ensureValidToken() {
    const token = await this.getToken();
    if (!token) {
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      
      if (isExpired) {
        console.log('🔑 Token expirado, limpiando...');
        this.setToken(null);
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      return token;
    } catch (error) {
      console.error('🔑 Error validating token:', error);
      this.setToken(null);
      throw new Error('Token inválido. Por favor inicia sesión nuevamente.');
    }
  }
}

export default new ApiClient();