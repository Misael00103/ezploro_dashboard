/**
 * dashboardGamificationService.js
 * Central Unificada de Servicios de Gamificación, Premios y Promociones.
 * Reutiliza una única fuente de verdad para evitar código duplicado.
 */
import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getActiveOffers,
  getOfferStats
} from './offerService';

import {
  getVipPassLevels,
  saveVipPassLevel
} from './vipPassService';

import {
  getDailyChestConfig,
  updateDailyChestConfig,
  getDailyRewardHistory
} from './dailyRewardsService';

import {
  getStreakConfig,
  updateStreakConfig
} from './streakService';

import {
  getAds,
  createAd,
  toggleAdStatus,
  deleteAd,
  getAdStats,
  getRewardedAdState,
  claimRewardedAd,
  saveRewardedAdConfig
} from './adsService';

export const dashboardGamificationService = {
  // 1. Promociones / Ofertas
  getAllOffers: getOffers,
  getActiveOffers: getActiveOffers,
  createOffer: createOffer,
  updateOffer: updateOffer,
  deleteOffer: deleteOffer,
  toggleOfferStatus: toggleOfferStatus,
  getOfferStats: getOfferStats,

  // 2. Pass VIP & Niveles
  getVipLevels: getVipPassLevels,
  createOrUpdateVipLevel: saveVipPassLevel,

  // 3. Cofre Místico & Premios Diarios
  getDailyChestConfig: getDailyChestConfig,
  updateDailyPrizeConfig: updateDailyChestConfig,
  getDailyRewardHistory: getDailyRewardHistory,

  // 4. Rachas Diarias
  getStreakConfig: getStreakConfig,
  updateStreakConfig: updateStreakConfig,

  // 5. Anuncios Rewarded 2X
  getAds: getAds,
  createAd: createAd,
  toggleAdStatus: toggleAdStatus,
  deleteAd: deleteAd,
  getAdStats: getAdStats,
  getRewardedAdState: getRewardedAdState,
  getRewardedAdConfig: getRewardedAdState,
  updateRewardedAdConfig: saveRewardedAdConfig,
  claimRewardedAd: claimRewardedAd,
  saveRewardedAdConfig: saveRewardedAdConfig
};

// Re-exportaciones individuales
export {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getVipPassLevels,
  saveVipPassLevel,
  getDailyChestConfig,
  updateDailyChestConfig,
  getDailyRewardHistory,
  getStreakConfig,
  updateStreakConfig,
  getAds,
  createAd,
  toggleAdStatus,
  deleteAd,
  getRewardedAdState,
  claimRewardedAd,
  saveRewardedAdConfig
};

export default dashboardGamificationService;

