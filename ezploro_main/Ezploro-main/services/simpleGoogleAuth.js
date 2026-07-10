import * as WebBrowser from 'expo-web-browser';

// Configurar WebBrowser
WebBrowser.maybeCompleteAuthSession();

class SimpleGoogleAuth {
  constructor() {
    this.clientId = '271449598855-qed1fg29jd6s1n6glt0ogghk9en6foj8.apps.googleusercontent.com';
    // Usar el redirect URI que funciona con Expo Go
    this.redirectUri = 'https://auth.expo.io/@anonymous/eventos-app';
    this.isAuthInProgress = false;
    
    console.log('🔧 SimpleGoogleAuth configurado:', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
    });
  }

  // Crear URL de autorización simplificada
  createAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'token id_token', // Solicitar tanto access_token como id_token
      scope: 'openid profile email',
      prompt: 'select_account',
      nonce: Date.now().toString(), // Requerido para id_token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Obtener información del usuario con access token
  getUserInfo = async (accessToken) => {
    try {
      console.log('👤 Obteniendo información del usuario...');
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo info del usuario: ${response.status}`);
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

  // Proceso de sign-in simplificado
  signIn = async () => {
    if (this.isAuthInProgress) {
      return {
        success: false,
        error: 'Autenticación ya en progreso',
      };
    }

    try {
      this.isAuthInProgress = true;
      console.log('🚀 Iniciando Google Sign-In simplificado...');

      // Cerrar cualquier browser abierto
      try {
        await WebBrowser.dismissBrowser();
      } catch (e) {
        // Ignorar
      }

      const authUrl = this.createAuthUrl();
      console.log('🌐 Abriendo browser:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.redirectUri,
        {
          showTitle: false,
          showInRecents: false,
        }
      );

      console.log('📱 Resultado:', result);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return {
          success: false,
          error: 'Login cancelado por el usuario',
          cancelled: true,
        };
      }

      if (result.type !== 'success') {
        return {
          success: false,
          error: `Resultado inesperado: ${result.type}`,
        };
      }

      // Extraer tokens de la URL
      const url = new URL(result.url);
      const fragment = url.hash.substring(1); // Quitar el #
      const params = new URLSearchParams(fragment);
      
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token'); // También obtener id_token
      const error = params.get('error');

      if (error) {
        return {
          success: false,
          error: `Error de Google: ${error}`,
        };
      }

      if (!accessToken) {
        return {
          success: false,
          error: 'No se recibió access token',
        };
      }

      console.log('🔑 Tokens obtenidos:', { 
        hasAccessToken: !!accessToken, 
        hasIdToken: !!idToken 
      });

      // Obtener información del usuario
      const userInfo = await this.getUserInfo(accessToken);

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
        userData: userData,
        accessToken: accessToken,
        idToken: idToken, // Incluir id_token si está disponible
      };

    } catch (error) {
      console.error('❌ Error en Google Sign-In:', error);
      
      let errorMessage = error.message || 'Error desconocido';
      
      if (errorMessage.includes('Another web browser is already open')) {
        errorMessage = 'Ya hay un navegador abierto. Ciérralo e intenta de nuevo.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.isAuthInProgress = false;
    }
  };

  clearAuthState = () => {
    this.isAuthInProgress = false;
  };

  signOut = async () => {
    this.isAuthInProgress = false;
    try {
      await WebBrowser.dismissBrowser();
    } catch (e) {
      // Ignorar
    }
    return { success: true };
  };
}

const simpleGoogleAuth = new SimpleGoogleAuth();
export default simpleGoogleAuth;