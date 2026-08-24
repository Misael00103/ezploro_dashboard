import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import {
  API_URL_DAILY_REWARDS,
  API_URL_DAILY_REWARDS_CONFIG,
  API_URL_DAILY_REWARDS_HISTORY
} from './config';

const STORAGE_KEY_DAILY_REWARDS = 'ezploro_daily_rewards_config';
const STORAGE_KEY_DAILY_HISTORY = 'ezploro_daily_rewards_history';

// Default daily chest configuration matching prompt requirements
const DEFAULT_DAILY_CHEST_CONFIG = {
  name: 'Cofre Místico de la Suerte',
  type: 'Premio diario',
  available: true,
  min: 10,
  max: 250,
  cooldownHours: 24,
  description: 'Abre tu cofre místico diario y gana hasta 250 Ezploro Coins de manera aleatoria cada 24 horas.',
  icon: '🎁',
  jackpot_chance: '5%',
  jackpot_amount: 500
};

const DEFAULT_HISTORY = [
  {
    id: 'hist-1',
    user_name: 'Carlos Mendoza',
    user_email: 'carlos@ezploro.com',
    reward_type: 'points',
    points_awarded: 150,
    claimed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    chest_name: 'Cofre Místico de la Suerte'
  },
  {
    id: 'hist-2',
    user_name: 'Ana Sofia Perez',
    user_email: 'ana@ezploro.com',
    reward_type: 'points',
    points_awarded: 25,
    claimed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    chest_name: 'Cofre Místico de la Suerte'
  },
  {
    id: 'hist-3',
    user_name: 'Mateo Gomez',
    user_email: 'mateo@ezploro.com',
    reward_type: 'jackpot',
    points_awarded: 500,
    claimed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    chest_name: 'Cofre Místico de la Suerte'
  }
];

export const getStoredDailyConfig = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error('Error parsing stored daily rewards config:', e);
  }
  localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(DEFAULT_DAILY_CHEST_CONFIG));
  return DEFAULT_DAILY_CHEST_CONFIG;
};

export const saveDailyConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving daily rewards config:', e);
  }
};

/**
 * Obtener la configuración actual del Cofre de Premios Diarios
 */
export const getDailyChestConfig = async () => {
  const stored = getStoredDailyConfig();
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar endpoint backend real /api/gamification/daily-prize
      const prizeRes = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_PRIZE).catch(() => null);
      if (prizeRes) {
        const item = prizeRes.reward || prizeRes.data || prizeRes;
        if (item && (item.min !== undefined || item.min_points !== undefined || item.max !== undefined)) {
          const configData = {
            ...stored,
            name: item.name || stored.name,
            type: item.type || stored.type,
            available: item.available !== undefined ? item.available : stored.available,
            min: item.min ?? item.min_points ?? stored.min,
            max: item.max ?? item.max_points ?? stored.max,
            cooldownHours: item.cooldownHours ?? item.cooldown_hours ?? stored.cooldownHours,
            description: item.description || stored.description
          };
          saveDailyConfig(configData);
          return configData;
        }
      }

      // 2. Intentar /api/gamification/daily-prize-config
      const configRes = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG).catch(() => null);
      if (configRes) {
        const item = configRes.reward || configRes.data || configRes;
        if (item) {
          const configData = {
            ...stored,
            name: item.name || stored.name,
            type: item.type || stored.type,
            available: item.available !== undefined ? item.available : stored.available,
            min: item.min ?? item.min_points ?? stored.min,
            max: item.max ?? item.max_points ?? stored.max,
            cooldownHours: item.cooldownHours ?? item.cooldown_hours ?? stored.cooldownHours,
            description: item.description || stored.description
          };
          saveDailyConfig(configData);
          return configData;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error consultando endpoint de cofre diario:', e);
  }
  return stored;
};

/**
 * Actualizar la configuración del Cofre de Premios Diarios desde el Dashboard
 */
export const updateDailyChestConfig = async (newConfig) => {
  const currentConfig = getStoredDailyConfig();
  const updatedConfig = {
    ...currentConfig,
    ...newConfig,
    min: parseInt(newConfig.min ?? currentConfig.min),
    max: parseInt(newConfig.max ?? currentConfig.max),
    cooldownHours: parseInt(newConfig.cooldownHours ?? currentConfig.cooldownHours),
    updated_at: new Date().toISOString()
  };

  saveDailyConfig(updatedConfig);

  try {
    const token = getAuthToken();
    if (token) {
      const payload = {
        ...updatedConfig,
        min_points: updatedConfig.min,
        max_points: updatedConfig.max,
        cooldown_hours: updatedConfig.cooldownHours,
      };

      await fetch(API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      await fetch(API_URL_DAILY_REWARDS_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error al actualizar configuración de cofre en backend:', e);
  }

  return updatedConfig;
};

/**
 * Obtener historial de reclamos de premios diarios reales
 */
export const getDailyRewardHistory = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar endpoint de historial de premios diarios / daily-rewards/history
      const response1 = await fetchWithAuth(API_URL_DAILY_REWARDS_HISTORY).catch(() => null);
      const items1 = response1?.data || response1?.history || (Array.isArray(response1) ? response1 : null);
      if (Array.isArray(items1) && items1.length > 0) {
        return items1;
      }

      // 2. Intentar /api/gamification/daily-prize/history o /api/gamification/history
      const response2 = await fetchWithAuth(`${API_URL_DAILY_REWARDS_HISTORY.replace('/daily-rewards/history', '/gamification/daily-prize/history')}`).catch(() => null);
      const items2 = response2?.data || response2?.history || (Array.isArray(response2) ? response2 : null);
      if (Array.isArray(items2) && items2.length > 0) {
        return items2;
      }

      // 3. Intentar /api/gamification/history o reclamos generales
      const response3 = await fetchWithAuth('/gamification/history').catch(() => null);
      const items3 = response3?.data || response3?.history || (Array.isArray(response3) ? response3 : null);
      if (Array.isArray(items3) && items3.length > 0) {
        return items3;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error al consultar historial de reclamos en backend:', e);
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading daily history cache:', e);
  }

  return [];
};
