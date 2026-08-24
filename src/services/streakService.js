import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { API_URL_STREAKS_CONFIG } from './config';

const STORAGE_KEY_STREAKS = 'ezploro_streaks_config';

const DEFAULT_STREAK_CONFIG = {
  enabled: true,
  target: 7,
  basePointsPerDay: 10,
  freezeCostPoints: 50,
  days: [
    { day: 'Lun', completed: true, bonus: false, points: 10, label: 'Lunes' },
    { day: 'Mar', completed: true, bonus: false, points: 10, label: 'Martes' },
    { day: 'Mié', completed: true, bonus: true, points: 50, label: 'Miércoles (Bonus 50 PTS ⭐)' },
    { day: 'Jue', completed: false, bonus: false, points: 10, label: 'Jueves' },
    { day: 'Vie', completed: false, bonus: false, points: 10, label: 'Viernes' },
    { day: 'Sáb', completed: false, bonus: false, points: 10, label: 'Sábado' },
    { day: 'Dom', completed: false, bonus: true, points: 100, label: 'Domingo (Gran Bonus 100 PTS ⭐)' }
  ],
  rules_summary: 'Asiste a la app diariamente para mantener activa tu racha. El 3º día obtendrás 50 PTS extra y al completar los 7 días obtendrás el gran cofre de 100 PTS.'
};

export const getStoredStreakConfig = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_STREAKS);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error('Error loading stored streak config:', e);
  }
  localStorage.setItem(STORAGE_KEY_STREAKS, JSON.stringify(DEFAULT_STREAK_CONFIG));
  return DEFAULT_STREAK_CONFIG;
};

export const saveStreakConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY_STREAKS, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving streak config:', e);
  }
};

/**
 * Obtener configuración global de rachas
 */
export const getStreakConfig = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar /api/gamification/daily-streak
      const streakRes = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK).catch(() => null);
      if (streakRes) {
        const item = streakRes.streak || streakRes.data || streakRes;
        if (item && (item.target !== undefined || Array.isArray(item.days))) {
          const currentStored = getStoredStreakConfig();
          const configData = {
            ...currentStored,
            enabled: item.enabled !== undefined ? item.enabled : true,
            target: item.target || 7,
            days: Array.isArray(item.days) && item.days.length > 0 ? item.days : currentStored.days,
            rules_summary: item.rules_summary || currentStored.rules_summary
          };
          saveStreakConfig(configData);
          return configData;
        }
      }

      // 2. Intentar /api/streaks/config
      const response = await fetchWithAuth(API_URL_STREAKS_CONFIG).catch(() => null);
      if (response && (response.streak || response.target)) {
        const configData = response.streak ? response.streak : response;
        saveStreakConfig(configData);
        return configData;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error consultando racha diaria:', e);
  }
  return getStoredStreakConfig();
};

/**
 * Actualizar la configuración de rachas diarias desde el Dashboard
 */
export const updateStreakConfig = async (newConfig) => {
  const currentConfig = getStoredStreakConfig();
  const updatedConfig = {
    ...currentConfig,
    ...newConfig,
    target: parseInt(newConfig.target ?? currentConfig.target),
    basePointsPerDay: parseInt(newConfig.basePointsPerDay ?? currentConfig.basePointsPerDay),
    freezeCostPoints: parseInt(newConfig.freezeCostPoints ?? currentConfig.freezeCostPoints),
    updated_at: new Date().toISOString()
  };

  saveStreakConfig(updatedConfig);

  try {
    const token = getAuthToken();
    if (token) {
      await fetch(API_URL_STREAKS_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error enviando configuración de rachas al backend:', e);
  }

  return updatedConfig;
};
