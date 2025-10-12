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
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      user_id: item.user_id,
      username: item.user?.username,
      display_name: item.user?.display_name,
      profile_picture: item.user?.profile_picture,
      count: parseInt(item.total_suscripciones || 0),
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error getting usuarios mas suscritos ranking:', error);
    return [];
  }
};

// Get ranking of users with most points
export const getRankingUsuariosMasPuntos = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_USUARIOS_MAS_PUNTOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      user_id: item.user_id,
      username: item.user?.username,
      display_name: item.user?.display_name,
      profile_picture: item.user?.profile_picture,
      count: parseInt(item.total_points || 0),
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error getting usuarios mas puntos ranking:', error);
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
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      user_id: item.user_id,
      username: item.user?.username,
      display_name: item.user?.display_name,
      profile_picture: item.user?.profile_picture,
      count: parseInt(item.total_likes_dados || 0),
      rank: index + 1
    }));
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
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      user_id: item.user_id,
      username: item.user?.username,
      display_name: item.user?.display_name,
      profile_picture: item.user?.profile_picture,
      count: parseInt(item.total_comentarios || 0),
      rank: index + 1
    }));
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
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      user_id: item.organizer_id,
      username: item.organizer?.username,
      display_name: item.organizer?.display_name,
      profile_picture: item.organizer?.profile_picture,
      count: parseInt(item.total_eventos_creados || 0),
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error getting usuarios mas eventos creados ranking:', error);
    // Return empty array on any error (including 500)
    return [];
  }
};

// Get ranking of events with most subscribers
export const getRankingEventosMasSuscritos = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_EVENTOS_MAS_SUSCRITOS}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      event_id: item.event_id,
      title: item.event?.title,
      cover_image: item.event?.cover_image,
      count: parseInt(item.total_suscriptores || 0),
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error getting eventos mas suscritos ranking:', error);
    return [];
  }
};

// Get ranking of events with most likes
export const getRankingEventosMasLikes = async (limit = 10) => {
  try {
    const url = `${API_URL_RANKINGS_EVENTOS_MAS_LIKES}?limit=${limit}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const data = response.data || response || [];
    // Transform backend response to match frontend expectations
    return data.map((item, index) => ({
      event_id: item.event_id,
      title: item.event?.title,
      cover_image: item.event?.cover_image,
      count: parseInt(item.total_likes || 0),
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error getting eventos mas likes ranking:', error);
    return [];
  }
};