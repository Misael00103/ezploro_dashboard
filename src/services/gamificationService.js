import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { 
  API_URL_GAMIFICATION,
  API_URL_GAMIFICATION_ACTION,
  API_URL_GAMIFICATION_POINTS,
  API_URL_GAMIFICATION_REDEEM,
  API_URL_GAMIFICATION_HISTORY
} from './config';

/**
 * Registrar una acción de gamificación para un usuario
 */
export const registerAction = async (actionData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(API_URL_GAMIFICATION_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: actionData.user_id,
        action_name: actionData.action_name,
        event_id: actionData.event_id || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en registerAction:', error);
    throw error;
  }
};

/**
 * Obtener puntos totales de un usuario
 */
export const getUserPoints = async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ getUserPoints - userId no proporcionado');
      return { total_points: 0, user_id: null };
    }
    
    // Asegurar que userId sea string para la URL
    const userIdStr = userId.toString();
    const url = API_URL_GAMIFICATION_POINTS.replace(':user_id', userIdStr);
    console.log('🔵 getUserPoints - URL:', url);
    console.log('🔵 getUserPoints - userId (original):', userId, 'Tipo:', typeof userId);
    console.log('🔵 getUserPoints - userId (string):', userIdStr);
    
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    console.log('🔵 getUserPoints - Respuesta completa del backend:', data);
    console.log('🔵 getUserPoints - Tipo de respuesta:', typeof data);
    console.log('🔵 getUserPoints - Es array?', Array.isArray(data));
    
    // El backend puede devolver diferentes formatos
    let totalPoints = 0;
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Buscar en diferentes propiedades posibles
      totalPoints = data.total_points 
        || data.points 
        || data.count 
        || data.totalPoints
        || data.points_total
        || 0;
      
      console.log('🔵 getUserPoints - Puntos extraídos del objeto:', totalPoints);
    } else if (typeof data === 'number') {
      totalPoints = data;
      console.log('🔵 getUserPoints - Respuesta es número directo:', totalPoints);
    } else if (Array.isArray(data) && data.length > 0) {
      // Si es array, tomar el primer elemento
      const firstItem = data[0];
      totalPoints = firstItem?.total_points || firstItem?.points || firstItem?.count || 0;
      console.log('🔵 getUserPoints - Respuesta es array, primer elemento:', firstItem);
    }
    
    const result = { 
      user_id: data?.user_id || userId, 
      total_points: parseInt(totalPoints) || 0 
    };
    
    console.log('🔵 getUserPoints - Resultado final:', result);
    return result;
  } catch (error) {
    console.error('🔴 Error en getUserPoints:', error);
    console.error('🔴 Error stack:', error.stack);
    // No lanzar error, devolver valores por defecto
    return { user_id: userId, total_points: 0 };
  }
};

/**
 * Canjear puntos por una recompensa
 */
export const redeemReward = async (redeemData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(API_URL_GAMIFICATION_REDEEM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: redeemData.user_id,
        reward_name: redeemData.reward_name,
        points_redeemed: redeemData.points_redeemed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en redeemReward:', error);
    throw error;
  }
};

/**
 * Obtener historial de acciones y canjes de un usuario
 */
export const getUserHistory = async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ getUserHistory - userId no proporcionado');
      return { actions: [], rewards: [] };
    }
    
    // Validar y convertir userId a string
    let userIdStr = userId.toString();
    
    // Validar que sea un número válido
    const userIdNum = parseInt(userIdStr, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      console.error('🔴 getUserHistory - ID de usuario inválido:', userId);
      console.error('🔴 getUserHistory - userId tipo:', typeof userId);
      // No lanzar error, devolver valores por defecto
      return { actions: [], rewards: [] };
    }
    
    userIdStr = userIdNum.toString();
    
    const url = API_URL_GAMIFICATION_HISTORY.replace(':user_id', userIdStr);
    console.log('🔵 getUserHistory - URL:', url);
    console.log('🔵 getUserHistory - userId (original):', userId, 'Tipo:', typeof userId);
    console.log('🔵 getUserHistory - userId (validado):', userIdStr);
    
    try {
      const data = await fetchWithAuth(url, {
        method: 'GET',
      });
      
      console.log('🔵 getUserHistory - Respuesta del backend:', data);
      
      // El backend devuelve { actions: [...], rewards: [...] }
      // Asegurar que siempre devolvamos un objeto con arrays
      return {
        actions: Array.isArray(data?.actions) ? data.actions : (data?.actions ? [data.actions] : []),
        rewards: Array.isArray(data?.rewards) ? data.rewards : (data?.rewards ? [data.rewards] : [])
      };
    } catch (fetchError) {
      // Capturar errores específicos del fetch
      console.warn('⚠️ getUserHistory - Error al consultar historial:', fetchError.message);
      
      // Si es un error 500, el backend tiene un problema
      if (fetchError.message && (
        fetchError.message.includes('500') ||
        fetchError.message.includes('Internal Server Error')
      )) {
        console.error('🔴 getUserHistory - Error 500 del servidor. El backend tiene un problema interno.');
        console.error('🔴 getUserHistory - Esto puede deberse a un error en el controlador o en la base de datos.');
        console.error('🔴 getUserHistory - Verifica los logs del servidor backend.');
      } else {
        console.warn('⚠️ getUserHistory - Esto puede ser normal si el usuario no tiene historial aún');
      }
      
      // Si el error es "Error al consultar historial" o similar, devolver valores por defecto
      if (fetchError.message && (
        fetchError.message.includes('Error al consultar historial') ||
        fetchError.message.includes('historial') ||
        fetchError.message.includes('404') ||
        fetchError.message.includes('No se encontró') ||
        fetchError.message.includes('500')
      )) {
        console.log('✅ getUserHistory - Devolviendo historial vacío');
        return { actions: [], rewards: [] };
      }
      
      // Para otros errores, también devolver valores por defecto
      return { actions: [], rewards: [] };
    }
  } catch (error) {
    console.error('🔴 Error en getUserHistory (error general):', error);
    console.error('🔴 Error stack:', error.stack);
    // No lanzar error, devolver valores por defecto
    return { actions: [], rewards: [] };
  }
};

