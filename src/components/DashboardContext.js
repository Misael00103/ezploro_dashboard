// DashboardContext.js - Contexto para el Dashboard
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { DASHBOARD_CONFIG } from '../services/config';

// Estado inicial del dashboard
const initialState = {
  // UI State
  sidebarCollapsed: false,
  theme: 'light',
  language: 'es',
  
  // Configuración
  itemsPerPage: DASHBOARD_CONFIG.UI.ITEMS_PER_PAGE,
  autoRefresh: true,
  refreshInterval: 30000,
  
  // Notificaciones
  notifications: [],
  
  // Filtros y búsqueda
  filters: {},
  searchQuery: '',
  
  // Paginación
  currentPage: 1,
  
  // Modales y overlays
  modals: {
    createPost: false,
    editPost: false,
    deletePost: false,
    userProfile: false,
    settings: false,
  },
  
  // Datos seleccionados
  selectedItems: [],
  selectedPost: null,
  selectedUser: null,
};

// Tipos de acciones
const actionTypes = {
  // UI Actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  
  // Configuración
  SET_ITEMS_PER_PAGE: 'SET_ITEMS_PER_PAGE',
  SET_AUTO_REFRESH: 'SET_AUTO_REFRESH',
  SET_REFRESH_INTERVAL: 'SET_REFRESH_INTERVAL',
  
  // Notificaciones
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  
  // Filtros y búsqueda
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  
  // Paginación
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // Modales
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',
  
  // Selección
  SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
  SET_SELECTED_POST: 'SET_SELECTED_POST',
  SET_SELECTED_USER: 'SET_SELECTED_USER',
  CLEAR_SELECTIONS: 'CLEAR_SELECTIONS',
  
  // Estado general
  RESET_STATE: 'RESET_STATE',
  LOAD_PREFERENCES: 'LOAD_PREFERENCES',
};

// Reducer del dashboard
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.TOGGLE_SIDEBAR:
      const collapsed = !state.sidebarCollapsed;
      localStorage.setItem(DASHBOARD_CONFIG.UI.SIDEBAR_COLLAPSED_KEY, collapsed);
      return { ...state, sidebarCollapsed: collapsed };
      
    case actionTypes.SET_THEME:
      localStorage.setItem(DASHBOARD_CONFIG.UI.THEME_KEY, action.payload);
      return { ...state, theme: action.payload };
      
    case actionTypes.SET_LANGUAGE:
      localStorage.setItem(DASHBOARD_CONFIG.UI.LANGUAGE_KEY, action.payload);
      return { ...state, language: action.payload };
      
    case actionTypes.SET_ITEMS_PER_PAGE:
      return { ...state, itemsPerPage: action.payload };
      
    case actionTypes.SET_AUTO_REFRESH:
      return { ...state, autoRefresh: action.payload };
      
    case actionTypes.SET_REFRESH_INTERVAL:
      return { ...state, refreshInterval: action.payload };
      
    case actionTypes.ADD_NOTIFICATION:
      const newNotification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      const notifications = [newNotification, ...state.notifications]
        .slice(0, DASHBOARD_CONFIG.NOTIFICATIONS.MAX_NOTIFICATIONS);
      return { ...state, notifications };
      
    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case actionTypes.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };
      
    case actionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
      
    case actionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload, currentPage: 1 };
      
    case actionTypes.CLEAR_FILTERS:
      return { ...state, filters: {}, searchQuery: '', currentPage: 1 };
      
    case actionTypes.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
      
    case actionTypes.OPEN_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true }
      };
      
    case actionTypes.CLOSE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false }
      };
      
    case actionTypes.CLOSE_ALL_MODALS:
      return {
        ...state,
        modals: Object.keys(state.modals).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {})
      };
      
    case actionTypes.SET_SELECTED_ITEMS:
      return { ...state, selectedItems: action.payload };
      
    case actionTypes.SET_SELECTED_POST:
      return { ...state, selectedPost: action.payload };
      
    case actionTypes.SET_SELECTED_USER:
      return { ...state, selectedUser: action.payload };
      
    case actionTypes.CLEAR_SELECTIONS:
      return {
        ...state,
        selectedItems: [],
        selectedPost: null,
        selectedUser: null
      };
      
    case actionTypes.RESET_STATE:
      return initialState;
      
    case actionTypes.LOAD_PREFERENCES:
      return {
        ...state,
        sidebarCollapsed: localStorage.getItem(DASHBOARD_CONFIG.UI.SIDEBAR_COLLAPSED_KEY) === 'true',
        theme: localStorage.getItem(DASHBOARD_CONFIG.UI.THEME_KEY) || 'light',
        language: localStorage.getItem(DASHBOARD_CONFIG.UI.LANGUAGE_KEY) || 'es',
      };
      
    default:
      return state;
  }
};

// Crear contexto
const DashboardContext = createContext();

// Provider del contexto
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const auth = useAuth();
  const dashboard = useDashboard();

  // Cargar preferencias al inicializar
  useEffect(() => {
    dispatch({ type: actionTypes.LOAD_PREFERENCES });
  }, []);

  // Funciones de acción
  const actions = {
    // UI Actions
    toggleSidebar: () => dispatch({ type: actionTypes.TOGGLE_SIDEBAR }),
    setTheme: (theme) => dispatch({ type: actionTypes.SET_THEME, payload: theme }),
    setLanguage: (language) => dispatch({ type: actionTypes.SET_LANGUAGE, payload: language }),
    
    // Configuración
    setItemsPerPage: (count) => dispatch({ type: actionTypes.SET_ITEMS_PER_PAGE, payload: count }),
    setAutoRefresh: (enabled) => dispatch({ type: actionTypes.SET_AUTO_REFRESH, payload: enabled }),
    setRefreshInterval: (interval) => dispatch({ type: actionTypes.SET_REFRESH_INTERVAL, payload: interval }),
    
    // Notificaciones
    addNotification: (notification) => {
      dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
      
      // Auto-remove después del tiempo configurado
      if (notification.duration !== 0) {
        setTimeout(() => {
          actions.removeNotification(notification.id || Date.now());
        }, notification.duration || DASHBOARD_CONFIG.NOTIFICATIONS.DURATION);
      }
    },
    
    removeNotification: (id) => dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: id }),
    clearNotifications: () => dispatch({ type: actionTypes.CLEAR_NOTIFICATIONS }),
    
    // Notificaciones de éxito/error
    showSuccess: (message, options = {}) => {
      actions.addNotification({
        type: 'success',
        message,
        ...options
      });
    },
    
    showError: (message, options = {}) => {
      actions.addNotification({
        type: 'error',
        message,
        duration: 0, // No auto-remove errors
        ...options
      });
    },
    
    showWarning: (message, options = {}) => {
      actions.addNotification({
        type: 'warning',
        message,
        ...options
      });
    },
    
    showInfo: (message, options = {}) => {
      actions.addNotification({
        type: 'info',
        message,
        ...options
      });
    },
    
    // Filtros y búsqueda
    setFilters: (filters) => dispatch({ type: actionTypes.SET_FILTERS, payload: filters }),
    setSearchQuery: (query) => dispatch({ type: actionTypes.SET_SEARCH_QUERY, payload: query }),
    clearFilters: () => dispatch({ type: actionTypes.CLEAR_FILTERS }),
    
    // Paginación
    setCurrentPage: (page) => dispatch({ type: actionTypes.SET_CURRENT_PAGE, payload: page }),
    nextPage: () => dispatch({ type: actionTypes.SET_CURRENT_PAGE, payload: state.currentPage + 1 }),
    prevPage: () => dispatch({ type: actionTypes.SET_CURRENT_PAGE, payload: Math.max(1, state.currentPage - 1) }),
    
    // Modales
    openModal: (modalName) => dispatch({ type: actionTypes.OPEN_MODAL, payload: modalName }),
    closeModal: (modalName) => dispatch({ type: actionTypes.CLOSE_MODAL, payload: modalName }),
    closeAllModals: () => dispatch({ type: actionTypes.CLOSE_ALL_MODALS }),
    
    // Selección
    setSelectedItems: (items) => dispatch({ type: actionTypes.SET_SELECTED_ITEMS, payload: items }),
    setSelectedPost: (post) => dispatch({ type: actionTypes.SET_SELECTED_POST, payload: post }),
    setSelectedUser: (user) => dispatch({ type: actionTypes.SET_SELECTED_USER, payload: user }),
    clearSelections: () => dispatch({ type: actionTypes.CLEAR_SELECTIONS }),
    
    // Utilidades
    resetState: () => dispatch({ type: actionTypes.RESET_STATE }),
    
    // Funciones combinadas
    selectAndOpenPostModal: (post) => {
      actions.setSelectedPost(post);
      actions.openModal('editPost');
    },
    
    selectAndOpenUserModal: (user) => {
      actions.setSelectedUser(user);
      actions.openModal('userProfile');
    },
  };

  // Valor del contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Auth y Dashboard hooks
    auth,
    dashboard,
    
    // Acciones
    ...actions,
    
    // Getters computados
    isLoading: auth.loading || dashboard.loading,
    hasError: auth.error || dashboard.error,
    totalNotifications: state.notifications.length,
    unreadNotifications: state.notifications.filter(n => !n.read).length,
    
    // Utilidades
    formatDate: (date) => new Date(date).toLocaleDateString(state.language),
    formatDateTime: (date) => new Date(date).toLocaleString(state.language),
    
    // Configuración actual
    config: DASHBOARD_CONFIG,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook para usar el contexto
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext debe ser usado dentro de un DashboardProvider');
  }
  return context;
};

export default DashboardContext;