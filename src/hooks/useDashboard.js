// useDashboard.js - Hook personalizado para el Dashboard
import { useState, useEffect, useCallback } from 'react';
import { 
  getDashboardStats,
  getUsersStats,
  getPostsStats,
  getEventsStats,
  getContactStats,
  getChartData,
  getRecentActivity,
  getSystemHealth,
  exportDashboardData
} from '../services/dashboardService';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para el Dashboard
 * @returns {Object} Estado y funciones del dashboard
 */
export const useDashboard = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  
  // Estados principales
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de carga específicos
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  
  // Configuración de actualización automática
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos

  /**
   * Carga las estadísticas del dashboard
   */
  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    
    try {
      setLoadingStats(true);
      setError(null);
      
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Error al cargar estadísticas del dashboard');
    } finally {
      setLoadingStats(false);
    }
  }, [isAuthenticated, isAdmin]);

  /**
   * Carga datos para gráficos
   * @param {string} type - Tipo de gráfico
   * @param {string} period - Período de tiempo
   */
  const loadChartData = useCallback(async (type, period = '7d') => {
    if (!isAuthenticated || !isAdmin) return;
    
    try {
      setLoadingChart(true);
      
      const data = await getChartData(type, period);
      setChartData(prev => ({
        ...prev,
        [`${type}_${period}`]: data
      }));
    } catch (err) {
      console.error(`Error loading chart data for ${type}:`, err);
      setError(`Error al cargar datos del gráfico ${type}`);
    } finally {
      setLoadingChart(false);
    }
  }, [isAuthenticated, isAdmin]);

  /**
   * Carga actividad reciente
   */
  const loadRecentActivity = useCallback(async (limit = 10) => {
    if (!isAuthenticated || !isAdmin) return;
    
    try {
      setLoadingActivity(true);
      
      const activity = await getRecentActivity(limit);
      setRecentActivity(activity);
    } catch (err) {
      console.error('Error loading recent activity:', err);
      setError('Error al cargar actividad reciente');
    } finally {
      setLoadingActivity(false);
    }
  }, [isAuthenticated, isAdmin]);

  /**
   * Carga el estado del sistema
   */
  const loadSystemHealth = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    
    try {
      setLoadingHealth(true);
      
      const health = await getSystemHealth();
      setSystemHealth(health);
    } catch (err) {
      console.error('Error loading system health:', err);
      setError('Error al cargar estado del sistema');
    } finally {
      setLoadingHealth(false);
    }
  }, [isAuthenticated, isAdmin]);

  /**
   * Carga todos los datos del dashboard
   */
  const loadAllData = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    
    setLoading(true);
    
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadSystemHealth(),
        loadChartData('users'),
        loadChartData('posts'),
        loadChartData('events')
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, loadStats, loadRecentActivity, loadSystemHealth, loadChartData]);

  /**
   * Refresca todos los datos
   */
  const refreshData = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  /**
   * Exporta datos del dashboard
   * @param {string} type - Tipo de datos a exportar
   * @returns {Promise<string>} Datos en formato CSV
   */
  const exportData = useCallback(async (type) => {
    try {
      const csvData = await exportDashboardData(type);
      
      // Crear y descargar archivo
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return csvData;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw new Error('Error al exportar datos');
    }
  }, []);

  /**
   * Obtiene estadísticas específicas
   * @param {string} type - Tipo de estadísticas (users, posts, events, contacts)
   * @returns {Promise<Object>} Estadísticas específicas
   */
  const getSpecificStats = useCallback(async (type) => {
    try {
      switch (type) {
        case 'users':
          return await getUsersStats();
        case 'posts':
          return await getPostsStats();
        case 'events':
          return await getEventsStats();
        case 'contacts':
          return await getContactStats();
        default:
          throw new Error('Tipo de estadística no válido');
      }
    } catch (err) {
      console.error(`Error getting ${type} stats:`, err);
      throw err;
    }
  }, []);

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Configura actualización automática
   */
  const toggleAutoRefresh = useCallback((enabled) => {
    setAutoRefresh(enabled);
  }, []);

  /**
   * Cambia el intervalo de actualización
   */
  const changeRefreshInterval = useCallback((interval) => {
    setRefreshInterval(interval);
  }, []);

  // Efecto para carga inicial
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAllData();
    }
  }, [isAuthenticated, isAdmin, loadAllData]);

  // Efecto para actualización automática
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !isAdmin) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isAuthenticated, isAdmin, refreshData]);

  return {
    // Estados principales
    stats,
    chartData,
    recentActivity,
    systemHealth,
    loading,
    error,
    
    // Estados de carga específicos
    loadingStats,
    loadingChart,
    loadingActivity,
    loadingHealth,
    
    // Configuración
    autoRefresh,
    refreshInterval,
    
    // Funciones principales
    loadStats,
    loadChartData,
    loadRecentActivity,
    loadSystemHealth,
    loadAllData,
    refreshData,
    exportData,
    getSpecificStats,
    
    // Utilidades
    clearError,
    toggleAutoRefresh,
    changeRefreshInterval,
    
    // Getters de datos específicos
    getUsersData: () => stats?.users || {},
    getPostsData: () => stats?.posts || {},
    getEventsData: () => stats?.events || {},
    getContactsData: () => stats?.contacts || {},
    
    // Verificaciones de estado
    hasData: !!stats,
    isHealthy: systemHealth?.status === 'healthy',
    lastUpdated: stats?.lastUpdated,
    
    // Métricas calculadas
    totalUsers: stats?.users?.total || 0,
    totalPosts: stats?.posts?.total || 0,
    totalEvents: stats?.events?.total || 0,
    totalContacts: stats?.contacts?.total || 0,
    
    // Tendencias (requiere datos históricos)
    userGrowth: chartData.users_7d ? calculateGrowth(chartData.users_7d) : 0,
    postGrowth: chartData.posts_7d ? calculateGrowth(chartData.posts_7d) : 0,
    eventGrowth: chartData.events_7d ? calculateGrowth(chartData.events_7d) : 0,
  };
};

/**
 * Calcula el crecimiento basado en datos de gráfico
 * @param {Array} data - Datos del gráfico
 * @returns {number} Porcentaje de crecimiento
 */
const calculateGrowth = (data) => {
  if (!data || data.length < 2) return 0;
  
  const recent = data.slice(-3).reduce((sum, item) => sum + item.count, 0);
  const previous = data.slice(-6, -3).reduce((sum, item) => sum + item.count, 0);
  
  if (previous === 0) return recent > 0 ? 100 : 0;
  
  return Math.round(((recent - previous) / previous) * 100);
};

export default useDashboard;