import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { 
  API_URL_POINTS,
  API_URL_POINTS_ACTIONS,
  API_URL_POINTS_CLAIM,
  API_URL_POINTS_TRANSACTIONS
} from './config';

/**
 * Obtener acciones reclamables de un usuario
 */
export const getClaimableActions = async (userId) => {
  // El backend no contiene rutas en /api/points/actions, por lo que retornamos un array vacío directamente para evitar errores 403/Forbidden en la consola
  return [];
};

/**
 * Reclamar puntos para una acción específica
 */
export const claimPoints = async (userId, actionId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const url = API_URL_POINTS_CLAIM.replace(':userId', userId).replace(':actionId', actionId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en claimPoints:', error);
    throw error;
  }
};

/**
 * Obtener transacciones reclamadas de un usuario
 */
export const getClaimedTransactions = async (userId) => {
  try {
    const url = API_URL_POINTS_TRANSACTIONS.replace(':userId', userId);
    const data = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    // El backend devuelve { total: number, total_points_earned: number, transactions: [...] }
    return data;
  } catch (error) {
    console.error('Error en getClaimedTransactions:', error);
    throw error;
  }
};

