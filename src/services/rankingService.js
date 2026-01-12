import { fetchWithAuth } from './userService';
import { 
  API_URL_RANKINGS_USUARIOS_MAS_SUSCRITOS,
  API_URL_RANKINGS_USUARIOS_MAS_PUNTOS,
  API_URL_RANKINGS_USUARIOS_MAS_LIKES_DADOS,
  API_URL_RANKINGS_USUARIOS_MAS_COMENTARIOS,
  API_URL_RANKINGS_USUARIOS_MAS_EVENTOS_CREADOS,
  API_URL_RANKINGS_EVENTOS_MAS_SUSCRITOS,
  API_URL_RANKINGS_EVENTOS_MAS_LIKES
} from './config';

// Get ranking of users with most subscribers
export const getRankingUsuariosMasSuscritos = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_SUSCRITOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    // El backend retorna { success, message, data }
    const data = response.data || [];
    // El backend ya retorna el formato correcto
    return data;
  } catch (error) {
    console.error('Error getting usuarios mas suscritos ranking:', error);
    return [];
  }
};

// Get ranking of users with most points
export const getRankingUsuariosMasPuntos = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_PUNTOS}?limit=${limit}`;
    console.log('🔵 getRankingUsuariosMasPuntos - URL:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    console.log('🔵 getRankingUsuariosMasPuntos - Respuesta completa:', response);
    
    // El backend retorna { success, message, data }
    const data = response.data || [];
    console.log('🔵 getRankingUsuariosMasPuntos - Data extraída:', data);
    
    // El backend ya retorna el formato correcto
    return data;
  } catch (error) {
    console.error('🔴 Error getting usuarios mas puntos ranking:', error);
    console.error('🔴 Error stack:', error.stack);
    return [];
  }
};

// Get ranking of users who gave most likes
export const getRankingUsuariosMasLikesDados = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_LIKES_DADOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    // El backend retorna { success, message, data }
    const data = response.data || [];
    // El backend ya retorna el formato correcto
    return data;
  } catch (error) {
    console.error('Error getting usuarios mas likes dados ranking:', error);
    return [];
  }
};

// Get ranking of users with most comments
export const getRankingUsuariosMasComentarios = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_COMENTARIOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    // El backend retorna { success, message, data }
    const data = response.data || [];
    // El backend ya retorna el formato correcto
    return data;
  } catch (error) {
    console.error('Error getting usuarios mas comentarios ranking:', error);
    return [];
  }
};

// Get ranking of users who created most events
export const getRankingUsuariosMasEventosCreados = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_EVENTOS_CREADOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    // El backend retorna { success, message, data }
    const data = response.data || [];
    // El backend ya retorna el formato correcto
    return data;
  } catch (error) {
    console.error('Error getting usuarios mas eventos creados ranking:', error);
    return [];
  }
};

// Get ranking of events with most subscribers
export const getRankingEventosMasSuscritos = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_EVENTOS_MAS_SUSCRITOS}?limit=${limit}`;
    console.log('🔵 getRankingEventosMasSuscritos - URL:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    console.log('🔵 getRankingEventosMasSuscritos - Respuesta completa:', response);
    console.log('🔵 getRankingEventosMasSuscritos - Tipo de response:', typeof response);
    console.log('🔵 getRankingEventosMasSuscritos - Keys de response:', Object.keys(response));
    
    // El backend retorna { success, message, data }
    // Pero también puede retornar directamente el array
    let data = [];
    
    if (Array.isArray(response)) {
      console.log('🔵 getRankingEventosMasSuscritos - Response es array directo');
      data = response;
    } else if (response.data && Array.isArray(response.data)) {
      console.log('🔵 getRankingEventosMasSuscritos - Response.data es array');
      data = response.data;
    } else if (response.success && response.data) {
      console.log('🔵 getRankingEventosMasSuscritos - Response tiene success y data');
      data = Array.isArray(response.data) ? response.data : [];
    } else {
      console.warn('⚠️ getRankingEventosMasSuscritos - Estructura de respuesta desconocida');
    }
    
    console.log('🔵 getRankingEventosMasSuscritos - Data extraída:', data);
    console.log('🔵 getRankingEventosMasSuscritos - Cantidad de eventos:', data.length);
    
    if (data.length > 0) {
      console.log('🔵 getRankingEventosMasSuscritos - Primer evento:', data[0]);
    }
    
    return data;
  } catch (error) {
    console.error('🔴 Error getting eventos mas suscritos ranking:', error);
    console.error('🔴 Error stack:', error.stack);
    return [];
  }
};

// Get ranking of events with most likes
export const getRankingEventosMasLikes = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_EVENTOS_MAS_LIKES}?limit=${limit}`;
    console.log('🔵 getRankingEventosMasLikes - URL:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    
    console.log('🔵 getRankingEventosMasLikes - Respuesta completa:', response);
    console.log('🔵 getRankingEventosMasLikes - Tipo de response:', typeof response);
    console.log('🔵 getRankingEventosMasLikes - Keys de response:', Object.keys(response));
    
    // El backend retorna { success, message, data }
    // Pero también puede retornar directamente el array
    let data = [];
    
    if (Array.isArray(response)) {
      console.log('🔵 getRankingEventosMasLikes - Response es array directo');
      data = response;
    } else if (response.data && Array.isArray(response.data)) {
      console.log('🔵 getRankingEventosMasLikes - Response.data es array');
      data = response.data;
    } else if (response.success && response.data) {
      console.log('🔵 getRankingEventosMasLikes - Response tiene success y data');
      data = Array.isArray(response.data) ? response.data : [];
    } else {
      console.warn('⚠️ getRankingEventosMasLikes - Estructura de respuesta desconocida');
    }
    
    console.log('🔵 getRankingEventosMasLikes - Data extraída:', data);
    console.log('🔵 getRankingEventosMasLikes - Cantidad de eventos:', data.length);
    
    if (data.length > 0) {
      console.log('🔵 getRankingEventosMasLikes - Primer evento:', data[0]);
    }
    
    return data;
  } catch (error) {
    console.error('🔴 Error getting eventos mas likes ranking:', error);
    console.error('🔴 Error stack:', error.stack);
    return [];
  }
};