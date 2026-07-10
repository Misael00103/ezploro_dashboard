import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import simpleGoogleAuth from '../services/simpleGoogleAuth';

const GoogleSignInButton = ({ 
  onSuccess, 
  onError, 
  style, 
  textStyle, 
  disabled = false,
  showIcon = true,
  text = "Continuar con Google"
}) => {
  const [loading, setLoading] = useState(false);
  const { googleLogin } = useAuth();

  const handleGoogleSignIn = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);
      console.log('🚀 Iniciando proceso de Google Sign-In...');
      
      // Limpiar cualquier estado de autenticación previo
      simpleGoogleAuth.clearAuthState();

      // Paso 1: Autenticar con Google usando método simplificado
      const googleResult = await simpleGoogleAuth.signIn();
      
      if (!googleResult.success) {
        if (googleResult.cancelled) {
          console.log('ℹ️ Login con Google cancelado por el usuario');
          return; // No mostrar error si fue cancelado
        }
        
        throw new Error(googleResult.error);
      }

      const { userData } = googleResult;
      
      if (!userData) {
        throw new Error('No se pudo obtener la información del usuario de Google');
      }

      console.log('✅ Autenticación con Google exitosa, enviando al backend...');

      // Paso 2: Enviar id_token al backend (si está disponible) o usar access_token como fallback
      const tokenToSend = googleResult.idToken || googleResult.accessToken;
      console.log('🔑 Enviando token al backend:', { 
        hasIdToken: !!googleResult.idToken, 
        hasAccessToken: !!googleResult.accessToken,
        usingToken: tokenToSend ? 'disponible' : 'no disponible'
      });
      
      const authResult = await authService.googleAuth(tokenToSend);
      
      console.log('📦 Resultado del backend:', authResult);

      console.log('✅ Login completo exitoso');
      
      // Callback de éxito
      if (onSuccess) {
        onSuccess({
          user: authResult.user,
          token: authResult.token,
          isNewUser: authResult.isNewUser || false, // Determinar si es nuevo usuario
          googleUserInfo: userData,
        });
      }

    } catch (error) {
      console.error('❌ Error en Google Sign-In:', error);
      
      const errorMessage = error.message || 'Error desconocido al iniciar sesión con Google';
      
      // Callback de error
      if (onError) {
        onError(errorMessage);
      } else {
        // Mostrar alerta por defecto si no hay callback de error
        Alert.alert(
          'Error de autenticación',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, (disabled || loading) && styles.buttonDisabled]}
      onPress={handleGoogleSignIn}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#666" style={styles.icon} />
        ) : showIcon ? (
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
        ) : null}
        
        <Text style={[styles.buttonText, textStyle, (disabled || loading) && styles.buttonTextDisabled]}>
          {loading ? 'Iniciando sesión...' : text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#9aa0a6',
  },
});

export default GoogleSignInButton;