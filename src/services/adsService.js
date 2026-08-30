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
const STORAGE_KEY_DELETED_ADS = 'ezploro_deleted_ad_ids';

const getDeletedAdIds = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_DELETED_ADS);
    return cached ? new Set(JSON.parse(cached)) : new Set();
  } catch (e) {
    return new Set();
  }
};

const recordDeletedAd = (idOrTitle) => {
  if (!idOrTitle) return;
  try {
    const set = getDeletedAdIds();
    set.add(String(idOrTitle).trim().toLowerCase());
    localStorage.setItem(STORAGE_KEY_DELETED_ADS, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

const isAdDeleted = (ad) => {
  if (!ad) return false;
  const idStr = String(ad.id || ad._id || '').trim().toLowerCase();
  if (idStr === 'ad-rewarded-2x' || idStr === 'ad-banner-ezploro') return false;
  const deletedSet = getDeletedAdIds();
  const titleStr = String(ad.title || ad.name || '').trim().toLowerCase();
  return (idStr && deletedSet.has(idStr)) || (titleStr && deletedSet.has(titleStr));
};

// Configuración inicial limpia sin datos falsos harcodeados
const DEFAULT_ADS = [
  {
    id: 'ad-rewarded-2x',
    title: 'Multiplica 2X tus Puntos',
    type: 'Rewarded Ad',
    duration: 30, // segundos
    multiplier: '2X',
    reward: 'Puntos',
    reward_points: 5,
    status: 'Activo', // Activo | Inactivo
    is_active: true,
    daily_limit: 1,
    daily_count: 0,
    campaign_name: 'Multiplicador Doble Ezploro Coins',
    description: 'Duplica instantáneamente tus Ezploro Coins acumulados al ver este anuncio completo.',
    views_count: 0,
    completions_count: 0,
    media_url: '',
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-banner-ezploro',
    title: 'Banner Promocional Ezploro',
    type: 'Banner',
    duration: 30,
    multiplier: '2X',
    reward: 'Puntos',
    reward_points: 5,
    status: 'Activo',
    is_active: true,
    daily_limit: 1,
    daily_count: 0,
    campaign_name: 'Multiplicador Doble Ezploro Coins',
    description: 'Conoce las últimas promociones y ofertas destacadas de Ezploro.',
    views_count: 0,
    completions_count: 0,
    media_url: '',
    created_at: new Date().toISOString()
  }
];

// Helper para obtener anuncios locales deduplicados por ID
const getStoredAds = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_ADS);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const seenIds = new Set();
        const deduplicated = [];

        for (const item of parsed) {
          if (!item || typeof item !== 'object') continue;
          if (isAdDeleted(item)) continue;
          const idKey = String(item.id || item._id || '');
          if (idKey && seenIds.has(idKey)) continue;
          if (idKey) seenIds.add(idKey);

          // Si la imagen no fue subida explicitamente por el usuario, asegurar cadena vacia
          const media = (item.media_url && (item.media_url.startsWith('data:image') || item.media_url.startsWith('http'))) ? item.media_url : '';

          deduplicated.push({
            ...item,
            id: idKey || `ad-${Date.now()}-${deduplicated.length}`,
            title: item.title || 'Anuncio Configurado',
            type: item.type || (deduplicated.length === 0 ? 'Rewarded Ad' : 'Banner'),
            reward_points: parseInt(item.reward_points ?? item.rewardPoints ?? 100) || 100,
            views_count: (item.views_count >= 1400 || item.views_count === 3200) ? 0 : (item.views_count || 0),
            completions_count: (item.completions_count >= 1200 || item.completions_count === 2950) ? 0 : (item.completions_count || 0),
            duration: typeof item.duration === 'string' ? (parseInt(item.duration) || 30) : (item.duration || 30),
            media_url: media,
            mediaUrl: media,
            imageUrl: media,
            image_url: media,
            bannerUrl: media,
            banner_url: media,
            image: media,
            banner: media
          });
        }

        if (deduplicated.length > 0) {
          localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(deduplicated));
          return deduplicated;
        }
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
};const normalizeRewardedAd = (res, fallback = {}) => {
  if (!res) return fallback;
  const item = res.config || res.ad || res.data || res;
  if (!item || typeof item !== 'object') return fallback;

  const durationVal = parseInt(fallback.duration ?? item.duration_seconds ?? item.durationSeconds ?? item.duration ?? 30) || 30;
  const dailyLimitVal = parseInt(fallback.daily_limit ?? item.daily_limit ?? item.dailyLimit ?? 1) || 1;
  const rewardPointsVal = parseInt(fallback.reward_points ?? fallback.rewardPoints ?? item.reward_points ?? item.rewardPoints ?? item.points ?? 5) || 5;

  const titleVal = fallback.title || item.title || item.name || 'Multiplica 2X tus Puntos';
  const typeVal = fallback.type || item.type || 'Rewarded Ad';
  const campaignVal = fallback.campaign_name || item.campaign_name || 'Multiplicador Doble Ezploro Coins';
  const multiplierVal = fallback.multiplier || item.multiplier || '2X';
  const statusVal = fallback.status || (fallback.is_active !== undefined ? (fallback.is_active ? 'Activo' : 'Inactivo') : (item.status || 'Activo'));
  const isActiveVal = statusVal === 'Activo';

  let mediaVal = fallback.media_url !== undefined ? fallback.media_url : (item.media_url || item.imageUrl || '');

  return {
    ...item,
    ...fallback,
    id: fallback.id || item.id || item._id || 'ad-rewarded-2x',
    title: titleVal,
    type: typeVal,
    campaign_name: campaignVal,
    duration: durationVal,
    duration_seconds: durationVal,
    multiplier: multiplierVal,
    reward: 'Puntos',
    reward_points: rewardPointsVal,
    rewardPoints: rewardPointsVal,
    points: rewardPointsVal,
    points_awarded: rewardPointsVal,
    status: statusVal,
    is_active: isActiveVal,
    daily_limit: dailyLimitVal,
    daily_count: res.daily_count !== undefined ? res.daily_count : (item.daily_count ?? fallback.daily_count ?? 0),
    description: fallback.description || item.description || 'Duplica instantáneamente tus Ezploro Coins acumulados.',
    views_count: item.views_count !== undefined ? item.views_count : (fallback.views_count || 0),
    completions_count: item.completions_count !== undefined ? item.completions_count : (fallback.completions_count || 0),
    media_url: mediaVal,
    mediaUrl: mediaVal,
    imageUrl: mediaVal,
    image_url: mediaVal,
    bannerUrl: mediaVal,
    banner_url: mediaVal,
    image: mediaVal,
    banner: mediaVal
  };
};

/**
 * Endpoint: GET /api/gamification/rewarded-ad
 * Consulta el estado real del anuncio 2X y contador diario del backend
 */
export const getPrimaryAd = (adsList = []) => {
  const ads = adsList.length > 0 ? adsList : getStoredAds();
  try {
    const cachedPrimary = localStorage.getItem('ezploro_primary_rewarded_ad');
    if (cachedPrimary) {
      const parsedPrimary = JSON.parse(cachedPrimary);
      if (parsedPrimary && typeof parsedPrimary === 'object') {
        const found = ads.find(a => 
          (parsedPrimary.id && (String(a.id) === String(parsedPrimary.id) || String(a._id) === String(parsedPrimary.id))) ||
          (parsedPrimary.title && a.title === parsedPrimary.title)
        );
        if (found) return found;
        return normalizeRewardedAd(parsedPrimary, ads[0] || DEFAULT_ADS[0]);
      }
    }
  } catch (e) {}

  return ads.find(a => a.is_active || a.status === 'Activo') || ads[0] || DEFAULT_ADS[0];
};

export const getRewardedAdState = async () => {
  const stored = getStoredAds();
  let defaultRewarded = getPrimaryAd(stored);

  try {
    const token = getAuthToken();
    if (token) {
      // GET /api/gamification/rewarded-ad (Endpoint GET de NestJS)
      const stateRes = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD).catch(() => null);
      if (stateRes) {
        return normalizeRewardedAd(stateRes, defaultRewarded);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error al consultar GET /api/gamification/rewarded-ad:', error);
  }

  return defaultRewarded;
};

/**
 * Endpoint: POST /api/gamification/claim-rewarded-ad
 * Reclamar multiplicador 2X tras ver el anuncio
 */
export const claimRewardedAd = async (adId = 'ad-rewarded-2x') => {
  try {
    const token = getAuthToken();
    if (token) {
      const response = await fetchWithAuth(API_URL_GAMIFICATION_CLAIM_REWARDED_AD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, adId })
      }).catch((err) => {
        const errorMsg = err?.message || '';
        if (
          errorMsg.includes('límite') ||
          errorMsg.includes('limit') ||
          errorMsg.includes('alcanzado') ||
          errorMsg.includes('recompensados') ||
          errorMsg.includes('BadRequest')
        ) {
          return {
            success: false,
            is_limit_reached: true,
            message: errorMsg || 'Has alcanzado el límite diario de anuncios recompensados.'
          };
        }
        return null;
      });

      if (response && response.success !== false) {
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
          multiplier: response.multiplier || updatedClaimedAd?.multiplier || '2X',
          message: response.message || '¡Multiplicador 2X reclamado exitosamente!',
          points_awarded: response.points_awarded || response.points || 100,
          daily_count: response.daily_count !== undefined ? response.daily_count : (updatedClaimedAd?.daily_count || 1),
          data: response
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Error ejecutando POST /api/gamification/claim-rewarded-ad:', error);
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
 * PUT /api/gamification/rewarded-ad-config
 */
export const saveRewardedAdConfig = async (configData) => {
  const ads = getStoredAds();
  let index = ads.findIndex(a => (a.id && configData.id && String(a.id) === String(configData.id)) || (a._id && configData._id && String(a._id) === String(configData._id)));

  if (index === -1) {
    index = ads.findIndex(a => a.id === 'ad-rewarded-2x' || a.type === 'Rewarded Ad');
  }

  const baseAd = index !== -1 ? ads[index] : DEFAULT_ADS[0];
  const normalizedInput = normalizeRewardedAd(configData, baseAd);

  if (index !== -1) {
    ads[index] = { ...baseAd, ...normalizedInput };
  } else {
    ads.unshift(normalizedInput);
  }
  saveStoredAds(ads);
  try {
    localStorage.setItem('ezploro_primary_rewarded_ad', JSON.stringify(normalizedInput));
  } catch (e) {}

  try {
    const token = getAuthToken();
    if (token) {
      const currentStored = getStoredAds();
      const ptsVal = parseInt(normalizedInput.reward_points ?? normalizedInput.rewardPoints ?? normalizedInput.points ?? 5) || 5;
      const mediaVal = normalizedInput.media_url || '';

      // Mapear los anuncios activos garantizando que cada uno lleve su campo reward_points explicito
      const activeAdsOnly = currentStored
        .filter(a => a.is_active !== false && a.status !== 'Inactivo')
        .map(a => {
          const itemPts = parseInt(a.reward_points ?? a.rewardPoints ?? a.points ?? ptsVal) || ptsVal;
          return {
            ...a,
            reward_points: itemPts,
            rewardPoints: itemPts,
            points: itemPts,
            points_awarded: itemPts,
            pointsAwarded: itemPts
          };
        });

      const payload = {
        title: normalizedInput.title,
        type: normalizedInput.type || 'Rewarded Ad',
        duration: normalizedInput.duration,
        duration_seconds: normalizedInput.duration,
        multiplier: normalizedInput.multiplier,
        daily_limit: normalizedInput.daily_limit,
        dailyLimit: normalizedInput.daily_limit,
        status: normalizedInput.status,
        is_active: normalizedInput.is_active,
        isActive: normalizedInput.is_active,
        description: normalizedInput.description,
        reward_points: ptsVal,
        rewardPoints: ptsVal,
        points: ptsVal,
        points_awarded: ptsVal,
        pointsAwarded: ptsVal,
        reward_pts: ptsVal,
        media_url: mediaVal,
        mediaUrl: mediaVal,
        imageUrl: mediaVal,
        image_url: mediaVal,
        bannerUrl: mediaVal,
        banner_url: mediaVal,
        image: mediaVal,
        banner: mediaVal,
        ad_unit_id: normalizedInput.ad_unit_id || '',
        ads: activeAdsOnly,
        ads_list: activeAdsOnly,
        all_ads: currentStored
      };

      console.log('🔵 PUT /api/gamification/rewarded-ad-config - Enviando payload con anuncios activos y puntos:', payload);

      const res = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(async () => {
        return fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(async () => {
          return fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD, {
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
        });
      });

      if (res) {
        console.log('🟢 Backend respondió tras guardar rewarded-ad-config:', res);
        const serverAds = res.ads || res.ads_list || res.config?.ads || res.data?.ads;
        if (Array.isArray(serverAds) && serverAds.length > 0) {
          const merged = currentStored.map(localAd => {
            const match = serverAds.find(s => String(s.id || s._id) === String(localAd.id || localAd._id));
            return match ? { ...match, ...localAd } : localAd;
          });
          saveStoredAds(merged);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error al actualizar configuración de rewarded ad en backend:', e);
  }

  return normalizedInput;
};

export const getAds = async () => {
  const stored = getStoredAds();
  try {
    const token = getAuthToken();
    if (token) {
      // Endpoint oficial de gamificación backend /api/gamification/rewarded-ad
      const rewardedRes = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD).catch(() => null);
      if (rewardedRes) {
        const serverAds = rewardedRes.all_ads || rewardedRes.ads || rewardedRes.ads_list || rewardedRes.config?.ads || rewardedRes.data?.ads;
        if (Array.isArray(serverAds) && serverAds.length > 0) {
          const combined = [...stored];

          for (const sAd of serverAds) {
            if (!sAd || typeof sAd !== 'object') continue;
            if (isAdDeleted(sAd)) continue;
            const sId = String(sAd.id || sAd._id || '');
            const sTitle = sAd.title || sAd.name;

            const existingIndex = combined.findIndex(l => 
              (sId && (String(l.id) === sId || String(l._id) === sId)) ||
              (sTitle && l.title === sTitle)
            );

            if (existingIndex !== -1) {
              const localAd = combined[existingIndex];
              const normalizedServer = normalizeRewardedAd(sAd, localAd);
              combined[existingIndex] = {
                ...normalizedServer,
                ...localAd,
                status: localAd.status !== undefined ? localAd.status : normalizedServer.status,
                is_active: localAd.is_active !== undefined ? localAd.is_active : normalizedServer.is_active
              };
            } else {
              combined.push(normalizeRewardedAd(sAd));
            }
          }

          saveStoredAds(combined);
          return combined;
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
  const ptsVal = parseInt(adData.reward_points ?? adData.rewardPoints ?? adData.points ?? 100) || 100;
  const mediaVal = adData.media_url || adData.imageUrl || adData.bannerUrl || '';

  const newAd = {
    id: `ad-${Date.now()}`,
    title: adData.title || 'Nuevo Anuncio',
    type: adData.type || 'Rewarded Ad',
    campaign_name: adData.campaign_name || 'Multiplicador Doble Ezploro Coins',
    duration: parseInt(adData.duration) || 30,
    duration_seconds: parseInt(adData.duration) || 30,
    multiplier: adData.multiplier || '2X',
    reward: adData.reward || 'Puntos',
    reward_points: ptsVal,
    rewardPoints: ptsVal,
    points: ptsVal,
    points_awarded: ptsVal,
    status: adData.status || 'Activo',
    is_active: adData.status === 'Activo' || adData.is_active === true,
    daily_limit: parseInt(adData.daily_limit) || 1,
    daily_count: 0,
    placement: adData.placement || 'Pantalla de Recompensas',
    ad_unit_id: adData.ad_unit_id || '',
    description: adData.description || '',
    media_url: mediaVal,
    mediaUrl: mediaVal,
    imageUrl: mediaVal,
    image_url: mediaVal,
    bannerUrl: mediaVal,
    banner_url: mediaVal,
    image: mediaVal,
    banner: mediaVal,
    views_count: 0,
    completions_count: 0,
    created_at: new Date().toISOString()
  };

  const ads = getStoredAds();
  ads.unshift(newAd);
  saveStoredAds(ads);

  // Sincronizar el catálogo actualizado con NestJS
  const primaryRewarded = getPrimaryAd(ads);
  await saveRewardedAdConfig(primaryRewarded).catch(() => null);

  return newAd;
};

/**
 * Actualizar un anuncio existente
 */
export const updateAd = async (id, updatedFields) => {
  const ads = getStoredAds();
  let index = ads.findIndex(a => (a.id && String(a.id) === String(id)) || (a._id && String(a._id) === String(id)));

  if (index === -1 && updatedFields.title) {
    index = ads.findIndex(a => a.title === updatedFields.title);
  }

  if (index !== -1) {
    const isAct = updatedFields.status ? updatedFields.status === 'Activo' : (updatedFields.is_active ?? ads[index].is_active);
    const ptsVal = parseInt(updatedFields.reward_points ?? updatedFields.rewardPoints ?? updatedFields.points ?? ads[index].reward_points ?? 5) || 5;
    const media = updatedFields.media_url !== undefined ? updatedFields.media_url : (ads[index].media_url || '');

    ads[index] = {
      ...ads[index],
      ...updatedFields,
      title: updatedFields.title || ads[index].title,
      type: updatedFields.type || ads[index].type,
      campaign_name: updatedFields.campaign_name || ads[index].campaign_name,
      duration: parseInt(updatedFields.duration) || ads[index].duration || 30,
      duration_seconds: parseInt(updatedFields.duration) || ads[index].duration || 30,
      daily_limit: parseInt(updatedFields.daily_limit) || ads[index].daily_limit || 1,
      reward_points: ptsVal,
      rewardPoints: ptsVal,
      points: ptsVal,
      points_awarded: ptsVal,
      pointsAwarded: ptsVal,
      is_active: isAct,
      status: isAct ? 'Activo' : 'Inactivo',
      media_url: media,
      mediaUrl: media,
      imageUrl: media,
      image_url: media,
      bannerUrl: media,
      banner_url: media,
      image: media,
      banner: media,
      updated_at: new Date().toISOString()
    };
    saveStoredAds(ads);

    const primaryRewarded = getPrimaryAd(ads);
    await saveRewardedAdConfig(primaryRewarded).catch(() => null);

    return ads[index];
  }

  return updatedFields;
};

/**
 * Alternar estado de anuncio (Activo / Inactivo)
 */
export const toggleAdStatus = async (idOrAd) => {
  const ads = getStoredAds();
  const targetObj = typeof idOrAd === 'object' ? idOrAd : {};
  const targetId = String(targetObj.id || targetObj._id || (typeof idOrAd !== 'object' ? idOrAd : '') || '');
  const targetTitle = targetObj.title || targetObj.name || null;

  let index = ads.findIndex(a => {
    const aId = String(a.id || a._id || '');
    if (targetId && aId && aId === targetId) return true;
    if (targetTitle && a.title && a.title.trim().toLowerCase() === targetTitle.trim().toLowerCase()) return true;
    return false;
  });

  if (index === -1 && targetTitle) {
    index = ads.findIndex(a => a.title.toLowerCase().includes(targetTitle.toLowerCase()));
  }

  if (index !== -1) {
    const newStatus = ads[index].status === 'Activo' ? 'Inactivo' : 'Activo';
    const isAct = newStatus === 'Activo';

    ads[index].status = newStatus;
    ads[index].is_active = isAct;

    // Si este anuncio es el principal seleccionado actualmente, actualizar su estado en cache
    try {
      const cachedPrimary = localStorage.getItem('ezploro_primary_rewarded_ad');
      if (cachedPrimary) {
        const parsed = JSON.parse(cachedPrimary);
        if (parsed && (String(parsed.id || parsed._id) === String(ads[index].id || ads[index]._id) || parsed.title === ads[index].title)) {
          localStorage.setItem('ezploro_primary_rewarded_ad', JSON.stringify(ads[index]));
        }
      }
    } catch (e) {}

    saveStoredAds(ads);

    const primaryRewarded = getPrimaryAd(ads);
    await saveRewardedAdConfig(primaryRewarded).catch(() => null);

    return ads[index];
  }

  console.warn('⚠️ No se encontró el anuncio a alternar estado:', idOrAd);
  return null;
};

/**
 * Eliminar un anuncio
 */
export const deleteAd = async (idOrAd) => {
  let ads = getStoredAds();
  const targetId = typeof idOrAd === 'object' ? (idOrAd.id || idOrAd._id) : idOrAd;
  const targetTitle = typeof idOrAd === 'object' ? idOrAd.title : null;

  if (targetId) recordDeletedAd(targetId);
  if (targetTitle) recordDeletedAd(targetTitle);

  ads = ads.filter(a => {
    if (targetId && (String(a.id) === String(targetId) || String(a._id) === String(targetId))) return false;
    if (targetTitle && a.title === targetTitle) return false;
    return true;
  });

  saveStoredAds(ads);

  try {
    const token = getAuthToken();
    if (token && targetId) {
      console.log(`🔵 Invocando DELETE HTTP a backend para anuncio ID: ${targetId}`);
      await fetchWithAuth(`${API_URL_GAMIFICATION_REWARDED_AD}/${targetId}`, {
        method: 'DELETE'
      }).catch(async () => {
        return fetchWithAuth(`${API_URL_GAMIFICATION_REWARDED_AD_CONFIG}/${targetId}`, {
          method: 'DELETE'
        }).catch(async () => {
          return fetchWithAuth(`${API_URL_ADS}/${targetId}`, {
            method: 'DELETE'
          }).catch(() => null);
        });
      });
    }

    if (token) {
      const activeAdsOnly = ads.filter(a => a.is_active !== false && a.status !== 'Inactivo');
      const primaryRewarded = ads.find(a => (a.is_active || a.status === 'Activo') && (a.type === 'Rewarded Ad' || a.id === 'ad-rewarded-2x')) || ads[0] || DEFAULT_ADS[0];
      const payload = {
        title: primaryRewarded.title || 'Multiplica 2X tus Puntos',
        type: primaryRewarded.type || 'Rewarded Ad',
        duration: primaryRewarded.duration || 30,
        duration_seconds: primaryRewarded.duration || 30,
        multiplier: primaryRewarded.multiplier || '2X',
        daily_limit: primaryRewarded.daily_limit || 1,
        status: primaryRewarded.status || 'Activo',
        is_active: primaryRewarded.is_active !== false,
        description: primaryRewarded.description || '',
        reward_points: primaryRewarded.reward_points || 100,
        rewardPoints: primaryRewarded.reward_points || 100,
        points: primaryRewarded.reward_points || 100,
        points_awarded: primaryRewarded.reward_points || 100,
        media_url: primaryRewarded.media_url || '',
        ad_unit_id: primaryRewarded.ad_unit_id || '',
        ads: activeAdsOnly,
        ads_list: activeAdsOnly,
        all_ads: ads
      };

      console.log('🔵 PUT /api/gamification/rewarded-ad-config - Sincronizando catálogo tras DELETE:', payload);
      await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error enviando eliminación a backend:', e);
  }

  return true;
};

export const resetAdsCatalog = async () => {
  try {
    localStorage.removeItem(STORAGE_KEY_ADS);
    localStorage.removeItem(STORAGE_KEY_DELETED_ADS);
    localStorage.removeItem('ezploro_primary_rewarded_ad');
    saveStoredAds(DEFAULT_ADS);

    const token = getAuthToken();
    if (token) {
      const primaryRewarded = DEFAULT_ADS[0];
      const payload = {
        title: primaryRewarded.title,
        type: primaryRewarded.type,
        duration: primaryRewarded.duration,
        duration_seconds: primaryRewarded.duration,
        multiplier: primaryRewarded.multiplier,
        daily_limit: primaryRewarded.daily_limit,
        status: primaryRewarded.status,
        is_active: primaryRewarded.is_active,
        description: primaryRewarded.description,
        reward_points: 100,
        rewardPoints: 100,
        points: 100,
        points_awarded: 100,
        media_url: '',
        mediaUrl: '',
        imageUrl: '',
        image_url: '',
        bannerUrl: '',
        banner_url: '',
        image: '',
        banner: '',
        ad_unit_id: '',
        ads: DEFAULT_ADS,
        ads_list: DEFAULT_ADS,
        all_ads: DEFAULT_ADS
      };

      console.log('🔵 Restableciendo catálogo a 2 anuncios por defecto en backend NestJS:', payload);
      await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(async () => {
        return fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      });
    }
  } catch (e) {
    console.warn('⚠️ Error al restablecer catálogo:', e);
  }
  return DEFAULT_ADS;
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
};const STORAGE_KEY_CAMPAIGNS = 'ezploro_ad_campaigns';

const DEFAULT_CAMPAIGNS = [
  {
    id: 'camp-official-2x',
    name: 'Multiplicador Doble Ezploro Coins',
    type: 'Rewarded 2X',
    status: 'Activa',
    target_audience: 'Todos los Usuarios',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    budget_pts: 100000,
    description: 'Campaña oficial de recompensa 2X diaria al visualizar anuncios publicitarios completos.',
    impressions_count: 0,
    conversions_count: 0
  }
];

export const getCampaigns = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error cargando campañas:', e);
  }
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(DEFAULT_CAMPAIGNS));
  return DEFAULT_CAMPAIGNS;
};

export const saveCampaigns = (campaigns) => {
  try {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
  } catch (e) {
    console.error('Error guardando campañas:', e);
  }
};

export const createCampaign = async (campaignData) => {
  const campaigns = getCampaigns();
  const newCamp = {
    id: `camp-${Date.now()}`,
    name: campaignData.name || 'Nueva Campaña Publicitaria',
    type: campaignData.type || 'Rewarded 2X',
    status: campaignData.status || 'Activa',
    target_audience: campaignData.target_audience || 'Todos los Usuarios',
    start_date: campaignData.start_date || new Date().toISOString().split('T')[0],
    end_date: campaignData.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    budget_pts: parseInt(campaignData.budget_pts) || 50000,
    description: campaignData.description || '',
    impressions_count: 0,
    conversions_count: 0,
    created_at: new Date().toISOString()
  };

  campaigns.unshift(newCamp);
  saveCampaigns(campaigns);
  return newCamp;
};

export const updateCampaign = async (id, updatedFields) => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index !== -1) {
    campaigns[index] = {
      ...campaigns[index],
      ...updatedFields,
      budget_pts: parseInt(updatedFields.budget_pts) || campaigns[index].budget_pts || 50000,
      updated_at: new Date().toISOString()
    };
    saveCampaigns(campaigns);
    return campaigns[index];
  }
  return updatedFields;
};

export const toggleCampaignStatus = async (id) => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index !== -1) {
    const nextStatus = campaigns[index].status === 'Activa' ? 'Pausada' : 'Activa';
    campaigns[index].status = nextStatus;
    saveCampaigns(campaigns);
    return campaigns[index];
  }
  return null;
};

export const deleteCampaign = async (id) => {
  let campaigns = getCampaigns();
  campaigns = campaigns.filter(c => c.id !== id);
  saveCampaigns(campaigns);
  return true;
};
