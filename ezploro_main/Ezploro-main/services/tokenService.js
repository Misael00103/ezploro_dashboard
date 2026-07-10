import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import { API_URL_AUTH_LOGIN } from '../config';

class TokenService {
  constructor() {
    this.refreshTimer = null;
    this.isRefreshing = false;
  }

  // Decodificar token manualmente si jwt_decode falla
  decodeTokenManually(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error decodificando token manualmente:', error.message);
      return null;
    }
  }

  // Obtener información del token
  getTokenInfo(token) {
    if (!token) return null;

    try {
      let decoded = jwt_decode(token);
      return decoded;
    } catch (error) {
      console.warn('⚠️ Error con jwt_decode, intentando decodificación manual...');
      return this.decodeTokenManually(token);
    }
  }

  // Verificar si el token expira pronto (en los próximos 5 minutos)
  willExpireSoon(token, minutesBeforeExpiry = 5) {
    const tokenInfo = this.getTokenInfo(token);
    if (!tokenInfo || !tokenInfo.exp) return false;

    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = tokenInfo.exp - currentTime;
    const minutesUntilExpiry = timeUntilExpiry / 60;

    return minutesUntilExpiry <= minutesBeforeExpiry;
  }

  // Verificar si el token está expirado
  isTokenExpired(token) {
    const tokenInfo = this.getTokenInfo(token);
    if (!tokenInfo || !tokenInfo.exp) return false;

    const currentTime = Date.now() / 1000;
    return tokenInfo.exp < currentTime;
  }

  // Renovar token automáticamente
  async refreshToken(currentToken, userCredentials) {
    if (this.isRefreshing) {
      console.log('🔄 Ya hay un refresh en progreso...');
      return null;
    }

    try {
      this.isRefreshing = true;
      console.log('🔄 Renovando token automáticamente...');

      // Si tienes un endpoint de refresh, úsalo
      // const response = await fetch(API_URL_AUTH_REFRESH, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${currentToken}`
      //   }
      // });

      // Si no tienes endpoint de refresh, hacer login silencioso
      if (userCredentials && userCredentials.email && userCredentials.password) {
        const response = await fetch(API_URL_AUTH_LOGIN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userCredentials.email,
            password: userCredentials.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.data?.token;
          
          if (newToken) {
            await AsyncStorage.setItem('token', newToken);
            console.log('✅ Token renovado exitosamente');
            return newToken;
          }
        }
      }

      console.warn('⚠️ No se pudo renovar el token');
      return null;
    } catch (error) {
      console.error('❌ Error renovando token:', error.message);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Iniciar monitoreo automático del token
  startTokenMonitoring(token, onTokenRefreshed, userCredentials) {
    this.stopTokenMonitoring(); // Limpiar timer anterior

    const checkToken = async () => {
      try {
        const currentToken = token || await AsyncStorage.getItem('token');
        if (!currentToken) return;

        if (this.willExpireSoon(currentToken, 5)) { // 5 minutos antes
          console.log('⏰ Token expirará pronto, renovando...');
          const newToken = await this.refreshToken(currentToken, userCredentials);
          
          if (newToken && onTokenRefreshed) {
            onTokenRefreshed(newToken);
          }
        }
      } catch (error) {
        console.error('❌ Error en monitoreo de token:', error.message);
      }
    };

    // Verificar cada 2 minutos
    this.refreshTimer = setInterval(checkToken, 2 * 60 * 1000);
    
    // Verificar inmediatamente
    checkToken();
  }

  // Detener monitoreo
  stopTokenMonitoring() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Obtener tiempo restante del token en minutos
  getTimeUntilExpiry(token) {
    const tokenInfo = this.getTokenInfo(token);
    if (!tokenInfo || !tokenInfo.exp) return null;

    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = tokenInfo.exp - currentTime;
    return Math.max(0, timeUntilExpiry / 60); // en minutos
  }
}

export default new TokenService();