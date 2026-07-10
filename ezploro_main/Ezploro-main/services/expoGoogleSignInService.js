import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

// Configurar WebBrowser para que funcione correctamente
WebBrowser.maybeCompleteAuthSession();

class ExpoGoogleSignInService {
  constructor() {
    this.clientId = '271449598855-c4dbde6k1btuq0m47fmf309fadg0ooea.apps.googleusercontent.com';
    this.redirectUri = AuthSession.makeRedirectUri({
      scheme: 'com.ezploro.app',
      path: 'auth',
    });
    
    // Control de estado para evitar múltiples llamadas
    this.isAuthInProgress = false;
    
    console.log('🔧 Google Sign-In configurado:', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
    });
  }

  // Crear URL de autorización de Google
  createAuthUrl = async () => {
    try {
      // Generar state y nonce para seguridad
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
        nonce: nonce,
        access_type: 'offline',
        prompt: 'select_account',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('🔗 URL de autorización creada:', authUrl);
      
      return {
        authUrl,
        state,
        nonce,
      };
    } catch (error) {
      console.error('❌ Error creando URL de autorización:', error);
      throw error;
    }
  };

  // Intercambiar código por tokens
  exchangeCodeForTokens = async (code) => {
    try {
      console.log('🔄 Intercambiando código por tokens...');
      
      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      
      const body = new URLSearchParams({
        client_id: this.clientId,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();
      console.log('✅ Tokens obtenidos exitosamente');
      
      return tokens;
    } catch (error) {
      console.error('❌ Error intercambiando código por tokens:', error);
      throw error;
    }
  };

  // Obtener información del usuario
  getUserInfo = async (accessToken) => {
    try {
      console.log('👤 Obteniendo información del usuario...');
      
      const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
      
      const response = await fetch(userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User info failed: ${response.status} - ${errorText}`);
      }

      const userInfo = await response.json();
      console.log('✅ Información del usuario obtenida:', {
        email: userInfo.email,
        name: userInfo.name,
        verified_email: userInfo.verified_email,
      });
      
      return userInfo;
    } catch (error) {
      console.error('❌ Error obteniendo información del usuario:', error);
      throw error;
    }
  };

  // Proceso completo de sign-in usando WebBrowser
  signIn = async () => {
    // Verificar si ya hay una autenticación en progreso
    if (this.isAuthInProgress) {
      console.log('⚠️ Autenticación ya en progreso, ignorando nueva solicitud');
      return {
        success: false,
        error: 'Ya hay una autenticación en progreso. Por favor espera.',
      };
    }

    try {
      this.isAuthInProgress = true;
      console.log('🚀 Iniciando Google Sign-In con Expo WebBrowser...');

      // Cerrar cualquier sesión web abierta antes de empezar
      try {
        await WebBrowser.dismissBrowser();
      } catch (dismissError) {
        // Ignorar errores de dismiss, es normal si no hay nada que cerrar
        console.log('ℹ️ No hay browser previo que cerrar');
      }

      // Paso 1: Crear URL de autorización
      const { authUrl, state, nonce } = await this.createAuthUrl();

      // Paso 2: Abrir browser para autorización usando WebBrowser
      console.log('🌐 Abriendo browser para autorización...');
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.redirectUri,
        {
          // Opciones adicionales para mejorar la experiencia
          showTitle: false,
          showInRecents: false,
        }
      );

      console.log('📱 Resultado de WebBrowser:', result);

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Login cancelado por el usuario',
          cancelled: true,
        };
      }

      if (result.type === 'dismiss') {
        return {
          success: false,
          error: 'Login cancelado por el usuario',
          cancelled: true,
        };
      }

      if (result.type !== 'success') {
        return {
          success: false,
          error: 'Tipo de resultado inesperado: ' + result.type,
        };
      }

      // Paso 3: Extraer código de autorización
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        return {
          success: false,
          error: `Error de Google: ${error}`,
        };
      }

      if (!code) {
        return {
          success: false,
          error: 'No se recibió código de autorización',
        };
      }

      if (returnedState !== state) {
        return {
          success: false,
          error: 'Estado de seguridad no coincide',
        };
      }

      // Paso 4: Intercambiar código por tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Paso 5: Obtener información del usuario
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Paso 6: Preparar datos del usuario para el backend
      const userData = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      };

      console.log('✅ Google Sign-In completado exitosamente');

      return {
        success: true,
        userInfo: userData,
        tokens: tokens,
        userData: userData,
      };

    } catch (error) {
      console.error('❌ Error en Google Sign-In:', error);
      
      // Manejar errores específicos
      let errorMessage = error.message || 'Error desconocido en Google Sign-In';
      
      if (error.message && error.message.includes('Another web browser is already open')) {
        errorMessage = 'Ya hay un navegador abierto. Por favor ciérralo e intenta de nuevo.';
      } else if (error.message && error.message.includes('User cancelled')) {
        return {
          success: false,
          error: 'Login cancelado por el usuario',
          cancelled: true,
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Siempre limpiar el estado de progreso
      this.isAuthInProgress = false;
    }
  };

  // Método para limpiar estado manualmente
  clearAuthState = () => {
    this.isAuthInProgress = false;
    console.log('🧹 Estado de autenticación limpiado');
  };

  // Método de compatibilidad
  isSignedIn = async () => {
    // En este flujo, no mantenemos estado persistente
    return false;
  };

  signOut = async () => {
    // Limpiar estado y cerrar browser si está abierto
    this.isAuthInProgress = false;
    try {
      await WebBrowser.dismissBrowser();
    } catch (error) {
      // Ignorar errores
    }
    console.log('✅ Google Sign-Out simulado');
    return { success: true };
  };
}

// Exportar instancia singleton
const expoGoogleSignInService = new ExpoGoogleSignInService();
export default expoGoogleSignInService;