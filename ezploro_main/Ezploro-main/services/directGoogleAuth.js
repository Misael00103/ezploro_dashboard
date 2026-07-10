import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Configurar WebBrowser
WebBrowser.maybeCompleteAuthSession();

class DirectGoogleAuth {
  constructor() {
    this.clientId = '271449598855-c4dbde6k1btuq0m47fmf309fadg0ooea.apps.googleusercontent.com';
    this.isAuthInProgress = false;
  }

  // Método directo usando Linking
  signIn = async () => {
    if (this.isAuthInProgress) {
      return {
        success: false,
        error: 'Autenticación ya en progreso',
      };
    }

    try {
      this.isAuthInProgress = true;
      console.log('🚀 Iniciando Google Sign-In directo...');

      // Crear URL de autorización que redirige a una página que cierra automáticamente
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=https://developers.google.com/oauthplayground&` +
        `response_type=token&` +
        `scope=openid profile email&` +
        `prompt=select_account`;

      console.log('🌐 Abriendo URL:', authUrl);

      // Abrir browser
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        showTitle: false,
        showInRecents: false,
        enableBarCollapsing: false,
      });

      console.log('📱 Browser result:', result);

      // En este método, el usuario tendrá que copiar manualmente el token
      // Esto es una limitación, pero funciona en Expo Go
      return {
        success: false,
        error: 'Este método requiere configuración adicional. Usa el login con email por ahora.',
        needsManualSetup: true,
      };

    } catch (error) {
      console.error('❌ Error en Google Sign-In directo:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
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
    return { success: true };
  };
}

const directGoogleAuth = new DirectGoogleAuth();
export default directGoogleAuth;