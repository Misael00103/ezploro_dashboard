// services/utilityService.js
import api from './api';
import {
  API_URL_LOCATIONS,
  API_URL_TOOLS
} from '../config';

export const utilityService = {
  getLocations: () => api.get(API_URL_LOCATIONS),
  getTools: () => api.get(API_URL_TOOLS),
};