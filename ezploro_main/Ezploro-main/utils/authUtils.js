// utils/authUtils.js
import { Alert } from 'react-native';
import { authService } from '../services';

export const handleAuthError = (error, navigation) => {
  console.log('🔑 Handling auth error:', error.message);
  
  if (error.message.includes('sesión ha expirado') || 
      error.message.includes('Token inválido') ||
      error.message.includes('No hay sesión activa')) {
    
    Alert.alert(
      'Sesión Expirada',
      'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      [
        {
          text: 'OK',
          onPress: async () => {
            // Limpiar datos de sesión
            await authService.logout();
            
            // Navegar al login
            if (navigation) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
    
    return true; // Indica que se manejó el error de auth
  }
  
  return false; // No es un error de auth
};

export const checkAuthBeforeAction = async (action, navigation) => {
  try {
    const isLoggedIn = await authService.isLoggedIn();
    if (!isLoggedIn) {
      Alert.alert(
        'Iniciar Sesión',
        'Debes iniciar sesión para realizar esta acción.',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Iniciar Sesión',
            onPress: () => {
              if (navigation) {
                navigation.navigate('Login');
              }
            }
          }
        ]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    return false;
  }
};