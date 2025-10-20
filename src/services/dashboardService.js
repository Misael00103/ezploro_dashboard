// dashboardService.js - Servicio específico para el Dashboard
import { 
  BASE_URL, 
  DASHBOARD_CONFIG,
  API_URL_ADMIN,
  API_URL_USERS,
  API_URL_POSTS_ALL,
  API_URL_EVENTS,
  API_URL_CONTACT
} from './config';
import { getAuthToken, isAdmin } from './authService';
import { fetchWithAuth } from './userService';

/**
 * Obtiene estadísticas generales del dashboard
 * @returns {Promise<Object>} Estadísticas del dashboard
 */
export const getDashboardStats = async () => {
  try {
    if (!isAdmin()) {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }

    // Obtener estadísticas de diferentes endpoints
    const [usersStats, postsStats, eventsStats, contactStats] = await Promise.allSettled([
      getUsersStats(),
      getPostsStats(),
      getEventsStats(),
      getContactStats()
    ]);

    return {
      users: usersStats.status === 'fulfilled' ? usersStats.value : { total: 0, active: 0, new: 0 },
      posts: postsStats.status === 'fulfilled' ? postsStats.value : { total: 0, today: 0, thisWeek: 0 },
      events: eventsStats.status === 'fulfilled' ? eventsStats.value : { total: 0, upcoming: 0, active: 0 },
      contacts: contactStats.status === 'fulfilled' ? contactStats.value : { total: 0, pending: 0, resolved: 0 },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de usuarios
 * @returns {Promise<Object>} Estadísticas de usuarios
 */
export const getUsersStats = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL_USERS}`, {
      method: 'GET',
    });
    
    const users = response.data || response || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: users.length,
      active: users.filter(user => user.is_active !== false).length,
      new: users.filter(user => new Date(user.created_at) >= weekAgo).length,
      today: users.filter(user => new Date(user.created_at) >= today).length,
      byRole: users.reduce((acc, user) => {
        acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting users stats:', error);
    return { total: 0, active: 0, new: 0, today: 0, byRole: {} };
  }
};

/**
 * Obtiene estadísticas de posts
 * @returns {Promise<Object>} Estadísticas de posts
 */
export const getPostsStats = async () => {
  try {
    const response = await fetchWithAuth(API_URL_POSTS_ALL, {
      method: 'GET',
    });
    
    const posts = response.data || response || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: posts.length,
      today: posts.filter(post => new Date(post.created_at) >= today).length,
      thisWeek: posts.filter(post => new Date(post.created_at) >= weekAgo).length,
      withImages: posts.filter(post => post.image).length,
      totalLikes: posts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
      totalComments: posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    };
  } catch (error) {
    console.error('Error getting posts stats:', error);
    return { total: 0, today: 0, thisWeek: 0, withImages: 0, totalLikes: 0, totalComments: 0 };
  }
};

/**
 * Obtiene estadísticas de eventos
 * @returns {Promise<Object>} Estadísticas de eventos
 */
export const getEventsStats = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL_EVENTS}`, {
      method: 'GET',
    });
    
    const events = response.data || response || [];
    const now = new Date();

    return {
      total: events.length,
      upcoming: events.filter(event => new Date(event.date) > now).length,
      active: events.filter(event => event.status === 'active').length,
      past: events.filter(event => new Date(event.date) < now).length,
      byCategory: events.reduce((acc, event) => {
        acc[event.category || 'other'] = (acc[event.category || 'other'] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting events stats:', error);
    return { total: 0, upcoming: 0, active: 0, past: 0, byCategory: {} };
  }
};

/**
 * Obtiene estadísticas de contactos
 * @returns {Promise<Object>} Estadísticas de contactos
 */
export const getContactStats = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL_CONTACT}`, {
      method: 'GET',
    });
    
    const contacts = response.data || response || [];

    return {
      total: contacts.length,
      pending: contacts.filter(contact => contact.status === 'pending').length,
      resolved: contacts.filter(contact => contact.status === 'resolved').length,
      inProgress: contacts.filter(contact => contact.status === 'in_progress').length,
    };
  } catch (error) {
    console.error('Error getting contact stats:', error);
    return { total: 0, pending: 0, resolved: 0, inProgress: 0 };
  }
};

/**
 * Obtiene datos para gráficos del dashboard
 * @param {string} type - Tipo de gráfico (users, posts, events)
 * @param {string} period - Período (7d, 30d, 90d)
 * @returns {Promise<Array>} Datos para el gráfico
 */
export const getChartData = async (type, period = '7d') => {
  try {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      let count = 0;
      
      switch (type) {
        case 'users':
          count = await getUsersCountByDate(date);
          break;
        case 'posts':
          count = await getPostsCountByDate(date);
          break;
        case 'events':
          count = await getEventsCountByDate(date);
          break;
        default:
          count = 0;
      }

      data.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  } catch (error) {
    console.error('Error getting chart data:', error);
    return [];
  }
};

/**
 * Obtiene el conteo de usuarios por fecha
 * @param {Date} date - Fecha a consultar
 * @returns {Promise<number>} Número de usuarios creados en esa fecha
 */
const getUsersCountByDate = async (date) => {
  try {
    const response = await fetchWithAuth(`${API_URL_USERS}`, {
      method: 'GET',
    });
    
    const users = response.data || response || [];
    const targetDate = date.toISOString().split('T')[0];
    
    return users.filter(user => 
      user.created_at && user.created_at.startsWith(targetDate)
    ).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Obtiene el conteo de posts por fecha
 * @param {Date} date - Fecha a consultar
 * @returns {Promise<number>} Número de posts creados en esa fecha
 */
const getPostsCountByDate = async (date) => {
  try {
    const response = await fetchWithAuth(API_URL_POSTS_ALL, {
      method: 'GET',
    });
    
    const posts = response.data || response || [];
    const targetDate = date.toISOString().split('T')[0];
    
    return posts.filter(post => 
      post.created_at && post.created_at.startsWith(targetDate)
    ).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Obtiene el conteo de eventos por fecha
 * @param {Date} date - Fecha a consultar
 * @returns {Promise<number>} Número de eventos creados en esa fecha
 */
const getEventsCountByDate = async (date) => {
  try {
    const response = await fetchWithAuth(`${API_URL_EVENTS}`, {
      method: 'GET',
    });
    
    const events = response.data || response || [];
    const targetDate = date.toISOString().split('T')[0];
    
    return events.filter(event => 
      event.created_at && event.created_at.startsWith(targetDate)
    ).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Obtiene actividad reciente del sistema
 * @param {number} limit - Número máximo de actividades a obtener
 * @returns {Promise<Array>} Lista de actividades recientes
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    const activities = [];

    // Obtener posts recientes
    const postsResponse = await fetchWithAuth(API_URL_POSTS_ALL, {
      method: 'GET',
    });
    const posts = (postsResponse.data || postsResponse || []).slice(0, 3);
    
    posts.forEach(post => {
      activities.push({
        id: `post-${post.post_id}`,
        type: 'post',
        action: 'created',
        user: post.user?.display_name || post.user?.username || 'Usuario',
        target: post.title,
        timestamp: post.created_at,
        icon: 'post'
      });
    });

    // Obtener usuarios recientes
    const usersResponse = await fetchWithAuth(`${API_URL_USERS}`, {
      method: 'GET',
    });
    const users = (usersResponse.data || usersResponse || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);
    
    users.forEach(user => {
      activities.push({
        id: `user-${user.user_id}`,
        type: 'user',
        action: 'registered',
        user: user.display_name || user.username,
        target: 'cuenta nueva',
        timestamp: user.created_at,
        icon: 'user'
      });
    });

    // Ordenar por timestamp y limitar
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

/**
 * Obtiene el estado del sistema
 * @returns {Promise<Object>} Estado del sistema
 */
export const getSystemHealth = async () => {
  try {
    const startTime = Date.now();
    
    // Hacer una petición simple para verificar conectividad
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    }).catch(() => null);

    const responseTime = Date.now() - startTime;
    
    return {
      status: response && response.ok ? 'healthy' : 'degraded',
      responseTime,
      timestamp: new Date().toISOString(),
      services: {
        api: response && response.ok ? 'up' : 'down',
        database: 'up', // Asumir que está up si la API responde
        storage: 'up'   // Asumir que está up si la API responde
      }
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      status: 'error',
      responseTime: null,
      timestamp: new Date().toISOString(),
      services: {
        api: 'down',
        database: 'unknown',
        storage: 'unknown'
      },
      error: error.message
    };
  }
};

/**
 * Exporta datos del dashboard en formato CSV
 * @param {string} type - Tipo de datos a exportar (users, posts, events)
 * @returns {Promise<string>} Datos en formato CSV
 */
export const exportDashboardData = async (type) => {
  try {
    let data = [];
    let headers = [];

    switch (type) {
      case 'users':
        const usersResponse = await fetchWithAuth(`${API_URL_USERS}`, { method: 'GET' });
        data = usersResponse.data || usersResponse || [];
        headers = ['ID', 'Username', 'Email', 'Display Name', 'Role', 'Created At', 'Active'];
        break;
      
      case 'posts':
        const postsResponse = await fetchWithAuth(API_URL_POSTS_ALL, { method: 'GET' });
        data = postsResponse.data || postsResponse || [];
        headers = ['ID', 'Title', 'Description', 'User', 'Created At', 'Likes', 'Comments'];
        break;
      
      case 'events':
        const eventsResponse = await fetchWithAuth(`${API_URL_EVENTS}`, { method: 'GET' });
        data = eventsResponse.data || eventsResponse || [];
        headers = ['ID', 'Title', 'Description', 'Date', 'Location', 'Category', 'Created At'];
        break;
      
      default:
        throw new Error('Tipo de exportación no válido');
    }

    // Convertir a CSV
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        switch (type) {
          case 'users':
            return [
              item.user_id,
              `"${item.username || ''}"`,
              `"${item.email || ''}"`,
              `"${item.display_name || ''}"`,
              item.role || 'user',
              item.created_at || '',
              item.is_active !== false ? 'Yes' : 'No'
            ].join(',');
          
          case 'posts':
            return [
              item.post_id,
              `"${(item.title || '').replace(/"/g, '""')}"`,
              `"${(item.description || '').replace(/"/g, '""')}"`,
              `"${item.user?.username || ''}"`,
              item.created_at || '',
              item.likes_count || 0,
              item.comments_count || 0
            ].join(',');
          
          case 'events':
            return [
              item.event_id || item.id,
              `"${(item.title || '').replace(/"/g, '""')}"`,
              `"${(item.description || '').replace(/"/g, '""')}"`,
              item.date || '',
              `"${item.location || ''}"`,
              item.category || '',
              item.created_at || ''
            ].join(',');
          
          default:
            return '';
        }
      })
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting dashboard data:', error);
    throw error;
  }
};