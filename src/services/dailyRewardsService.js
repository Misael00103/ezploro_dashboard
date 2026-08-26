import { fetchWithAuth } from './userService';
import { getAuthToken, getCurrentUserId } from './authService';
import {
  API_URL_DAILY_REWARDS,
  API_URL_DAILY_REWARDS_CONFIG,
  API_URL_DAILY_REWARDS_HISTORY,
  API_URL_GAMIFICATION_DAILY_PRIZE,
  API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG,
  BASE_URL
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
    user_name: 'Ana Sofía Silva',
    user_email: 'ana@ezploro.com',
    reward_type: 'points',
    points_awarded: 250,
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

// Helper to make silent fetch that returns null on error
const silentFetch = async (url) => {
  try {
    return await fetchWithAuth(url);
  } catch (e) {
    return null;
  }
};

const getStoredConfig = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error('Error loading stored daily chest config:', e);
  }
  localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(DEFAULT_DAILY_CHEST_CONFIG));
  return DEFAULT_DAILY_CHEST_CONFIG;
};

const saveStoredConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving daily chest config:', e);
  }
};

/**
 * Obtener configuración del cofre místico diario
 */
export const getDailyChestConfig = async () => {
  const stored = getStoredConfig();

  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar /gamification/daily-prize (GET válido en backend)
      const response = await silentFetch(API_URL_GAMIFICATION_DAILY_PRIZE);
      if (response) {
        const item = response.config || response.data || response;
        const formatted = {
          name: item.name || item.title || stored.name || 'Cofre Místico de la Suerte',
          type: 'Premio diario',
          available: item.available !== undefined ? item.available : (item.is_active !== undefined ? item.is_active : true),
          min: parseInt(item.min || item.min_points) || stored.min || 10,
          max: parseInt(item.max || item.max_points) || stored.max || 250,
          cooldownHours: parseInt(item.cooldownHours || item.cooldown_hours) || stored.cooldownHours || 24,
          description: item.description || stored.description || 'Abre tu cofre místico diario y gana Ezploro Coins cada 24 horas.',
          icon: item.icon || stored.icon || '🎁',
          jackpot_chance: item.jackpot_chance || item.jackpotChance || stored.jackpot_chance || '5%',
          jackpot_amount: parseInt(item.jackpot_amount || item.jackpotAmount) || stored.jackpot_amount || 500
        };

        saveStoredConfig(formatted);
        return formatted;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error consultando backend de cofre diario:', error);
  }

  return stored;
};

/**
 * Guardar / Actualizar configuración del cofre místico diario
 */
export const updateDailyChestConfig = async (newConfig) => {
  const stored = getStoredConfig();
  const updatedConfig = {
    ...stored,
    ...newConfig,
    min: parseInt(newConfig.min) || stored.min || 10,
    max: parseInt(newConfig.max) || stored.max || 250,
    cooldownHours: parseInt(newConfig.cooldownHours) || stored.cooldownHours || 24,
    updated_at: new Date().toISOString()
  };

  saveStoredConfig(updatedConfig);

  try {
    const token = getAuthToken();
    if (token) {
      const payload = {
        name: updatedConfig.name,
        available: updatedConfig.available,
        min_points: updatedConfig.min,
        max_points: updatedConfig.max,
        cooldown_hours: updatedConfig.cooldownHours,
        description: updatedConfig.description,
        jackpot_chance: updatedConfig.jackpot_chance,
        jackpot_amount: updatedConfig.jackpot_amount
      };

      await fetchWithAuth(API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error al actualizar configuración de cofre en backend:', e);
  }

  return updatedConfig;
};

/**
 * Obtener historial de reclamos de premios diarios reales de forma silenciosa
 */
export const getDailyRewardHistory = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar /daily-rewards/history (GET válido en backend)
      const response1 = await silentFetch(API_URL_DAILY_REWARDS_HISTORY);
      const items1 = response1?.data || response1?.history || (Array.isArray(response1) ? response1 : null);
      if (Array.isArray(items1) && items1.length > 0) {
        return items1;
      }

      // 2. Intentar endpoint por usuario /gamification/history/:userId (GET válido en backend)
      const userId = getCurrentUserId();
      if (userId) {
        const response2 = await silentFetch(`${BASE_URL}/gamification/history/${userId}`);
        const items2 = response2?.data || response2?.history || (Array.isArray(response2) ? response2 : null);
        if (Array.isArray(items2) && items2.length > 0) {
          return items2;
        }
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
