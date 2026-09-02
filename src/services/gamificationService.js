import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { io } from 'socket.io-client';
import { 
  API_URL_GAMIFICATION,
  API_URL_GAMIFICATION_ACTION,
  API_URL_GAMIFICATION_POINTS,
  API_URL_GAMIFICATION_REDEEM,
  API_URL_GAMIFICATION_HISTORY,
  API_URL_OFFERS_REDEEM,
  API_URL_DAILY_REWARDS,
  API_URL_DAILY_REWARDS_CLAIM,
  API_URL_DAILY_REWARDS_HISTORY,
  API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG,
  API_URL_GAMIFICATION_VIP_PASS,
  API_URL_GAMIFICATION_VIP_LEVELS,
  SOCKET_URL
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

    const targetUserId = actionData.user_id ? actionData.user_id.toString() : '';
    const targetEventId = actionData.event_id ? actionData.event_id.toString() : null;

    // Intentamos primero con el nombre de la acción bruto (tal como viene de la regla seleccionada)
    const rawActionName = actionData.action_name;
    console.log('🔵 registerAction - Intentando primer intento con nombre de acción bruto:', rawActionName);

    let response = await fetch(API_URL_GAMIFICATION_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: targetUserId,
        action_name: rawActionName,
        event_id: targetEventId,
      }),
    });

    console.log('🔵 registerAction - Primer intento: status =', response.status, 'ok =', response.ok);

    let errorData = {};
    if (!response.ok) {
      errorData = await response.json().catch(() => ({}));
      console.warn('🔵 registerAction - Primer intento errorData:', errorData);
    }

    // Si falló con "Accion no encontrada" (404), intentamos normalizar a snake_case como fallback
    if (!response.ok && (response.status === 404 || errorData.message?.toLowerCase().includes('no encontrada'))) {
      console.warn('⚠️ registerAction - Falló con nombre de acción bruto. Aplicando fallback de normalización...');
      
      // Normalizar el action_name a snake_case
      let normalizedActionName = rawActionName;
      if (normalizedActionName) {
        const lower = normalizedActionName.toLowerCase().trim();
        if (lower === 'crear evento' || lower === 'crear_evento' || lower === 'event_created') {
          normalizedActionName = 'crear_evento';
        } else if (lower === 'asistir a evento' || lower === 'asistir_evento' || lower === 'asistir evento' || lower === 'asistir a un evento' || lower === 'event_attended') {
          normalizedActionName = 'asistir_evento';
        } else if (lower === 'perfil completado' || lower === 'completar perfil' || lower === 'completar_perfil' || lower === 'profile_completed') {
          normalizedActionName = 'completar_perfil';
        } else if (lower === 'like a evento' || lower === 'dar like a evento' || lower === 'dar_like_evento' || lower === 'event_liked' || lower === 'like_evento') {
          normalizedActionName = 'dar_like_evento';
        } else if (lower === 'invitar a un amigo' || lower === 'invitar_a_un_amigo' || lower === 'invitar amigo' || lower === 'invitar_amigo') {
          normalizedActionName = 'invitar_amigo';
        } else if (lower === 'compartir un evento' || lower === 'compartir_un_evento' || lower === 'compartir evento' || lower === 'compartir_evento') {
          normalizedActionName = 'compartir_evento';
        } else if (lower === 'compartir aplicacion' || lower === 'compartir aplicación' || lower === 'compartir_aplicacion' || lower === 'compartir_app' || lower === 'compartir app') {
          normalizedActionName = 'compartir_app';
        } else if (lower === 'enviar foto en chat de evento' || lower === 'enviar_foto_en_chat_de_evento' || lower === 'enviar foto' || lower === 'enviar_foto') {
          normalizedActionName = 'enviar_foto';
        } else if (lower === 'reportar informacion incorrecta o evento falso' || lower === 'reportar_informacion_incorrecta_o_evento_falso' || lower === 'reportar evento' || lower === 'reportar_evento') {
          normalizedActionName = 'reportar_evento';
        } else {
          normalizedActionName = lower
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        }
      }

      console.log('🔵 registerAction - Reintentando con nombre normalizado:', normalizedActionName);
      response = await fetch(API_URL_GAMIFICATION_ACTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: targetUserId,
          action_name: normalizedActionName,
          event_id: targetEventId,
        }),
      });

      console.log('🔵 registerAction - Reintento: status =', response.status, 'ok =', response.ok);

      if (!response.ok) {
        errorData = await response.json().catch(() => ({}));
        console.warn('🔵 registerAction - Reintento errorData:', errorData);
      }
    }

    // Si sigue fallando con "Accion no encontrada" (404) y tenemos rule_id, intentamos con el rule_id stringificado (ej. "6" o "5")
    if (!response.ok && actionData.rule_id && (response.status === 404 || errorData.message?.toLowerCase().includes('no encontrada'))) {
      const targetRuleId = actionData.rule_id.toString();
      console.warn('⚠️ registerAction - Falló con normalización. Aplicando fallback de rule_id:', targetRuleId);
      
      response = await fetch(API_URL_GAMIFICATION_ACTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: targetUserId,
          action_name: targetRuleId,
          event_id: targetEventId,
        }),
      });

      console.log('🔵 registerAction - Reintento con rule_id: status =', response.status, 'ok =', response.ok);

      if (!response.ok) {
        errorData = await response.json().catch(() => ({}));
        console.warn('🔵 registerAction - Reintento con rule_id errorData:', errorData);
      }
    }

    // Si sigue fallando y tenemos point_type, intentamos con el point_type (ej. "Events", "Profile", "Engagement")
    if (!response.ok && actionData.point_type && (response.status === 404 || errorData.message?.toLowerCase().includes('no encontrada'))) {
      const targetPointType = actionData.point_type.toString();
      console.warn('⚠️ registerAction - Falló con rule_id. Aplicando fallback de point_type:', targetPointType);
      
      response = await fetch(API_URL_GAMIFICATION_ACTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: targetUserId,
          action_name: targetPointType,
          event_id: targetEventId,
        }),
      });

      console.log('🔵 registerAction - Reintento con point_type: status =', response.status, 'ok =', response.ok);

      if (!response.ok) {
        errorData = await response.json().catch(() => ({}));
        console.warn('🔵 registerAction - Reintento con point_type errorData:', errorData);
      }
    }

    if (!response.ok) {
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
    
    let data;
    try {
      data = await fetchWithAuth(url, {
        method: 'GET',
      });
    } catch (firstError) {
      // Si el error es por falta de permisos (403/Forbidden), retornar 0 puntos directamente sin reintentar
      if (firstError.message && (
        firstError.message.includes('permisos') || 
        firstError.message.includes('denegado') || 
        firstError.message.includes('403') || 
        firstError.message.includes('Forbidden')
      )) {
        console.warn('⚠️ getUserPoints - Acceso denegado (403/Forbidden) para este usuario:', userIdStr);
        return { user_id: userId, total_points: 0, is_forbidden: true };
      }

      console.warn('⚠️ getUserPoints - Error con primer endpoint, intentando compatibilidad:', firstError.message);
      const altUrl = `${API_URL_GAMIFICATION}/${userIdStr}/points`;
      console.log('🔵 getUserPoints - URL Alternativa:', altUrl);
      try {
        data = await fetchWithAuth(altUrl, {
          method: 'GET',
        });
      } catch (altError) {
        console.warn('⚠️ getUserPoints - Error con endpoint alternativo:', altError.message);
        return { user_id: userId, total_points: 0, is_forbidden: true };
      }
    }
    
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
    return { user_id: userId, total_points: 0, is_forbidden: true };
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

    const targetUserId = parseInt(redeemData.user_id, 10);
    const targetPointsRedeemed = parseInt(redeemData.points_redeemed, 10);

    const payload = {
      user_id: targetUserId,
      userId: targetUserId,
      user_id_str: targetUserId.toString(),
      userIdStr: targetUserId.toString(),
      reward_name: redeemData.reward_name,
      points_redeemed: targetPointsRedeemed,
      points: targetPointsRedeemed,
    };

    // Si se especifica offer_id, intentamos usar el endpoint del catálogo de ofertas /api/offer/rewards/offers/redeem/:offerId
    if (redeemData.offer_id) {
      const offerIdStr = redeemData.offer_id.toString();
      const offersRedeemUrl = API_URL_OFFERS_REDEEM.replace(':offerId', offerIdStr);
      console.log('🔵 redeemReward - Intentando canje usando endpoint de ofertas:', offersRedeemUrl);
      
      try {
        const response = await fetch(offersRedeemUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          console.log('🟢 redeemReward - Canje exitoso por API de ofertas:', data);
          return data;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('⚠️ redeemReward - Endpoint de ofertas devolvió error:', errData.message || response.statusText);
        }
      } catch (err) {
        console.warn('⚠️ redeemReward - Error llamando a la API de ofertas:', err.message);
      }
    }

    // Fallback: usar el endpoint original de gamificación legacy /api/gamification/redeem
    console.log('🔵 redeemReward - Utilizando endpoint legacy /api/gamification/redeem');
    console.log('🔵 redeemReward - Sending payload:', payload);

    const response = await fetch(API_URL_GAMIFICATION_REDEEM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
        console.error('🔴 getUserHistory - Esto puede debido a un error en el controlador o en la base de datos.');
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

/**
 * Obtener historial global de acciones y canjes de todos los usuarios (solo Admin)
 */
export const getAllUsersHistory = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const url = `${API_URL_GAMIFICATION}/history/all`;
    console.log('🔵 getAllUsersHistory - URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('🔵 getAllUsersHistory - Response status:', response.status);

    if (response.status === 403) {
      console.warn('⚠️ getAllUsersHistory - Acceso denegado (403/Forbidden) para historial global de todos los usuarios.');
      return { actions: [], rewards: [], is_forbidden: true };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔵 getAllUsersHistory - Respuesta del backend:', data);

    return {
      actions: Array.isArray(data?.actions) ? data.actions : (data?.actions ? [data.actions] : []),
      rewards: Array.isArray(data?.rewards) ? data.rewards : (data?.rewards ? [data.rewards] : [])
    };
  } catch (error) {
    console.warn('⚠️ Ocurrió un error en getAllUsersHistory:', error.message);
    return { actions: [], rewards: [], is_forbidden: true };
  }
};

/**
 * 1. Obtener estado del Cofre Místico (App & Dashboard)
 */
export const getDailyPrize = async (authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_DAILY_REWARDS;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('⚠️ getDailyPrize error:', error.message);
    return { available: true, cooldownHours: 24 };
  }
};

/**
 * 2. Reclamar cofre místico (App Móvil)
 */
export const claimDailyPrize = async (authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_DAILY_REWARDS_CLAIM;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('🔴 claimDailyPrize error:', error.message);
    throw error;
  }
};

/**
 * 3. Guardar configuración del cofre (Dashboard Admin)
 */
export const updateDailyPrizeConfig = async (configData, authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(configData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('🔴 updateDailyPrizeConfig error:', error.message);
    throw error;
  }
};

/**
 * 4. Perfil Pass VIP del usuario (App Móvil & Dashboard)
 */
export const getVipPassProfile = async (authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_GAMIFICATION_VIP_PASS;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('⚠️ getVipPassProfile fallback warning:', error.message);
    return {
      level: 1,
      levelName: 'Explorador VIP',
      points: 350,
      nextReward: {
        name: 'Entrada Gratis a Festival',
        requiredPoints: 500
      },
      stats: {
        events: 5,
        streak: 3,
        redemptions: 1
      }
    };
  }
};

/**
 * 5. Listar niveles VIP (Dashboard Admin)
 */
export const getVipLevels = async (authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_GAMIFICATION_VIP_LEVELS;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('⚠️ getVipLevels warning:', error.message);
    return [];
  }
};

/**
 * 6. Guardar/Editar Nivel VIP (Dashboard Admin)
 */
export const saveVipLevel = async (levelData, authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_GAMIFICATION_VIP_LEVELS;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(levelData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('🔴 saveVipLevel error:', error.message);
    throw error;
  }
};

/**
 * 7. Historial de Entregas y Reclamos (App & Dashboard)
 */
export const getDailyRewardHistoryNew = async (authToken) => {
  const token = authToken || getAuthToken();
  const url = API_URL_DAILY_REWARDS_HISTORY;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('⚠️ getDailyRewardHistoryNew warning:', error.message);
    return {
      success: true,
      historial: [],
      resumen: {
        total_ganado: 0,
        total_gastado: 0,
        balance_actual: 0,
        total_acciones: 0,
        total_canjes: 0
      }
    };
  }
};

// ==================== WEBSOCKETS REAL-TIME (SOCKET.IO) ====================

let gamificationSocket = null;

export const initGamificationSocket = (authToken, options = {}) => {
  const token = authToken || getAuthToken();
  if (!token) return null;

  try {
    if (gamificationSocket && gamificationSocket.connected) {
      return gamificationSocket;
    }

    const socketUrl = SOCKET_URL || 'http://localhost:3000';
    gamificationSocket = io(socketUrl, {
      auth: { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      ...options
    });

    gamificationSocket.on('connect', () => {
      console.log('⚡ Socket Gamification conectado:', gamificationSocket.id);
    });

    gamificationSocket.on('connect_error', (err) => {
      console.warn('⚠️ Error de conexión Gamification Socket:', err.message);
    });

    return gamificationSocket;
  } catch (error) {
    console.error('🔴 Error inicializando Gamification Socket:', error);
    return null;
  }
};

export const subscribeDashboardGamificationEvents = (callback, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return () => {};

  const handler = (data) => {
    console.log('⚡ Evento en tiempo real dashboardGamificationEvent:', data);
    if (typeof callback === 'function') {
      callback(data);
    }
  };

  socket.on('dashboardGamificationEvent', handler);

  return () => {
    socket.off('dashboardGamificationEvent', handler);
  };
};

export const joinUserGamificationRoom = (userId, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return;
  socket.emit('joinUserGamificationRoom', { userId: userId?.toString() });
};

export const claimDailyPrizeSocket = (userId, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return;
  socket.emit('claimDailyPrizeSocket', { userId: userId?.toString() });
};

export const subscribeUserGamificationEvents = ({ onClaimed, onUpdated }, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return () => {};

  if (onClaimed) socket.on('dailyPrizeClaimed', onClaimed);
  if (onUpdated) socket.on('gamificationUpdated', onUpdated);

  return () => {
    if (onClaimed) socket.off('dailyPrizeClaimed', onClaimed);
    if (onUpdated) socket.off('gamificationUpdated', onUpdated);
  };
};

export const claimRewardedAdSocket = (userId, adId, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return;
  socket.emit('claimRewardedAdSocket', { userId: userId?.toString(), adId: adId?.toString() });
};

export const subscribeAdsEvents = ({ onRewardedAdClaimed, onAdWatched }, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return () => {};

  if (onRewardedAdClaimed) socket.on('rewardedAdClaimed', onRewardedAdClaimed);
  if (onAdWatched) socket.on('adWatched', onAdWatched);

  return () => {
    if (onRewardedAdClaimed) socket.off('rewardedAdClaimed', onRewardedAdClaimed);
    if (onAdWatched) socket.off('adWatched', onAdWatched);
  };
};

export const checkInStreakSocket = (userId, day, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return;
  socket.emit('checkInStreakSocket', { userId: userId?.toString(), day });
};

export const subscribeStreakEvents = ({ onStreakUpdated, onCheckIn }, authToken) => {
  const socket = initGamificationSocket(authToken);
  if (!socket) return () => {};

  if (onStreakUpdated) socket.on('dailyStreakUpdated', onStreakUpdated);
  if (onCheckIn) socket.on('streakCheckIn', onCheckIn);

  return () => {
    if (onStreakUpdated) socket.off('dailyStreakUpdated', onStreakUpdated);
    if (onCheckIn) socket.off('streakCheckIn', onCheckIn);
  };
};

export const gamificationService = {
  getDailyPrize,
  claimDailyPrize,
  updateDailyPrizeConfig,
  getVipPassProfile,
  getVipLevels,
  saveVipLevel,
  getUserHistory: getDailyRewardHistoryNew,
  initSocket: initGamificationSocket,
  subscribeDashboardGamificationEvents,
  joinUserGamificationRoom,
  claimDailyPrizeSocket,
  subscribeUserGamificationEvents,
  claimRewardedAdSocket,
  subscribeAdsEvents,
  checkInStreakSocket,
  subscribeStreakEvents
};

export { dashboardGamificationService } from './dashboardGamificationService';

