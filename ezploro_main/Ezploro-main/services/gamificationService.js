// services/gamificationService.js
import api from './api';
import {
  API_URL_GAMIFICATION_ACTION,
  API_URL_GAMIFICATION_POINTS,
  API_URL_GAMIFICATION_REDEEM,
  API_URL_GAMIFICATION_HISTORY
} from '../config';

export const gamificationService = {
  registerAction: (actionData) => api.post(API_URL_GAMIFICATION_ACTION, actionData),
  getUserPoints: (userId) => api.get(API_URL_GAMIFICATION_POINTS.replace(':user_id', userId)),
  redeemPoints: (redeemData) => api.post(API_URL_GAMIFICATION_REDEEM, redeemData),
  getUserHistory: (userId) => api.get(API_URL_GAMIFICATION_HISTORY.replace(':user_id', userId)),
};