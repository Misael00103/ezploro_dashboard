import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import {
  API_URL_STREAKS_CONFIG,
  API_URL_GAMIFICATION_DAILY_STREAK,
  API_URL_GAMIFICATION_DAILY_STREAK_CONFIG
} from './config';

const STORAGE_KEY_STREAKS = 'ezploro_streaks_config';

const DEFAULT_STREAK_CONFIG = {
  enabled: true,
  is_active: true,
  target: 7,
  target_days: 7,
  basePointsPerDay: 10,
  base_points_per_day: 10,
  freezeCostPoints: 50,
  freeze_streak_cost: 50,
  days: [
    { day: 'Lun', completed: true, bonus: false, is_bonus: false, points: 10, label: 'Lunes' },
    { day: 'Mar', completed: true, bonus: false, is_bonus: false, points: 10, label: 'Martes' },
    { day: 'Mié', completed: true, bonus: true, is_bonus: true, points: 50, label: 'Miércoles (Bonus 50 PTS ⭐)' },
    { day: 'Jue', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Jueves' },
    { day: 'Vie', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Viernes' },
    { day: 'Sáb', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Sábado' },
    { day: 'Dom', completed: false, bonus: true, is_bonus: true, points: 100, label: 'Domingo (Gran Bonus 100 PTS ⭐)' }
  ],
  days_config: [
    { day: 'Lun', completed: true, bonus: false, is_bonus: false, points: 10, label: 'Lunes' },
    { day: 'Mar', completed: true, bonus: false, is_bonus: false, points: 10, label: 'Martes' },
    { day: 'Mié', completed: true, bonus: true, is_bonus: true, points: 50, label: 'Miércoles (Bonus 50 PTS ⭐)' },
    { day: 'Jue', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Jueves' },
    { day: 'Vie', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Viernes' },
    { day: 'Sáb', completed: false, bonus: false, is_bonus: false, points: 10, label: 'Sábado' },
    { day: 'Dom', completed: false, bonus: true, is_bonus: true, points: 100, label: 'Domingo (Gran Bonus 100 PTS ⭐)' }
  ],
  rules_summary: 'Asiste a la app diariamente para mantener activa tu racha. El 3º día obtendrás 50 PTS extra y al completar los 7 días obtendrás el gran cofre de 100 PTS.',
  summary_rules: 'Asiste a la app diariamente para mantener activa tu racha. El 3º día obtendrás 50 PTS extra y al completar los 7 días obtendrás el gran cofre de 100 PTS.'
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
 * GET /api/gamification/daily-streak-config
 */
const normalizeStreakResponse = (res, currentStored = {}) => {
  if (!res) return currentStored;
  const item = res.config || res.streak || res.data || res;
  if (!item || typeof item !== 'object') return currentStored;

  const isAct = item.is_active !== undefined ? !!item.is_active
    : (item.enabled !== undefined ? !!item.enabled
      : (currentStored.is_active ?? true));

  const tgt = parseInt(item.target_days ?? item.target ?? item.targetDays ?? currentStored.target_days ?? currentStored.target ?? 7) || 7;
  const basePts = parseInt(item.base_points_per_day ?? item.basePointsPerDay ?? currentStored.base_points_per_day ?? currentStored.basePointsPerDay ?? 10) || 10;
  const freezeCost = parseInt(item.freeze_streak_cost ?? item.freezeCostPoints ?? currentStored.freeze_streak_cost ?? currentStored.freezeCostPoints ?? 50) || 50;
  const summary = item.summary_rules || item.rules_summary || currentStored.summary_rules || currentStored.rules_summary || '';

  const rawDays = Array.isArray(item.days_config) && item.days_config.length > 0
    ? item.days_config
    : (Array.isArray(item.daysConfig) && item.daysConfig.length > 0
      ? item.daysConfig
      : (Array.isArray(item.days) && item.days.length > 0
        ? item.days
        : (Array.isArray(item.daysOfWeek) && item.daysOfWeek.length > 0
          ? item.daysOfWeek
          : (currentStored.days_config || currentStored.days || []))));

  const mappedDays = rawDays.map((d, idx) => {
    const storedD = currentStored.days?.[idx] || currentStored.days_config?.[idx] || {};
    const dayName = d.day || d.name || d.label || storedD.day || `Día ${idx + 1}`;

    // Evaluar true si cualquiera de los alias viene activado
    const isB = d.is_bonus === true || d.bonus === true || d.isBonus === true || d.bonusDay === true;

    // Obtener los puntos asignados
    const rawPts = d.points ?? d.points_day ?? d.puntos ?? d.pointsDay ?? storedD.points ?? storedD.points_day ?? 10;
    const pts = parseInt(rawPts) || 10;

    return {
      ...storedD,
      ...d,
      day: dayName,
      name: dayName,
      points: pts,
      points_day: pts,
      puntos: pts,
      pointsDay: pts,
      bonus: isB,
      is_bonus: isB,
      isBonus: isB,
      bonusDay: isB
    };
  });

  return {
    ...currentStored,
    enabled: isAct,
    is_active: isAct,
    target: tgt,
    target_days: tgt,
    targetDays: tgt,
    basePointsPerDay: basePts,
    base_points_per_day: basePts,
    freezeCostPoints: freezeCost,
    freeze_streak_cost: freezeCost,
    days: mappedDays,
    days_config: mappedDays,
    daysConfig: mappedDays,
    daysOfWeek: mappedDays,
    rules_summary: summary,
    summary_rules: summary,
    updated_at: item.updated_at || new Date().toISOString()
  };
};

/**
 * Obtener configuración global de rachas
 * GET /api/gamification/daily-streak-config
 */
export const getStreakConfig = async () => {
  const currentStored = getStoredStreakConfig();
  try {
    const token = getAuthToken();
    if (token) {
      // 1. GET /api/gamification/daily-streak-config
      const configRes = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK_CONFIG).catch(() => null);
      if (configRes) {
        const normalized = normalizeStreakResponse(configRes, currentStored);
        saveStreakConfig(normalized);
        return normalized;
      }

      // 2. GET /api/gamification/daily-streak
      const streakRes = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK).catch(() => null);
      if (streakRes) {
        const normalized = normalizeStreakResponse(streakRes, currentStored);
        saveStreakConfig(normalized);
        return normalized;
      }

      // 3. GET /api/streaks/config
      const fallbackRes = await fetchWithAuth(API_URL_STREAKS_CONFIG).catch(() => null);
      if (fallbackRes) {
        const normalized = normalizeStreakResponse(fallbackRes, currentStored);
        saveStreakConfig(normalized);
        return normalized;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error consultando racha diaria:', e);
  }
  return currentStored;
};

/**
 * Actualizar la configuración de rachas diarias desde el Dashboard
 * PUT /api/gamification/daily-streak-config
 */
export const updateStreakConfig = async (newConfig) => {
  const currentStored = getStoredStreakConfig();
  const normalizedInput = normalizeStreakResponse(newConfig, currentStored);

  saveStreakConfig(normalizedInput);

  try {
    const token = getAuthToken();
    if (token) {
      const payload = {
        is_active: normalizedInput.is_active,
        target_days: normalizedInput.target_days,
        base_points_per_day: normalizedInput.base_points_per_day,
        freeze_streak_cost: normalizedInput.freeze_streak_cost,
        summary_rules: normalizedInput.summary_rules,
        days_config: normalizedInput.days_config.map(d => ({
          day: d.day,
          points: d.points,
          is_bonus: d.is_bonus
        }))
      };

      console.log('🔵 PUT /api/gamification/daily-streak-config - Enviando payload al backend NestJS:', payload);

      const res = await fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(async () => {
        return fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK_CONFIG, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(async () => {
          return fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(async () => {
            return fetchWithAuth(API_URL_GAMIFICATION_DAILY_STREAK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).catch(async () => {
              return fetch(API_URL_STREAKS_CONFIG, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
              }).catch(() => null);
            });
          });
        });
      });

      if (res) {
        console.log('🟢 Respuesta recibida del backend tras guardar rachas:', res);
        const serverNormalized = normalizeStreakResponse(res, normalizedInput);
        saveStreakConfig(serverNormalized);
        return serverNormalized;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error enviando configuración de rachas al backend:', e);
  }

  return normalizedInput;
};
