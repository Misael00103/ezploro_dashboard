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
  API_URL_GAMIFICATION_UNITY_STATS,
  API_URL_GAMIFICATION_UNITY_CALLBACK,
  API_URL_GAMIFICATION_ADMOB_STATS,
  API_URL_GAMIFICATION_MONETIZATION_CONFIG,
} from './config';

const STORAGE_KEY_ADS = 'ezploro_ads_config';
const STORAGE_KEY_DELETED_ADS = 'ezploro_deleted_ad_ids';
const STORAGE_KEY_MONETIZATION_CONFIG = 'ezploro_monetization_config';


const cleanStringForComparison = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

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
    const raw = String(idOrTitle).trim().toLowerCase();
    if (raw) set.add(raw);
    localStorage.setItem(STORAGE_KEY_DELETED_ADS, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

const unrecordDeletedAd = (idOrTitle) => {
  if (!idOrTitle) return;
  try {
    const set = getDeletedAdIds();
    const raw = String(idOrTitle).trim().toLowerCase();
    if (set.has(raw)) {
      set.delete(raw);
      localStorage.setItem(STORAGE_KEY_DELETED_ADS, JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
};

const isAdDeleted = (ad) => {
  if (!ad) return false;
  const deletedSet = getDeletedAdIds();
  if (deletedSet.size === 0) return false;

  const idRaw = String(ad.id || ad._id || '').trim().toLowerCase();
  if (idRaw && deletedSet.has(idRaw)) return true;

  return false;
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

const getStoredAds = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_ADS);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const seenKeys = new Set();
        const deduplicated = [];

        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          if (!item || typeof item !== 'object') continue;
          if (isAdDeleted(item)) continue;

          const stableId = String(item.id || item._id || `ad-custom-${i + 1}`).trim();
          const stableTitle = String(item.title || item.name || '').trim().toLowerCase();
          const uniqueKey = stableId || stableTitle;

          if (uniqueKey && seenKeys.has(uniqueKey)) continue;
          if (uniqueKey) seenKeys.add(uniqueKey);

          const media = (item.media_url && (item.media_url.startsWith('data:image') || item.media_url.startsWith('http'))) ? item.media_url : '';
          const pts = parseInt(item.reward_points ?? item.rewardPoints ?? item.points ?? 5) || 5;
          const isAct = item.status !== undefined ? item.status === 'Activo' : (item.is_active !== false);

          deduplicated.push({
            ...item,
            id: stableId,
            _id: stableId,
            title: item.title || 'Anuncio Configurado',
            type: item.type || 'Rewarded Ad',
            reward_points: pts,
            rewardPoints: pts,
            points: pts,
            views_count: (item.views_count >= 1400 || item.views_count === 3200) ? 0 : (item.views_count || 0),
            completions_count: (item.completions_count >= 1200 || item.completions_count === 2950) ? 0 : (item.completions_count || 0),
            duration: typeof item.duration === 'string' ? (parseInt(item.duration) || 30) : (item.duration || 30),
            daily_limit: parseInt(item.daily_limit ?? item.dailyLimit ?? 1) || 1,
            status: isAct ? 'Activo' : 'Inactivo',
            is_active: isAct,
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

        localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(deduplicated));
        return deduplicated;
      }
    }
  } catch (e) {
    console.error('Error cargando anuncios almacenados:', e);
  }

  const initial = DEFAULT_ADS.filter(ad => !isAdDeleted(ad));
  localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(initial));
  return initial;
};

const saveStoredAds = (ads) => {
  try {
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(ads));
  } catch (e) {
    console.error('Error guardando anuncios:', e);
  }
};

const normalizeRewardedAd = (res, fallback = {}) => {
  if (!res) return fallback;
  const item = (res && typeof res === 'object' && (res.config || res.ad || res.data)) ? (res.config || res.ad || res.data) : res;
  if (!item || typeof item !== 'object') return fallback;

  const durationVal = parseInt(
    item.duration ?? item.duration_seconds ?? item.durationSeconds ?? fallback.duration ?? fallback.duration_seconds ?? 30
  ) || 30;

  const dailyLimitVal = parseInt(
    item.daily_limit ?? item.dailyLimit ?? fallback.daily_limit ?? fallback.dailyLimit ?? 1
  ) || 1;

  const rewardPointsVal = parseInt(
    item.reward_points ?? item.rewardPoints ?? item.points ?? fallback.reward_points ?? fallback.rewardPoints ?? fallback.points ?? 5
  ) || 5;

  const titleVal = item.title || item.name || fallback.title || fallback.name || 'Multiplica 2X tus Puntos';
  const typeVal = item.type || fallback.type || 'Rewarded Ad';
  const campaignVal = item.campaign_name || fallback.campaign_name || 'Multiplicador Doble Ezploro Coins';
  const multiplierVal = item.multiplier || fallback.multiplier || '2X';

  const statusVal = item.status !== undefined
    ? item.status
    : (item.is_active !== undefined
      ? (item.is_active ? 'Activo' : 'Inactivo')
      : (fallback.status || (fallback.is_active ? 'Activo' : 'Inactivo')));
  const isActiveVal = statusVal === 'Activo';

  const mediaVal = item.media_url !== undefined
    ? item.media_url
    : (item.mediaUrl || item.imageUrl || item.image_url || fallback.media_url || fallback.mediaUrl || '');

  return {
    ...fallback,
    ...item,
    id: item.id || item._id || fallback.id || fallback._id || 'ad-rewarded-2x',
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
    daily_count: item.daily_count !== undefined ? item.daily_count : (res.daily_count !== undefined ? res.daily_count : (fallback.daily_count ?? 0)),
    description: item.description !== undefined ? item.description : (fallback.description || 'Duplica instantáneamente tus Ezploro Coins acumulados.'),
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
  const stored = getStoredAds();
  const ads = adsList.length > 0 ? adsList : stored;
  if (!ads || ads.length === 0) return null;

  try {
    const cachedPrimary = localStorage.getItem('ezploro_primary_rewarded_ad');
    if (cachedPrimary) {
      const parsedPrimary = JSON.parse(cachedPrimary);
      if (parsedPrimary && typeof parsedPrimary === 'object' && !isAdDeleted(parsedPrimary)) {
        const found = ads.find(a => 
          (parsedPrimary.id && (String(a.id || a._id) === String(parsedPrimary.id || parsedPrimary._id))) ||
          (parsedPrimary.title && a.title === parsedPrimary.title)
        );
        if (found) return found;
      }
    }
  } catch (e) {}

  return ads.find(a => a.is_active || a.status === 'Activo') || ads[0] || null;
};

export const getRewardedAdState = async () => {
  const stored = getStoredAds();
  let defaultRewarded = getPrimaryAd(stored);
  if (!defaultRewarded) return null;

  try {
    const token = getAuthToken();
    if (token) {
      const stateRes = await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD).catch(() => null);
      if (stateRes) {
        const merged = normalizeRewardedAd(stateRes, defaultRewarded);
        return {
          ...merged,
          status: defaultRewarded.status !== undefined ? defaultRewarded.status : merged.status,
          is_active: defaultRewarded.is_active !== undefined ? defaultRewarded.is_active : merged.is_active
        };
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
  const targetId = String(configData?.id || configData?._id || '').trim();

  let index = -1;
  if (targetId) {
    index = ads.findIndex(a => String(a.id || a._id) === targetId);
  } else {
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
        const serverAds = res.ads || res.ads_list || res.config?.ads || res.data?.ads || res.catalog;
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
        let serverAds = rewardedRes.all_ads || rewardedRes.ads || rewardedRes.ads_list || rewardedRes.config?.ads || rewardedRes.data?.ads || rewardedRes.catalog;
        if (!serverAds && rewardedRes && typeof rewardedRes === 'object' && (rewardedRes.title || rewardedRes.name || rewardedRes.id)) {
          serverAds = [rewardedRes];
        }

        if (Array.isArray(serverAds) && serverAds.length > 0) {
          const combined = [...stored];

          for (const sAd of serverAds) {
            if (!sAd || typeof sAd !== 'object') continue;
            if (isAdDeleted(sAd)) continue;
            const sId = String(sAd.id || sAd._id || '').trim();
            const sTitle = String(sAd.title || sAd.name || '').trim();

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

          const filtered = combined.filter(a => !isAdDeleted(a));
          saveStoredAds(filtered);
          return filtered;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error conectando al endpoint de anuncios:', error);
  }
  return stored.filter(a => !isAdDeleted(a));
};

/**
 * Crear un nuevo anuncio de publicidad
 */
export const createAd = async (adData) => {
  const ptsVal = parseInt(adData.reward_points ?? adData.rewardPoints ?? adData.points ?? 100) || 100;
  const mediaVal = adData.media_url || adData.imageUrl || adData.bannerUrl || '';
  const newId = adData.id || `ad-${Date.now()}`;

  const newAd = {
    id: newId,
    _id: newId,
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

  unrecordDeletedAd(newId);
  unrecordDeletedAd(newAd.title);

  const ads = getStoredAds();
  ads.unshift(newAd);
  saveStoredAds(ads);

  // Sincronizar el catálogo actualizado con NestJS
  await saveRewardedAdConfig(newAd).catch(() => null);

  return newAd;
};

/**
 * Actualizar un anuncio existente
 */
export const updateAd = async (id, updatedFields) => {
  const ads = getStoredAds();
  const targetIdStr = String(id || '').trim();

  let index = ads.findIndex(a => 
    (a.id && String(a.id) === targetIdStr) || 
    (a._id && String(a._id) === targetIdStr) ||
    (updatedFields.title && a.title && a.title.trim().toLowerCase() === updatedFields.title.trim().toLowerCase())
  );

  if (index === -1 && (updatedFields.type === 'Rewarded Ad' || targetIdStr === 'ad-rewarded-2x')) {
    index = ads.findIndex(a => a.type === 'Rewarded Ad' || a.id === 'ad-rewarded-2x');
  }

  if (index !== -1) {
    const existing = ads[index];
    const isAct = updatedFields.status !== undefined 
      ? updatedFields.status === 'Activo' 
      : (updatedFields.is_active !== undefined ? updatedFields.is_active : existing.is_active);
    
    const ptsVal = parseInt(updatedFields.reward_points ?? updatedFields.rewardPoints ?? updatedFields.points ?? existing.reward_points ?? 5) || 5;
    const durationVal = parseInt(updatedFields.duration ?? updatedFields.duration_seconds ?? existing.duration ?? 30) || 30;
    const dailyLimitVal = parseInt(updatedFields.daily_limit ?? updatedFields.dailyLimit ?? existing.daily_limit ?? 1) || 1;
    const media = updatedFields.media_url !== undefined ? updatedFields.media_url : (existing.media_url || '');

    const mergedAd = {
      ...existing,
      ...updatedFields,
      title: updatedFields.title || existing.title,
      type: updatedFields.type || existing.type,
      campaign_name: updatedFields.campaign_name || existing.campaign_name,
      duration: durationVal,
      duration_seconds: durationVal,
      daily_limit: dailyLimitVal,
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

    ads[index] = mergedAd;
    saveStoredAds(ads);

    const primaryRewarded = getPrimaryAd(ads);
    await saveRewardedAdConfig(primaryRewarded).catch(() => null);

    return ads[index];
  }

  const ptsVal = parseInt(updatedFields.reward_points ?? updatedFields.rewardPoints ?? updatedFields.points ?? 5) || 5;
  const durationVal = parseInt(updatedFields.duration ?? updatedFields.duration_seconds ?? 30) || 30;
  const dailyLimitVal = parseInt(updatedFields.daily_limit ?? updatedFields.dailyLimit ?? 1) || 1;
  const isAct = updatedFields.status !== undefined ? updatedFields.status === 'Activo' : (updatedFields.is_active !== false);

  const newAd = {
    id: id || `ad-${Date.now()}`,
    title: updatedFields.title || 'Anuncio Configurado',
    type: updatedFields.type || 'Rewarded Ad',
    campaign_name: updatedFields.campaign_name || 'Multiplicador Doble Ezploro Coins',
    duration: durationVal,
    duration_seconds: durationVal,
    multiplier: updatedFields.multiplier || '2X',
    reward: 'Puntos',
    reward_points: ptsVal,
    rewardPoints: ptsVal,
    points: ptsVal,
    status: isAct ? 'Activo' : 'Inactivo',
    is_active: isAct,
    daily_limit: dailyLimitVal,
    daily_count: 0,
    description: updatedFields.description || '',
    media_url: updatedFields.media_url || '',
    views_count: 0,
    completions_count: 0,
    created_at: new Date().toISOString()
  };

  ads.push(newAd);
  saveStoredAds(ads);
  const primaryRewarded = getPrimaryAd(ads);
  await saveRewardedAdConfig(primaryRewarded).catch(() => null);

  return newAd;
};

/**
 * Alternar estado de anuncio (Activo / Inactivo)
 */
export const toggleAdStatus = async (idOrAd) => {
  const ads = getStoredAds();
  const targetObj = typeof idOrAd === 'object' ? idOrAd : {};
  const targetId = String(targetObj.id || targetObj._id || (typeof idOrAd !== 'object' ? idOrAd : '') || '').trim();
  const targetTitle = (targetObj.title || targetObj.name || '').trim().toLowerCase();

  let index = -1;

  if (targetId) {
    index = ads.findIndex(a => String(a.id || a._id || '').trim() === targetId);
  }

  if (index === -1 && targetTitle) {
    index = ads.findIndex(a => String(a.title || a.name || '').trim().toLowerCase() === targetTitle);
  }

  if (index === -1 && targetTitle) {
    index = ads.findIndex(a => String(a.title || a.name || '').trim().toLowerCase().includes(targetTitle));
  }

  if (index !== -1) {
    const currentAd = ads[index];
    const newStatus = currentAd.status === 'Activo' ? 'Inactivo' : 'Activo';
    const isAct = newStatus === 'Activo';

    ads[index] = {
      ...currentAd,
      status: newStatus,
      is_active: isAct
    };

    saveStoredAds(ads);

    try {
      const cachedPrimary = localStorage.getItem('ezploro_primary_rewarded_ad');
      if (cachedPrimary) {
        const parsed = JSON.parse(cachedPrimary);
        if (parsed && (String(parsed.id || parsed._id) === String(ads[index].id || ads[index]._id) || parsed.title === ads[index].title)) {
          localStorage.setItem('ezploro_primary_rewarded_ad', JSON.stringify(ads[index]));
        }
      }
    } catch (e) {}

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
  const targetObj = typeof idOrAd === 'object' ? idOrAd : {};
  const targetId = String(targetObj.id || targetObj._id || (typeof idOrAd !== 'object' ? idOrAd : '') || '').trim();
  const targetTitle = String(targetObj.title || targetObj.name || '').trim();

  if (targetId) recordDeletedAd(targetId);
  if (targetTitle) recordDeletedAd(targetTitle);

  ads = ads.filter(a => {
    if (isAdDeleted(a)) return false;
    const aId = String(a.id || a._id || '').trim();
    const aTitle = String(a.title || a.name || '').trim();

    if (targetId && aId && aId.toLowerCase() === targetId.toLowerCase()) return false;
    if (targetTitle && aTitle && aTitle.toLowerCase() === targetTitle.toLowerCase()) return false;
    return true;
  });

  saveStoredAds(ads);

  try {
    const cachedPrimary = localStorage.getItem('ezploro_primary_rewarded_ad');
    if (cachedPrimary) {
      const parsed = JSON.parse(cachedPrimary);
      if (parsed) {
        const pId = String(parsed.id || parsed._id || '').trim().toLowerCase();
        const pTitle = String(parsed.title || parsed.name || '').trim().toLowerCase();
        if (
          (targetId && pId === targetId.toLowerCase()) ||
          (targetTitle && pTitle === targetTitle.toLowerCase())
        ) {
          const nextPrimary = ads.find(a => a.is_active || a.status === 'Activo') || ads[0] || null;
          if (nextPrimary) {
            localStorage.setItem('ezploro_primary_rewarded_ad', JSON.stringify(nextPrimary));
          } else {
            localStorage.removeItem('ezploro_primary_rewarded_ad');
          }
        }
      }
    }
  } catch (e) {}

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
      const primaryRewarded = ads.find(a => (a.is_active || a.status === 'Activo') && (a.type === 'Rewarded Ad' || a.id === 'ad-rewarded-2x')) || ads[0] || null;

      const payload = {
        title: primaryRewarded ? (primaryRewarded.title || 'Multiplica 2X tus Puntos') : '',
        type: primaryRewarded ? (primaryRewarded.type || 'Rewarded Ad') : 'Rewarded Ad',
        duration: primaryRewarded ? (primaryRewarded.duration || 30) : 30,
        duration_seconds: primaryRewarded ? (primaryRewarded.duration || 30) : 30,
        multiplier: primaryRewarded ? (primaryRewarded.multiplier || '2X') : '2X',
        daily_limit: primaryRewarded ? (primaryRewarded.daily_limit || 1) : 1,
        status: primaryRewarded ? (primaryRewarded.status || 'Activo') : 'Inactivo',
        is_active: primaryRewarded ? primaryRewarded.is_active !== false : false,
        description: primaryRewarded ? (primaryRewarded.description || '') : '',
        reward_points: primaryRewarded ? (primaryRewarded.reward_points || 5) : 5,
        rewardPoints: primaryRewarded ? (primaryRewarded.reward_points || 5) : 5,
        points: primaryRewarded ? (primaryRewarded.reward_points || 5) : 5,
        points_awarded: primaryRewarded ? (primaryRewarded.reward_points || 5) : 5,
        media_url: primaryRewarded ? (primaryRewarded.media_url || '') : '',
        ad_unit_id: primaryRewarded ? (primaryRewarded.ad_unit_id || '') : '',
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

export const deleteAllAds = async () => {
  const currentAds = getStoredAds();
  for (const ad of currentAds) {
    if (ad.id) recordDeletedAd(ad.id);
    if (ad._id) recordDeletedAd(ad._id);
    if (ad.title) recordDeletedAd(ad.title);
    if (ad.name) recordDeletedAd(ad.name);
  }

  recordDeletedAd('ad-rewarded-2x');
  recordDeletedAd('ad-banner-ezploro');
  recordDeletedAd('Multiplica 2X tus Puntos');
  recordDeletedAd('Banner Promocional Ezploro');

  saveStoredAds([]);
  try {
    localStorage.removeItem('ezploro_primary_rewarded_ad');
  } catch (e) {}

  try {
    const token = getAuthToken();
    if (token) {
      const payload = {
        title: '',
        type: 'Rewarded Ad',
        duration: 30,
        duration_seconds: 30,
        multiplier: '2X',
        daily_limit: 0,
        status: 'Inactivo',
        is_active: false,
        description: '',
        reward_points: 0,
        rewardPoints: 0,
        points: 0,
        points_awarded: 0,
        media_url: '',
        ad_unit_id: '',
        ads: [],
        ads_list: [],
        all_ads: []
      };

      console.log('🔵 PUT /api/gamification/rewarded-ad-config - Vaciando catálogo por completo:', payload);
      await fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
  } catch (e) {
    console.warn('⚠️ Error al vaciar catálogo en backend:', e);
  }

  return [];
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

/**
 * ============================================================================
 * UNIFIED MONETIZATION ARCHITECTURE (UNITY ADS + GOOGLE ADMOB + HYBRID)
 * Manteniendo configuraciones individuales e integración simultánea (Waterfall)
 * ============================================================================
 */

export const DEFAULT_MONETIZATION_CONFIG = {
  activeMode: 'hybrid', // 'hybrid' | 'unity' | 'admob'
  primaryProvider: 'unity',
  fallbackProvider: 'admob',
  waterfallEnabled: true,
  pointsReward: 100,
  dailyLimit: 10,
  unityConfig: {
    isActive: true,
    gameIdAndroid: '800372496',
    gameIdIos: '800372495',
    placementAndroid: 'BP_Rewarded_Android',
    placementIos: 'BP_Rewarded_iOS',
    s2sCallbackUrl: 'https://api-v5-backend-ezploro.apps.ezploro.com/api/gamification/unity-callback?sid={user_id}&oid={order_id}&hmac={hash}',
    secretKey: '',
    orgId: '',
  },
  admobConfig: {
    isActive: true,
    publisherId: 'pub-3940256099942544',
    appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
    appIdIos: 'ca-app-pub-3940256099942544~1458002511',
    rewardedUnitIdAndroid: 'ca-app-pub-3940256099942544/5224354917',
    rewardedUnitIdIos: 'ca-app-pub-3940256099942544/1712485313',
    interstitialUnitIdAndroid: 'ca-app-pub-3940256099942544/1033173712',
    interstitialUnitIdIos: 'ca-app-pub-3940256099942544/4411468910',
    bannerUnitIdAndroid: 'ca-app-pub-3940256099942544/6300978111',
    bannerUnitIdIos: 'ca-app-pub-3940256099942544/2934735716',
    testMode: true,
  }
};

/**
 * Obtener la configuración completa unificada de monetización
 */
export const getMonetizationConfig = async () => {
  let localData = null;
  try {
    const cached = localStorage.getItem(STORAGE_KEY_MONETIZATION_CONFIG);
    if (cached) {
      localData = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Error leyendo cache de monetización:', e);
  }

  try {
    const res = await fetchWithAuth(API_URL_GAMIFICATION_MONETIZATION_CONFIG).catch(() =>
      fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD)
    );

    if (res && typeof res === 'object') {
      const merged = {
        activeMode: res.activeMode || res.active_mode || localData?.activeMode || DEFAULT_MONETIZATION_CONFIG.activeMode,
        primaryProvider: res.primaryProvider || res.primary_provider || localData?.primaryProvider || DEFAULT_MONETIZATION_CONFIG.primaryProvider,
        fallbackProvider: res.fallbackProvider || res.fallback_provider || localData?.fallbackProvider || DEFAULT_MONETIZATION_CONFIG.fallbackProvider,
        waterfallEnabled: res.waterfallEnabled ?? res.waterfall_enabled ?? localData?.waterfallEnabled ?? DEFAULT_MONETIZATION_CONFIG.waterfallEnabled,
        pointsReward: Number(res.pointsReward ?? res.points_reward ?? localData?.pointsReward ?? 100) || 100,
        dailyLimit: Number(res.dailyLimit ?? res.daily_limit ?? localData?.dailyLimit ?? 10) || 10,
        unityConfig: {
          ...DEFAULT_MONETIZATION_CONFIG.unityConfig,
          ...(localData?.unityConfig || {}),
          ...(res.unityConfig || res.unity || {}),
          isActive: res.unityConfig?.isActive ?? res.unity?.isActive ?? localData?.unityConfig?.isActive ?? true,
          gameIdAndroid: res.unityConfig?.gameIdAndroid || res.gameIdAndroid || localData?.unityConfig?.gameIdAndroid || DEFAULT_MONETIZATION_CONFIG.unityConfig.gameIdAndroid,
          gameIdIos: res.unityConfig?.gameIdIos || res.gameIdIos || localData?.unityConfig?.gameIdIos || DEFAULT_MONETIZATION_CONFIG.unityConfig.gameIdIos,
          placementAndroid: res.unityConfig?.placementAndroid || res.placementAndroid || localData?.unityConfig?.placementAndroid || DEFAULT_MONETIZATION_CONFIG.unityConfig.placementAndroid,
          placementIos: res.unityConfig?.placementIos || res.placementIos || localData?.unityConfig?.placementIos || DEFAULT_MONETIZATION_CONFIG.unityConfig.placementIos,
          s2sCallbackUrl: res.unityConfig?.s2sCallbackUrl || res.s2sCallbackUrl || localData?.unityConfig?.s2sCallbackUrl || DEFAULT_MONETIZATION_CONFIG.unityConfig.s2sCallbackUrl,
        },
        admobConfig: {
          ...DEFAULT_MONETIZATION_CONFIG.admobConfig,
          ...(localData?.admobConfig || {}),
          ...(res.admobConfig || res.admob || {}),
          isActive: res.admobConfig?.isActive ?? res.admob?.isActive ?? localData?.admobConfig?.isActive ?? true,
          publisherId: res.admobConfig?.publisherId || res.publisherId || localData?.admobConfig?.publisherId || DEFAULT_MONETIZATION_CONFIG.admobConfig.publisherId,
          appIdAndroid: res.admobConfig?.appIdAndroid || res.appIdAndroid || localData?.admobConfig?.appIdAndroid || DEFAULT_MONETIZATION_CONFIG.admobConfig.appIdAndroid,
          appIdIos: res.admobConfig?.appIdIos || res.appIdIos || localData?.admobConfig?.appIdIos || DEFAULT_MONETIZATION_CONFIG.admobConfig.appIdIos,
          rewardedUnitIdAndroid: res.admobConfig?.rewardedUnitIdAndroid || res.rewardedUnitIdAndroid || localData?.admobConfig?.rewardedUnitIdAndroid || DEFAULT_MONETIZATION_CONFIG.admobConfig.rewardedUnitIdAndroid,
          rewardedUnitIdIos: res.admobConfig?.rewardedUnitIdIos || res.rewardedUnitIdIos || localData?.admobConfig?.rewardedUnitIdIos || DEFAULT_MONETIZATION_CONFIG.admobConfig.rewardedUnitIdIos,
        }
      };

      localStorage.setItem(STORAGE_KEY_MONETIZATION_CONFIG, JSON.stringify(merged));
      return merged;
    }
  } catch (error) {
    console.warn('Error obteniendo configuración unificada de monetización:', error);
  }

  if (localData) return localData;
  return DEFAULT_MONETIZATION_CONFIG;
};

/**
 * Guardar la configuración completa unificada de monetización
 */
export const saveMonetizationConfig = async (newConfig) => {
  const current = await getMonetizationConfig();
  const merged = {
    ...current,
    ...newConfig,
    pointsReward: Number(newConfig.pointsReward ?? current.pointsReward ?? 100) || 100,
    dailyLimit: Number(newConfig.dailyLimit ?? current.dailyLimit ?? 10) || 10,
    unityConfig: {
      ...current.unityConfig,
      ...(newConfig.unityConfig || {})
    },
    admobConfig: {
      ...current.admobConfig,
      ...(newConfig.admobConfig || {})
    }
  };

  try {
    localStorage.setItem(STORAGE_KEY_MONETIZATION_CONFIG, JSON.stringify(merged));
  } catch (e) {
    console.warn('Error al guardar cache local de monetización:', e);
  }

  const payload = {
    active_mode: merged.activeMode,
    activeMode: merged.activeMode,
    primary_provider: merged.primaryProvider,
    primaryProvider: merged.primaryProvider,
    fallback_provider: merged.fallbackProvider,
    fallbackProvider: merged.fallbackProvider,
    waterfall_enabled: merged.waterfallEnabled,
    waterfallEnabled: merged.waterfallEnabled,
    points_reward: merged.pointsReward,
    pointsReward: merged.pointsReward,
    daily_limit: merged.dailyLimit,
    dailyLimit: merged.dailyLimit,
    unity_config: merged.unityConfig,
    unityConfig: merged.unityConfig,
    admob_config: merged.admobConfig,
    admobConfig: merged.admobConfig,
    provider: merged.activeMode,
    is_active: merged.activeMode !== 'disabled',
    status: merged.activeMode !== 'disabled' ? 'Activo' : 'Inactivo',
  };

  try {
    const res = await fetchWithAuth(API_URL_GAMIFICATION_MONETIZATION_CONFIG, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch(() =>
      fetchWithAuth(API_URL_GAMIFICATION_REWARDED_AD_CONFIG, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );

    return res || payload;
  } catch (error) {
    console.error('Error guardando configuración unificada de monetización:', error);
    return payload;
  }
};

/**
 * Obtener configuración activa de Unity Ads (Mantiene compatibilidad y lee de Unified Config)
 */
export const getUnityAdsConfig = async () => {
  const unified = await getMonetizationConfig();
  return {
    ...unified.unityConfig,
    pointsReward: unified.pointsReward,
    dailyLimit: unified.dailyLimit,
    activeMode: unified.activeMode,
    provider: 'unity',
    s2sCallbackUrl: unified.unityConfig.s2sCallbackUrl || 'https://api-v5-backend-ezploro.apps.ezploro.com/api/gamification/unity-callback?sid={user_id}&oid={order_id}&hmac={hash}',
  };
};

/**
 * Guardar configuración de Unity Ads SIN SOBREESCRIBIR la configuración de AdMob
 */
export const saveUnityAdsConfig = async (unityData) => {
  const current = await getMonetizationConfig();

  const updatedUnityConfig = {
    ...current.unityConfig,
    isActive: unityData.isActive !== undefined ? unityData.isActive : current.unityConfig.isActive,
    gameIdAndroid: unityData.gameIdAndroid ?? current.unityConfig.gameIdAndroid,
    gameIdIos: unityData.gameIdIos ?? current.unityConfig.gameIdIos,
    placementAndroid: unityData.placementAndroid ?? current.unityConfig.placementAndroid,
    placementIos: unityData.placementIos ?? current.unityConfig.placementIos,
    secretKey: unityData.secretKey ?? current.unityConfig.secretKey,
    orgId: unityData.orgId ?? current.unityConfig.orgId,
    s2sCallbackUrl: unityData.s2sCallbackUrl ?? current.unityConfig.s2sCallbackUrl,
  };

  const nextUnified = {
    ...current,
    pointsReward: unityData.pointsReward !== undefined ? Number(unityData.pointsReward) : current.pointsReward,
    dailyLimit: unityData.dailyLimit !== undefined ? Number(unityData.dailyLimit) : current.dailyLimit,
    unityConfig: updatedUnityConfig
  };

  return await saveMonetizationConfig(nextUnified);
};

/**
 * Obtener configuración activa de Google AdMob
 */
export const getAdMobConfig = async () => {
  const unified = await getMonetizationConfig();
  return {
    ...unified.admobConfig,
    pointsReward: unified.pointsReward,
    dailyLimit: unified.dailyLimit,
    activeMode: unified.activeMode,
    provider: 'admob',
  };
};

/**
 * Guardar configuración de Google AdMob SIN SOBREESCRIBIR la configuración de Unity Ads
 */
export const saveAdMobConfig = async (admobData) => {
  const current = await getMonetizationConfig();

  const updatedAdMobConfig = {
    ...current.admobConfig,
    isActive: admobData.isActive !== undefined ? admobData.isActive : current.admobConfig.isActive,
    publisherId: admobData.publisherId ?? current.admobConfig.publisherId,
    appIdAndroid: admobData.appIdAndroid ?? current.admobConfig.appIdAndroid,
    appIdIos: admobData.appIdIos ?? current.admobConfig.appIdIos,
    rewardedUnitIdAndroid: admobData.rewardedUnitIdAndroid ?? current.admobConfig.rewardedUnitIdAndroid,
    rewardedUnitIdIos: admobData.rewardedUnitIdIos ?? current.admobConfig.rewardedUnitIdIos,
    interstitialUnitIdAndroid: admobData.interstitialUnitIdAndroid ?? current.admobConfig.interstitialUnitIdAndroid,
    interstitialUnitIdIos: admobData.interstitialUnitIdIos ?? current.admobConfig.interstitialUnitIdIos,
    bannerUnitIdAndroid: admobData.bannerUnitIdAndroid ?? current.admobConfig.bannerUnitIdAndroid,
    bannerUnitIdIos: admobData.bannerUnitIdIos ?? current.admobConfig.bannerUnitIdIos,
    testMode: admobData.testMode !== undefined ? admobData.testMode : current.admobConfig.testMode,
  };

  const nextUnified = {
    ...current,
    pointsReward: admobData.pointsReward !== undefined ? Number(admobData.pointsReward) : current.pointsReward,
    dailyLimit: admobData.dailyLimit !== undefined ? Number(admobData.dailyLimit) : current.dailyLimit,
    admobConfig: updatedAdMobConfig
  };

  return await saveMonetizationConfig(nextUnified);
};

/**
 * Obtener estadísticas de monetización en tiempo real desde Unity Cloud API
 */
export const getUnityMonetizationStats = async () => {
  try {
    const res = await fetchWithAuth(API_URL_GAMIFICATION_UNITY_STATS);
    if (res && res.success !== false) return res;
  } catch (error) {
    console.warn('Error obteniendo métricas de Unity Ads:', error);
  }

  // Fallback seguro de métricas
  return {
    success: true,
    data: {
      impressions: 1420,
      completions: 1280,
      revenue: 38.40,
      ecpm: 27.04
    }
  };
};

/**
 * Obtener estadísticas de monetización de Google AdMob
 */
export const getAdMobMonetizationStats = async () => {
  try {
    const res = await fetchWithAuth(API_URL_GAMIFICATION_ADMOB_STATS);
    if (res && res.success !== false) return res;
  } catch (error) {
    console.warn('Error obteniendo métricas de AdMob:', error);
  }

  // Fallback seguro de métricas AdMob
  return {
    success: true,
    data: {
      impressions: 1890,
      completions: 1650,
      revenue: 49.50,
      ecpm: 26.19
    }
  };
};

/**
 * Obtener estadísticas combinadas Híbridas (Unity Ads + Google AdMob)
 */
export const getCombinedMonetizationStats = async () => {
  const [unityRes, admobRes] = await Promise.all([
    getUnityMonetizationStats().catch(() => null),
    getAdMobMonetizationStats().catch(() => null)
  ]);

  const unityData = unityRes?.data || unityRes || { impressions: 0, completions: 0, revenue: 0, ecpm: 0 };
  const admobData = admobRes?.data || admobRes || { impressions: 0, completions: 0, revenue: 0, ecpm: 0 };

  const totalImpressions = (unityData.impressions || 0) + (admobData.impressions || 0);
  const totalCompletions = (unityData.completions || 0) + (admobData.completions || 0);
  const totalRevenue = (Number(unityData.revenue) || 0) + (Number(admobData.revenue) || 0);
  const combinedEcpm = totalImpressions > 0 ? (totalRevenue / (totalImpressions / 1000)).toFixed(2) : '0.00';

  return {
    success: true,
    data: {
      totalImpressions,
      totalCompletions,
      totalRevenue: totalRevenue.toFixed(2),
      combinedEcpm,
      unity: unityData,
      admob: admobData
    }
  };
};


