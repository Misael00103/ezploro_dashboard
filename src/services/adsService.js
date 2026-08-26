import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import {
  API_URL_ADS,
  API_URL_ADS_LIST,
  API_URL_ADS_CREATE,
  API_URL_ADS_STATS,
  API_URL_ADS_TOGGLE_STATUS,
  API_URL_GAMIFICATION_REWARDED_AD,
  API_URL_GAMIFICATION_REWARDED_AD_CONFIG,
  API_URL_GAMIFICATION_CLAIM_REWARDED_AD,
} from './config';

const STORAGE_KEY_ADS = 'ezploro_ads_config';

// Configuración inicial limpia sin datos falsos harcodeados
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
    daily_count: 0,
    description: 'Duplica instantáneamente tus Ezploro Coins acumulados al ver este anuncio completo.',
    views_count: 0,
    completions_count: 0,
    media_url: '',
    created_at: new Date().toISOString()
  }
];

// Helper para obtener anuncios locales y limpiar viejos datos falsos (1420 / 1280 / 2950 / 1422)
const getStoredAds = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_ADS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Limpiar datos que contenían métricas falsas simuladas en versiones anteriores
        const sanitized = parsed.map(a => {
          const isLegacyFakeViews = (a.views_count >= 1400 || a.views_count === 3200);
          const isLegacyFakeCompletions = (a.completions_count >= 1200 || a.completions_count === 2950);
          return {
            ...a,
            views_count: isLegacyFakeViews ? 0 : (a.views_count || 0),
            completions_count: isLegacyFakeCompletions ? 0 : (a.completions_count || 0),
            duration: typeof a.duration === 'string' ? (parseInt(a.duration) || 30) : (a.duration || 30)
          };
        });
        localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (e) {
    console.error('Error cargando anuncios almacenados:', e);
  }
  localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(DEFAULT_ADS));
  return DEFAULT_ADS;
};

const saveStoredAds = (ads) => {
  try {
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(ads));
  } catch (e) {
    console.error('Error guardando anuncios:', e);
  }
};

/**
 * Endpoint: GET /api/gamification/rewarded-ad
 * Consulta el estado real del anuncio 2X y contador diario del backend
 */
export const getRewardedAdState = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      console.log('🔵 GET /api/gamification/rewarded-ad - Solicitando datos reales...');
      const response = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD).catch(err => {
        console.warn('⚠️ GET /api/gamification/rewarded-ad falló o no retornó datos:', err);
        return null;
      });

      if (response) {
        console.log('🟢 GET /api/gamification/rewarded-ad - Respuesta del servidor:', response);
        const item = response.ad || response.data || response;
        const result = {
          id: item.id || item._id || 'ad-rewarded-2x',
          title: item.title || item.name || 'Multiplica 2X tus Puntos',
          type: 'Rewarded Ad',
          duration: parseInt(item.duration) || 30,
          multiplier: item.multiplier || '2X',
          reward: item.reward || 'Puntos',
          status: item.status || (item.is_active === false ? 'Inactivo' : 'Activo'),
          daily_limit: parseInt(item.daily_limit || item.dailyLimit) || 1,
          daily_count: response.daily_count !== undefined ? response.daily_count : (item.daily_count || item.dailyCount || 0),
          description: item.description || 'Duplica instantáneamente tus Ezploro Coins acumulados.',
          views_count: item.views_count !== undefined ? item.views_count : (item.viewsCount !== undefined ? item.viewsCount : 0),
          completions_count: item.completions_count !== undefined ? item.completions_count : (item.completionsCount !== undefined ? item.completionsCount : 0),
          media_url: item.media_url || item.imageUrl || ''
        };

        const stored = getStoredAds();
        const index = stored.findIndex(a => a.id === result.id || a.type === 'Rewarded Ad');
        if (index !== -1) {
          stored[index] = { ...stored[index], ...result };
        } else {
          stored.unshift(result);
        }
        saveStoredAds(stored);

        return result;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error al consultar GET /api/gamification/rewarded-ad:', error);
  }

  const stored = getStoredAds();
  const defaultRewarded = stored.find(a => a.type === 'Rewarded Ad' || a.id === 'ad-rewarded-2x') || DEFAULT_ADS[0];
  return {
    ...defaultRewarded,
    views_count: defaultRewarded.views_count >= 1400 ? 0 : (defaultRewarded.views_count || 0),
    completions_count: defaultRewarded.completions_count >= 1200 ? 0 : (defaultRewarded.completions_count || 0)
  };
};

/**
 * Endpoint: POST /api/gamification/claim-rewarded-ad
 * Reclamar multiplicador 2X tras ver el anuncio
 */
export const claimRewardedAd = async (adId = 'ad-rewarded-2x') => {
  try {
    const token = getAuthToken();
    if (token) {
      try {
        const response = await fetchWithAuth(API_URL_GAMIFICATION_CLAIM_REWARDED_AD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ad_id: adId })
        });

        if (response) {
          const stored = getStoredAds();
          const updatedAds = stored.map(ad => {
            if (ad.id === adId || ad._id === adId || ad.type === 'Rewarded Ad') {
              return {
                ...ad,
                views_count: (ad.views_count || 0) + 1,
                completions_count: (ad.completions_count || 0) + 1,
                daily_count: (ad.daily_count || 0) + 1
              };
            }
            return ad;
          });
          saveStoredAds(updatedAds);

          return {
            success: true,
            multiplier: response.multiplier || '2X',
            message: response.message || '¡Multiplicador 2X reclamado exitosamente!',
            points_awarded: response.points_awarded || response.points || 0,
            daily_count: response.daily_count !== undefined ? response.daily_count : (updatedAds.find(a => a.type === 'Rewarded Ad')?.daily_count || 1),
            data: response
          };
        }
      } catch (err) {
        const errorMsg = err?.message || '';
        if (
          errorMsg.includes('límite') ||
          errorMsg.includes('limit') ||
          errorMsg.includes('alcanzado') ||
          errorMsg.includes('recompensados') ||
          errorMsg.includes('BadRequest')
        ) {
          console.warn('ℹ️ Límite diario de anuncios recompensados alcanzado en backend:', errorMsg);
          return {
            success: false,
            is_limit_reached: true,
            message: errorMsg || 'Has alcanzado el límite diario de anuncios recompensados.',
            error: errorMsg
          };
        }
        throw err;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error ejecutando POST /api/gamification/claim-rewarded-ad:', error);
    return {
      success: false,
      message: error?.message || 'No se pudo reclamar la recompensa del anuncio.',
      error: error?.message
    };
  }

  const stored = getStoredAds();
  let updatedClaimedAd = null;
  const updatedAds = stored.map(ad => {
    if (ad.id === adId || ad._id === adId || ad.type === 'Rewarded Ad') {
      const nextAd = {
        ...ad,
        views_count: (ad.views_count || 0) + 1,
        completions_count: (ad.completions_count || 0) + 1,
        daily_count: (ad.daily_count || 0) + 1
      };
      updatedClaimedAd = nextAd;
      return nextAd;
    }
    return ad;
  });
  saveStoredAds(updatedAds);

  return {
    success: true,
    multiplier: updatedClaimedAd?.multiplier || '2X',
    message: '¡Multiplicador 2X reclamado exitosamente!',
    points_awarded: 100,
    daily_count: updatedClaimedAd?.daily_count || 1
  };
};

/**
 * Guardar / Editar Configuración del Rewarded Ad 2X
 */
export const saveRewardedAdConfig = async (configData) => {
  const ads = getStoredAds();
  const index = ads.findIndex(a => a.type === 'Rewarded Ad' || a.id === configData.id || a.id === 'ad-rewarded-2x');

  const updatedAd = {
    ...(index !== -1 ? ads[index] : DEFAULT_ADS[0]),
    ...configData,
    duration: parseInt(configData.duration) || 30,
    daily_limit: parseInt(configData.daily_limit) || 1,
    updated_at: new Date().toISOString()
  };

  if (index !== -1) {
    ads[index] = updatedAd;
  } else {
    ads.unshift(updatedAd);
  }
  saveStoredAds(ads);

  try {
    const token = getAuthToken();
    if (token) {
      const payload = {
        title: updatedAd.title,
        type: 'Rewarded Ad',
        duration: updatedAd.duration,
        duration_seconds: updatedAd.duration,
        multiplier: updatedAd.multiplier,
        daily_limit: updatedAd.daily_limit,
        status: updatedAd.status,
        is_active: updatedAd.status === 'Activo' || updatedAd.is_active === true,
        description: updatedAd.description,
        media_url: updatedAd.media_url
      };

      console.log('🔵 Guardando configuración rewarded ad en backend (PUT /api/gamification/rewarded-ad-config):', payload);
      await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(async () => {
        return fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      });
    }
  } catch (e) {
    console.warn('⚠️ Error al actualizar configuración de rewarded ad en backend:', e);
  }

  return updatedAd;
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
            title: item.title || firstStored.title || 'Multiplica 2X tus Puntos',
            type: 'Rewarded Ad',
            duration: parseInt(item.duration) || parseInt(firstStored.duration) || 30,
            multiplier: item.multiplier || firstStored.multiplier || '2X',
            reward: item.reward || firstStored.reward || 'Puntos',
            status: item.status || firstStored.status || (item.is_active === false ? 'Inactivo' : 'Activo'),
            daily_limit: parseInt(item.daily_limit || item.dailyLimit) || firstStored.daily_limit || 1,
            daily_count: rewardedRes.daily_count !== undefined ? rewardedRes.daily_count : (item.daily_count || 0),
            description: item.description || firstStored.description || 'Duplica instantáneamente tus Ezploro Coins acumulados.',
            views_count: item.views_count !== undefined ? item.views_count : (firstStored.views_count || 0),
            completions_count: item.completions_count !== undefined ? item.completions_count : (firstStored.completions_count || 0),
            media_url: item.media_url || item.imageUrl || firstStored.media_url || ''
          };
          const list = [formattedItem, ...stored.filter(a => a.id !== formattedItem.id)];
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
    daily_count: 0,
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
    ads[index] = {
      ...ads[index],
      ...updatedFields,
      duration: parseInt(updatedFields.duration) || ads[index].duration || 30,
      daily_limit: parseInt(updatedFields.daily_limit) || ads[index].daily_limit || 1,
      updated_at: new Date().toISOString()
    };
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
  const index = ads.findIndex(a => a.id === id || a._id === id || a.type === 'Rewarded Ad');

  if (index !== -1) {
    const currentAd = ads[index];
    const newStatus = currentAd.status === 'Activo' ? 'Inactivo' : 'Activo';
    ads[index].status = newStatus;
    saveStoredAds(ads);

    try {
      const token = getAuthToken();
      if (token) {
        if (id === 'ad-rewarded-2x' || currentAd.type === 'Rewarded Ad') {
          // Enviar actualización de estado mediante el endpoint /api/gamification/rewarded-ad
          await saveRewardedAdConfig({
            ...currentAd,
            status: newStatus,
            is_active: newStatus === 'Activo'
          });
        } else {
          await fetchWithAuth(API_URL_ADS_TOGGLE_STATUS.replace(':id', id), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, is_active: newStatus === 'Activo' })
          }).catch(() => null);
        }
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
 * Obtener estadísticas globales reales de anuncios
 */
export const getAdStats = async () => {
  const ads = getStoredAds();
  const totalAds = ads.length;
  const activeAds = ads.filter(a => a.status === 'Activo').length;
  const totalViews = ads.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
  const totalCompletions = ads.reduce((acc, curr) => acc + (curr.completions_count || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(1) : '0.0';

  return {
    totalAds,
    activeAds,
    totalViews,
    totalCompletions,
    conversionRate
  };
};


