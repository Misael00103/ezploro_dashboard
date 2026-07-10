// Importación condicional para evitar errores en desarrollo
let GoogleSignin;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.warn('⚠️ Google Sign-In no disponible en este entorno:', error.message);
  GoogleSignin = null;
}

class GoogleSignInService {
  constructor() {
    this.isConfigured = false;
  }

  // Configurar Google Sign-In
  configure() {
    if (this.isConfigured || !GoogleSignin) return;

    try {
      GoogleSignin.configure({
        webClientId: '271449598855-qed1fg29jd6s1n6glt0ogghk9en6foj8.apps.googleusercontent.com', // Tu Web Client ID actualizado
        offlineAccess: true, // Para obtener refresh token
        hostedDomain: '', // Opcional: restringir a un dominio específico
        forceCodeForRefreshToken: true, // Para obtener refresh token en Android
        accountName: '', // Opcional: especificar cuenta
        iosClientId: '271449598855-qed1fg29jd6s1n6glt0ogghk9en6foj8.apps.googleusercontent.com', // Tu iOS Client ID actualizado
        googleServicePlistPath: '', // Opcional: ruta al GoogleService-Info.plist
        openIdSupport: false, // Opcional: soporte para OpenID
        profileImageSize: 120, // Opcional: tamaño de imagen de perfil
      });
      
      this.isConfigured = true;
      console.log('✅ Google Sign-In configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando Google Sign-In:', error);
      throw error;
    }
  }

  // Verificar si Google Play Services están disponibles
  async hasPlayServices() {
    if (!GoogleSignin) {
      console.warn('⚠️ Google Sign-In no disponible');
      return false;
    }
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      return true;
    } catch (error) {
      console.error('❌ Google Play Services no disponibles:', error);
      return false;
    }
  }

  // Iniciar sesión con Google
  async signIn() {
    if (!GoogleSignin) {
      return {
        success: false,
        error: 'Google Sign-In no está disponible en este entorno. Necesitas compilar la app nativa.',
      };
    }

    try {
      // Configurar si no está configurado
      if (!this.isConfigured) {
        this.configure();
      }

      // Verificar Google Play Services
      const hasServices = await this.hasPlayServices();
      if (!hasServices) {
        throw new Error('Google Play Services no están disponibles');
      }

      // Verificar si ya hay un usuario logueado
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        console.log('👤 Usuario ya logueado, obteniendo información...');
        const userInfo = await GoogleSignin.getCurrentUser();
        return {
          success: true,
          userInfo,
          idToken: userInfo.idToken,
        };
      }

      // Iniciar proceso de login
      console.log('🔐 Iniciando Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      
      console.log('✅ Google Sign-In exitoso:', {
        email: userInfo.user.email,
        name: userInfo.user.name,
        hasIdToken: !!userInfo.idToken,
      });

      return {
        success: true,
        userInfo,
        idToken: userInfo.idToken,
      };
    } catch (error) {
      console.error('❌ Error en Google Sign-In:', error);
      
      // Manejar errores específicos
      if (error.code === 'SIGN_IN_CANCELLED') {
        return {
          success: false,
          error: 'Login cancelado por el usuario',
          cancelled: true,
        };
      } else if (error.code === 'IN_PROGRESS') {
        return {
          success: false,
          error: 'Login ya en progreso',
        };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services no disponibles',
        };
      }

      return {
        success: false,
        error: error.message || 'Error desconocido en Google Sign-In',
      };
    }
  }

  // Cerrar sesión de Google
  async signOut() {
    if (!GoogleSignin) {
      console.log('✅ Google Sign-Out simulado (no disponible)');
      return { success: true };
    }

    try {
      await GoogleSignin.signOut();
      console.log('✅ Google Sign-Out exitoso');
      return { success: true };
    } catch (error) {
      console.error('❌ Error en Google Sign-Out:', error);
      return {
        success: false,
        error: error.message || 'Error al cerrar sesión de Google',
      };
    }
  }

  // Revocar acceso (desconectar completamente)
  async revokeAccess() {
    if (!GoogleSignin) {
      console.log('✅ Google Access revocado simulado (no disponible)');
      return { success: true };
    }

    try {
      await GoogleSignin.revokeAccess();
      console.log('✅ Google Access revocado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error revocando acceso de Google:', error);
      return {
        success: false,
        error: error.message || 'Error al revocar acceso de Google',
      };
    }
  }

  // Obtener usuario actual (si está logueado)
  async getCurrentUser() {
    if (!GoogleSignin) {
      return { success: false, error: 'Google Sign-In no disponible' };
    }

    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return { success: false, error: 'No hay usuario logueado' };
      }

      const userInfo = await GoogleSignin.getCurrentUser();
      return {
        success: true,
        userInfo,
        idToken: userInfo.idToken,
      };
    } catch (error) {
      console.error('❌ Error obteniendo usuario actual de Google:', error);
      return {
        success: false,
        error: error.message || 'Error obteniendo usuario de Google',
      };
    }
  }

  // Verificar si el usuario está logueado
  async isSignedIn() {
    if (!GoogleSignin) {
      return false;
    }

    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('❌ Error verificando estado de Google Sign-In:', error);
      return false;
    }
  }

  // Obtener tokens (para uso avanzado)
  async getTokens() {
    if (!GoogleSignin) {
      return {
        success: false,
        error: 'Google Sign-In no disponible',
      };
    }

    try {
      const tokens = await GoogleSignin.getTokens();
      return {
        success: true,
        tokens,
      };
    } catch (error) {
      console.error('❌ Error obteniendo tokens de Google:', error);
      return {
        success: false,
        error: error.message || 'Error obteniendo tokens',
      };
    }
  }
}

// Exportar instancia singleton
const googleSignInService = new GoogleSignInService();
export default googleSignInService;