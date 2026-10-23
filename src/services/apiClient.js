import axios from 'axios';
import { BASE_URL } from './config';
import { getAuthToken } from './authService';

/**
 * Cliente Axios preconfigurado con baseURL y encabezados de autenticación JWT
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token de autenticación en cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo amigable de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Client Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
