// services/userService.js - Servicio de usuarios actualizado para Dashboard
import {
  API_URL_USERS_ME,
  API_URL_USERS_UPDATE,
  API_URL_PASSWORD_CHANGE,
  API_URL_USERS_UPLOAD_IMAGE,
  API_URL_NOTIFICATIONS_PREFERENCES,
  API_URL_USERS_LIST,
  DASHBOARD_CONFIG
} from './config';
import { getAuthToken, getCurrentUserId } from './authService';
import { jwtDecode } from 'jwt-decode';

// Helper function to get userId (usando el servicio de auth)
const getUserId = () => {
  return getCurrentUserId();
};

// Export getCurrentUserId for backward compatibility
export { getCurrentUserId };

// Helper function to make authenticated fetch requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // Log para debugging
  console.log('🔵 fetchWithAuth - URL:', url);
  console.log('🔵 fetchWithAuth - Method:', options.method || 'GET');
  console.log('🔵 fetchWithAuth - Headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'Missing'
  });

  const response = await fetch(url, { ...options, headers });
  
  console.log('🔵 fetchWithAuth - Response status:', response.status);
  console.log('🔵 fetchWithAuth - Response ok:', response.ok);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    console.error('🔴 fetchWithAuth - Error response:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });
    console.error('🔴 fetchWithAuth - Error message:', errorData.error || errorData.message || errorData.details);
    
    if (response.status === 401) {
      // Sesión expirada, limpiar localStorage y redirigir
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.TOKEN_KEY);
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_KEY);
      localStorage.removeItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY);
      throw new Error('Sesión expirada: Por favor, inicia sesión nuevamente.');
    }
    
    if (response.status === 403) {
      throw new Error('Acceso denegado: No tienes permisos para realizar esta acción.');
    }
    
    throw new Error(errorData.error || errorData.message || errorData.details || `Error HTTP! status: ${response.status}`);
  }
  
  return response.json();
};

// Obtiene la configuración completa del usuario actual
export const getUserProfile = async () => {
  try {
    console.log('🔵 getUserProfile - Iniciando petición a:', API_URL_USERS_ME);
    
    const data = await fetchWithAuth(API_URL_USERS_ME, {
      method: 'GET',
    });
    
    console.log('🔵 getUserProfile - Response data structure:', {
      hasData: !!data.data,
      hasUser: !!data,
      dataKeys: Object.keys(data)
    });
    
    // El backend puede devolver los datos en data.data o directamente en data
    const userData = data.data || data;
    
    if (userData) {
      const userId = userData.user_id || userData.id || userData._id;
      if (userId) {
        const userIdNum = parseInt(userId, 10);
        if (!isNaN(userIdNum) && userIdNum > 0) {
          localStorage.setItem('userId', userIdNum.toString());
          localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, userIdNum.toString());
          
          // Asegurar que el objeto user tenga user_id como número
          const updatedUser = { ...userData, user_id: userIdNum };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
          
          console.log('✅ getUserProfile - User data guardado, userId:', userIdNum);
        }
      }
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Error en userService.getUserProfile:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Actualiza la configuración del usuario
export const updateUserProfile = async (userData) => {
  try {
    console.log('🔵 updateUserProfile - Iniciando actualización...');
    
    const userId = getUserId();
    console.log('🔵 updateUserProfile - userId obtenido:', userId);
    
    if (!userId) {
      console.error('❌ updateUserProfile - No se encontró userId');
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    
    // Convertir userId a número para asegurar consistencia
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      console.error('❌ updateUserProfile - userId no es un número válido:', userId);
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    
    const url = API_URL_USERS_UPDATE.replace(':userId', userIdNum.toString());
    console.log('🔵 updateUserProfile - URL:', url);
    console.log('🔵 updateUserProfile - Datos a enviar:', {
      ...userData,
      // Ocultar campos sensibles en el log
      password: userData.password ? '[HIDDEN]' : undefined
    });
    
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    console.log('🔵 updateUserProfile - Respuesta del servidor:', {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : []
    });

    // El backend puede devolver los datos en data.data o directamente en data
    const responseData = data.data || data;

    // Update localStorage with new user data usando configuración del dashboard
    const currentUser = JSON.parse(localStorage.getItem(DASHBOARD_CONFIG.AUTH.USER_KEY) || '{}');
    const updatedUser = { ...currentUser, ...responseData };
    
    localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
    localStorage.setItem('user', JSON.stringify(updatedUser)); // Fallback
    
    // Update user ID with fallbacks
    const newUserId = responseData.user_id || responseData.id || responseData._id;
    if (newUserId) {
      const newUserIdNum = parseInt(newUserId, 10);
      if (!isNaN(newUserIdNum) && newUserIdNum > 0) {
        localStorage.setItem(DASHBOARD_CONFIG.AUTH.USER_ID_KEY, newUserIdNum.toString());
        localStorage.setItem('userId', newUserIdNum.toString()); // Fallback
      }
    }

    console.log('✅ updateUserProfile - Perfil actualizado exitosamente');
    return responseData;
  } catch (error) {
    console.error('❌ Error en userService.updateUserProfile:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Sube una imagen de perfil
export const uploadProfilePicture = async (file) => {
  try {
    // Validar que el archivo existe y es válido
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }
    
    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new Error('El archivo proporcionado no es válido');
    }
    
    console.log('🔵 uploadProfilePicture - Iniciando subida de imagen');
    console.log('🔵 uploadProfilePicture - Nombre del archivo:', file.name);
    console.log('🔵 uploadProfilePicture - Tamaño:', file.size, 'bytes');
    console.log('🔵 uploadProfilePicture - Tipo:', file.type);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'profile');

    console.log('🔵 uploadProfilePicture - URL:', API_URL_USERS_UPLOAD_IMAGE);
    console.log('🔵 uploadProfilePicture - Token presente:', !!token);

    let response;
    try {
      response = await fetch(API_URL_USERS_UPLOAD_IMAGE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // NO incluir Content-Type para FormData, el navegador lo hace automáticamente
        },
        body: formData,
      });
    } catch (fetchError) {
      console.error('🔴 uploadProfilePicture - Error en fetch:', fetchError);
      console.error('🔴 uploadProfilePicture - Error name:', fetchError.name);
      console.error('🔴 uploadProfilePicture - Error message:', fetchError.message);
      
      // Errores de red
      if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
        throw new Error('Error de conexión al subir la imagen. Verifica tu conexión a internet y que el servidor esté disponible.');
      }
      
      // Errores de CORS
      if (fetchError.message.includes('CORS') || fetchError.message.includes('cross-origin')) {
        throw new Error('Error de CORS al subir la imagen. Verifica la configuración del servidor.');
      }
      
      throw new Error(`Error al conectar con el servidor: ${fetchError.message}`);
    }

    console.log('🔵 uploadProfilePicture - Response status:', response.status);
    console.log('🔵 uploadProfilePicture - Response ok:', response.ok);

    // Intentar parsear la respuesta como JSON
    let data;
    try {
      const responseText = await response.text();
      console.log('🔵 uploadProfilePicture - Response text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor no devolvió ninguna respuesta');
      }
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔴 uploadProfilePicture - Error parseando JSON:', parseError);
        console.error('🔴 uploadProfilePicture - Response text que no se pudo parsear:', responseText);
        throw new Error(`El servidor devolvió una respuesta inválida: ${responseText.substring(0, 100)}`);
      }
    } catch (textError) {
      console.error('🔴 uploadProfilePicture - Error leyendo respuesta:', textError);
      throw new Error(`Error al leer la respuesta del servidor: ${textError.message}`);
    }
    
    console.log('🔵 uploadProfilePicture - Response data:', data);
    
    if (!response.ok) {
      console.error('🔴 uploadProfilePicture - Error response:', data);
      const errorMessage = data.message || data.error || data.details || `Error HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // El backend puede devolver la URL en diferentes formatos
    // Intentar extraer la URL de diferentes propiedades posibles
    const imageUrl = data.url || data.data?.url || data.image_url || data.data?.image_url || data.profile_picture || data.banner_image || data;
    
    if (!imageUrl) {
      console.error('🔴 uploadProfilePicture - No se encontró URL en la respuesta:', data);
      throw new Error('El servidor no devolvió la URL de la imagen');
    }
    
    console.log('✅ uploadProfilePicture - URL extraída:', imageUrl);
    
    // Si es un objeto completo, intentar extraer la propiedad correcta o devolver el valor apropiado
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      if (imageUrl.profile_picture) {
        return imageUrl.profile_picture;
      }
      if (imageUrl.banner_image) {
        return imageUrl.banner_image;
      }
      console.warn('⚠️ uploadProfilePicture - La respuesta es un objeto, devolviendo completo:', imageUrl);
      return imageUrl;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('🔴 Error en userService.uploadProfilePicture:', error);
    console.error('🔴 Error stack:', error.stack);
    
    // Re-lanzar el error con un mensaje más claro
    if (error.message) {
      throw error;
    } else {
      throw new Error(`Error al subir la imagen: ${error.toString()}`);
    }
  }
};

// Cambia la contraseña del usuario
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    console.log('🔵 Cambiando contraseña en:', API_URL_PASSWORD_CHANGE);

    const response = await fetch(API_URL_PASSWORD_CHANGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error al cambiar contraseña:', errorData);
      throw new Error(errorData.error || errorData.message || `Error al cambiar contraseña: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Contraseña cambiada exitosamente');
    return data;
  } catch (error) {
    console.error('🔴 Error en changePassword:', error);
    throw error;
  }
};

// Actualiza la configuración de seguridad del usuario
export const updateSecuritySettings = async (securitySettings) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    const url = `${API_URL_USERS_UPDATE.replace(':userId', userId)}/security`;
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(securitySettings),
    });
    return data;
  } catch (error) {
    console.error('Error en updateSecuritySettings:', error);
    throw error;
  }
};

// Actualiza la configuración de notificaciones del usuario
export const updateNotificationSettings = async (notificationSettings) => {
  try {
    const data = await fetchWithAuth(API_URL_NOTIFICATIONS_PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(notificationSettings),
    });
    return data;
  } catch (error) {
    console.error('Error en updateNotificationSettings:', error);
    throw error;
  }
};

// Actualiza las preferencias del dashboard del usuario
export const updateDashboardPreferences = async (preferences) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID de usuario inválido. Por favor, inicia sesión nuevamente.');
    }
    const url = `${API_URL_USERS_UPDATE.replace(':userId', userId)}/preferences`;
    const data = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return data;
  } catch (error) {
    console.error('Error en updateDashboardPreferences:', error);
    throw error;
  }
};

// Obtiene la lista de todos los usuarios
export const getAllUsers = async () => {
  try {
    const response = await fetchWithAuth(API_URL_USERS_LIST);
    let uList = [];
    if (Array.isArray(response)) {
      uList = response;
    } else if (response && Array.isArray(response.data)) {
      uList = response.data;
    } else if (response && Array.isArray(response.users)) {
      uList = response.users;
    }
    return uList;
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    throw error;
  }
};