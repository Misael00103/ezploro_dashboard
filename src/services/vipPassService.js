import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { 
  API_URL_VIP_PASS_LEVELS, 
  API_URL_VIP_PASS_CONFIG,
  API_URL_GAMIFICATION_VIP_LEVELS,
  API_URL_GAMIFICATION_VIP_PASS,
  BASE_URL
} from './config';

const STORAGE_KEY_VIP_PASS = 'ezploro_vip_pass_config';

const DEFAULT_VIP_LEVELS = [
  {
    level: 1,
    levelName: 'Novato Ezploro',
    minPoints: 0,
    requiredPointsForNext: 500,
    nextRewardName: 'Descuento 10% en Entradas',
    color: '#94a3b8', // slate-400
    badgeIcon: '🔰',
    is_active: true
  },
  {
    level: 2,
    levelName: 'Explorador',
    minPoints: 500,
    requiredPointsForNext: 1200,
    nextRewardName: 'Mojito Gratis en Bar Afiliado',
    color: '#3b82f6', // blue-500
    badgeIcon: '🚀',
    is_active: true
  },
  {
    level: 3,
    levelName: 'Explorador VIP',
    minPoints: 1200,
    requiredPointsForNext: 2000,
    nextRewardName: 'Entrada Gratis a Festival',
    color: '#8b5cf6', // violet-500
    badgeIcon: '👑',
    is_active: true
  },
  {
    level: 4,
    levelName: 'Leyenda Ezploro',
    minPoints: 2000,
    requiredPointsForNext: 5000,
    nextRewardName: 'Acceso VIP Backstage Anual',
    color: '#f59e0b', // amber-500
    badgeIcon: '🔥',
    is_active: true
  }
];

export const getStoredVipConfig = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_VIP_PASS);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error('Error loading stored VIP Pass config:', e);
  }
  localStorage.setItem(STORAGE_KEY_VIP_PASS, JSON.stringify(DEFAULT_VIP_LEVELS));
  return DEFAULT_VIP_LEVELS;
};

export const saveVipConfig = (levels) => {
  try {
    localStorage.setItem(STORAGE_KEY_VIP_PASS, JSON.stringify(levels));
  } catch (e) {
    console.error('Error saving VIP Pass config:', e);
  }
};

const silentFetch = async (url) => {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).catch(() => null);
    if (res && res.ok) {
      return await res.json().catch(() => null);
    }
  } catch (e) {}
  return null;
};

/**
 * Obtener todos los niveles de Pass VIP configurados
 */
export const getVipPassLevels = async () => {
  const stored = getStoredVipConfig();
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar /api/gamification/vip-levels
      const levelsRes = await silentFetch(API_URL_GAMIFICATION_VIP_LEVELS);
      if (levelsRes && Array.isArray(levelsRes) && levelsRes.length > 0) {
        saveVipConfig(levelsRes);
        return levelsRes;
      }
      if (levelsRes && levelsRes.data && Array.isArray(levelsRes.data) && levelsRes.data.length > 0) {
        saveVipConfig(levelsRes.data);
        return levelsRes.data;
      }

      // 2. Intentar /api/gamification/vip-pass
      const profileRes = await silentFetch(API_URL_GAMIFICATION_VIP_PASS);
      if (profileRes && (profileRes.level || profileRes.levelName)) {
        const index = stored.findIndex(l => l.level === (profileRes.level || 3));
        const backendLevel = {
          level: profileRes.level || 3,
          levelName: profileRes.levelName || 'Explorador VIP',
          minPoints: profileRes.points || 0,
          requiredPointsForNext: profileRes.nextReward?.requiredPoints || profileRes.pointsForNextReward || 2000,
          nextRewardName: profileRes.nextReward?.name || profileRes.nextReward || 'Entrada Gratis a Festival',
          color: '#8b5cf6',
          badgeIcon: '👑',
          is_active: true
        };
        if (index !== -1) {
          stored[index] = { ...backendLevel, ...stored[index] };
        } else {
          stored.push(backendLevel);
        }
        saveVipConfig(stored);
        return stored;
      }

      // 3. Fallback /api/vip-pass/levels
      const response = await silentFetch(API_URL_VIP_PASS_LEVELS);
      if (response && Array.isArray(response) && response.length > 0) {
        saveVipConfig(response);
        return response;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error al consultar niveles VIP del backend:', e);
  }
  return stored;
};

/**
 * Guardar / Actualizar nivel de Pass VIP
 */
export const saveVipPassLevel = async (levelData) => {
  const levels = getStoredVipConfig();
  const index = levels.findIndex(l => l.level === parseInt(levelData.level));

  const updatedLevel = {
    level: parseInt(levelData.level),
    levelName: levelData.levelName,
    minPoints: parseInt(levelData.minPoints),
    requiredPointsForNext: parseInt(levelData.requiredPointsForNext),
    nextRewardName: levelData.nextRewardName,
    color: levelData.color || '#8b5cf6',
    badgeIcon: levelData.badgeIcon || '👑',
    is_active: levelData.is_active !== undefined ? levelData.is_active : true
  };

  if (index !== -1) {
    levels[index] = updatedLevel;
  } else {
    levels.push(updatedLevel);
    levels.sort((a, b) => a.level - b.level);
  }

  saveVipConfig(levels);

  try {
    const token = getAuthToken();
    if (token) {
      await fetch(API_URL_GAMIFICATION_VIP_LEVELS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedLevel)
      }).catch(() => null);

      await fetch(API_URL_VIP_PASS_CONFIG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(levels)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error al sincronizar nivel VIP con backend:', e);
  }

  return levels;
};

/**
 * Obtener perfil y estado dinámico del Pass VIP del usuario
 * Endpoint: GET /api/gamification/vip-pass
 */
export const getVipPassProfile = async () => {
  try {
    const profileRes = await silentFetch(API_URL_GAMIFICATION_VIP_PASS);
    if (profileRes && (profileRes.level || profileRes.levelName)) {
      return {
        level: profileRes.level ?? 1,
        levelName: profileRes.levelName || 'Explorador VIP',
        points: profileRes.points ?? 350,
        nextReward: {
          name: profileRes.nextReward?.name || profileRes.nextReward || 'Entrada Gratis a Festival',
          requiredPoints: profileRes.nextReward?.requiredPoints ?? profileRes.requiredPointsForNext ?? 500
        },
        stats: {
          events: profileRes.stats?.events ?? 5,
          streak: profileRes.stats?.streak ?? 3,
          redemptions: profileRes.stats?.redemptions ?? 1
        }
      };
    }
  } catch (e) {
    console.warn('⚠️ Error consultando GET /api/gamification/vip-pass:', e);
  }

  // Fallback por defecto según requerimientos
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
};

