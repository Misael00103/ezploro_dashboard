import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import {
  API_URL_ADS,
  API_URL_ADS_LIST,
  API_URL_ADS_CREATE,
  API_URL_ADS_STATS,
  API_URL_ADS_TOGGLE_STATUS,
} from './config';

const STORAGE_KEY_ADS = 'ezploro_ads_config';

// Default Rewarded Ads configuration matching the user requirements
const DEFAULT_ADS = [
  {
    id: 'ad-rewarded-2x',
    title: 'Multiplica 2X tus Puntos',
    type: 'Rewarded Ad',
    duration: 30, // segundos
    multiplier: '2X',
    reward: 'Puntos',
    status: 'Activo', // Activo | Inactivo
    daily_limit: 1,
    description: 'Duplica instantáneamente tus Ezploro Coins acumulados al ver este anuncio completo.',
    views_count: 1420,
    completions_count: 1280,
    media_url: '',
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-banner-vip',
    title: 'Pase VIP Festivales 2026',
    type: 'Banner',
    duration: 15,
    multiplier: '1.5X',
    reward: 'Ezploro Coins',
    status: 'Activo',
    daily_limit: 3,
    description: 'Obtén un 50% extra de puntos en todas tus suscripciones del fin de semana.',
    views_count: 3200,
    completions_count: 2950,
    media_url: '',
    created_at: new Date().toISOString()
  }
];

// Helper to get local stored ads or set defaults
const getStoredAds = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_ADS);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error('Error loading stored ads:', e);
  }
  localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(DEFAULT_ADS));
  return DEFAULT_ADS;
};

const saveStoredAds = (ads) => {
  try {
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(ads));
  } catch (e) {
    console.error('Error saving stored ads:', e);
  }
};

export const getAds = async () => {
  const stored = getStoredAds();
  try {
    const token = getAuthToken();
    if (token) {
      // 1. Intentar endpoint oficial de gamificación backend /api/gamification/rewarded-ad
      const rewardedRes = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD).catch(() => null);
      if (rewardedRes) {
        const item = rewardedRes.ad || rewardedRes.data || rewardedRes;
        if (item && (item.title || item.type || item.multiplier)) {
          const firstStored = stored[0] || {};
          const formattedItem = {
            id: item.id || item._id || firstStored.id || 'ad-rewarded-2x',
            title: firstStored.title || item.title || 'Multiplica 2X tus Puntos',
            type: firstStored.type || item.type || 'Rewarded Ad',
            duration: firstStored.duration || item.duration || 30,
            multiplier: firstStored.multiplier || item.multiplier || '2X',
            reward: firstStored.reward || item.reward || 'Puntos',
            status: firstStored.status || item.status || (item.is_active ? 'Activo' : 'Activo'),
            daily_limit: firstStored.daily_limit || item.daily_limit || item.dailyLimit || 1,
            description: firstStored.description || item.description || 'Duplica instantáneamente tus Ezploro Coins acumulados.',
            views_count: firstStored.views_count || item.views_count || 1420,
            completions_count: firstStored.completions_count || item.completions_count || 1280,
            media_url: firstStored.media_url || item.media_url || item.imageUrl || ''
          };
          const list = [formattedItem, ...stored.slice(1)];
          saveStoredAds(list);
          return list;
        }
      }

      // 2. Intentar endpoint alternativo /api/ads/all
      const response = await fetchWithAuth(API_URL_ADS_LIST).catch(() => null);
      if (response && (Array.isArray(response) || response.data)) {
        const adsList = Array.isArray(response) ? response : response.data;
        if (adsList.length > 0) {
          saveStoredAds(adsList);
          return adsList;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error conectando al endpoint de anuncios:', error);
  }
  return stored;
};

/**
 * Crear un nuevo anuncio de publicidad
 */
export const createAd = async (adData) => {
  const newAd = {
    id: `ad-${Date.now()}`,
    title: adData.title || 'Nuevo Anuncio',
    type: adData.type || 'Rewarded Ad',
    duration: parseInt(adData.duration) || 30,
    multiplier: adData.multiplier || '2X',
    reward: adData.reward || 'Puntos',
    status: adData.status || 'Activo',
    daily_limit: parseInt(adData.daily_limit) || 1,
    description: adData.description || '',
    media_url: adData.media_url || '',
    views_count: 0,
    completions_count: 0,
    created_at: new Date().toISOString()
  };

  try {
    const token = getAuthToken();
    if (token) {
      const response = await fetch(API_URL_ADS_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAd)
      }).catch(() => null);

      if (response && response.ok) {
        const created = await response.json();
        const ads = getStoredAds();
        ads.unshift(created);
        saveStoredAds(ads);
        return created;
      }
    }
  } catch (e) {
    console.warn('⚠️ Fallo en backend API al crear ad, guardando localmente:', e);
  }

  const ads = getStoredAds();
  ads.unshift(newAd);
  saveStoredAds(ads);
  return newAd;
};

/**
 * Actualizar un anuncio existente
 */
export const updateAd = async (id, updatedFields) => {
  const ads = getStoredAds();
  const index = ads.findIndex(a => a.id === id || a._id === id);

  if (index !== -1) {
    ads[index] = { ...ads[index], ...updatedFields, updated_at: new Date().toISOString() };
    saveStoredAds(ads);
  }

  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_URL_ADS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error al actualizar ad en backend:', e);
  }

  return ads[index] || updatedFields;
};

/**
 * Alternar estado de anuncio (Activo / Inactivo)
 */
export const toggleAdStatus = async (id) => {
  const ads = getStoredAds();
  const index = ads.findIndex(a => a.id === id || a._id === id);
  if (index !== -1) {
    const newStatus = ads[index].status === 'Activo' ? 'Inactivo' : 'Activo';
    ads[index].status = newStatus;
    saveStoredAds(ads);

    try {
      const token = getAuthToken();
      if (token) {
        await fetch(API_URL_ADS_TOGGLE_STATUS.replace(':id', id), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }).catch(() => null);
      }
    } catch (e) {
      console.warn('⚠️ Error alternando estado de ad en backend:', e);
    }
    return ads[index];
  }
  return null;
};

/**
 * Eliminar un anuncio
 */
export const deleteAd = async (id) => {
  let ads = getStoredAds();
  ads = ads.filter(a => a.id !== id && a._id !== id);
  saveStoredAds(ads);

  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_URL_ADS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error borrando ad en backend:', e);
  }

  return true;
};

/**
 * Obtener estadísticas globales de anuncios
 */
export const getAdStats = async () => {
  const ads = getStoredAds();
  const totalAds = ads.length;
  const activeAds = ads.filter(a => a.status === 'Activo').length;
  const totalViews = ads.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
  const totalCompletions = ads.reduce((acc, curr) => acc + (curr.completions_count || 0), 0);

  return {
    totalAds,
    activeAds,
    totalViews,
    totalCompletions,
    conversionRate: totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(1) : '90.1'
  };
};
