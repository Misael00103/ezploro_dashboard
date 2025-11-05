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
    const url = API_URL_GAMIFICATION_POINTS.replace(':user_id', userId);
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    // El backend devuelve { user_id: number, total_points: number }
    return data;
  } catch (error) {
    console.error('Error en getUserPoints:', error);
    throw error;
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
    const url = API_URL_GAMIFICATION_HISTORY.replace(':user_id', userId);
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    // El backend devuelve { actions: [...], rewards: [...] }
    return data;
  } catch (error) {
    console.error('Error en getUserHistory:', error);
    throw error;
  }
};

