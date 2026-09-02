import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Trophy,
  Star,
  Crown,
  Gift,
  Plus,
  Edit,
  Trash2,
  Award,
  Target,
  Users,
  TrendingUp,
  Medal,
  Loader2
} from 'lucide-react';
import {
  getRankingUsuariosMasSuscritos,
  getRankingUsuariosMasPuntos,
  getRankingUsuariosMasLikesDados,
  getRankingUsuariosMasComentarios,
  getRankingUsuariosMasEventosCreados,
  getRankingEventosMasSuscritos,
  getRankingEventosMasLikes
} from '../services/rankingService';
import { getAllRules, createRule, updateRule, deleteRule } from '../services/rulesService';
import { registerAction, getUserPoints, redeemReward, getUserHistory, getAllUsersHistory, subscribeDashboardGamificationEvents } from '../services/gamificationService';
import { fetchWithAuth } from '../services/userService';
import { API_URL_USERS_LIST } from '../services/config';
import { getClaimableActions, claimPoints, getClaimedTransactions } from '../services/pointsService';
import { getCurrentUserId } from '../services/authService';
import { 
  getOffers, 
  createOffer, 
  updateOffer, 
  deleteOffer, 
  toggleOfferStatus 
} from '../services/offerService';
import { toast } from 'react-hot-toast';
import PromotionsManager from './PromotionsManager';

const GamificationManager = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pointsRules, setPointsRules] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [gamificationActions, setGamificationActions] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [realRankings, setRealRankings] = useState({
    usuariosMasSuscritos: [],
    usuariosMasPuntos: [],
    usuariosMasLikesDados: [],
    usuariosMasComentarios: [],
    usuariosMasEventosCreados: [],
    eventosMasSuscritos: [],
    eventosMasLikes: []
  });
  const [rankingTab, setRankingTab] = useState('puntos');
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const [claimableActions, setClaimableActions] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isManualActionModalOpen, setIsManualActionModalOpen] = useState(false);
  const [isManualRedeemModalOpen, setIsManualRedeemModalOpen] = useState(false);
  const [manualActionData, setManualActionData] = useState({
    action_name: '',
    event_id: ''
  });
  const [manualRedeemData, setManualRedeemData] = useState({
    reward_name: '',
    points_required: 0,
    offer_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [globalActions, setGlobalActions] = useState([]);
  const [globalRedemptions, setGlobalRedemptions] = useState([]);
  const [isLoadingGlobalActivity, setIsLoadingGlobalActivity] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    point_type: 'Profile',
    points: 1,
    description: '',
    is_active: true
  });
  const [offerFormData, setOfferFormData] = useState({
    title: '',
    description: '',
    organizer_id: null,
    discount_percentage: null,
    discount_amount: null,
    original_price: null,
    final_price: null,
    start_date: '',
    end_date: '',
    category: '',
    image_url: '',
    terms_conditions: '',
    is_active: true,
    max_uses: null,
    promo_code: '',
    target_audience: 'all',
    offer_type: 'percentage',
    points_required: null
  });
  const [offerImageFile, setOfferImageFile] = useState(null);
  const [offerImagePreview, setOfferImagePreview] = useState(null);
  const [editOfferImageFile, setEditOfferImageFile] = useState(null);
  const [editOfferImagePreview, setEditOfferImagePreview] = useState(null);

  const loadUsers = async (loggedInUserId) => {
    try {
      const response = await fetchWithAuth(API_URL_USERS_LIST);
      console.log('🔵 loadUsers - Response raw from API_URL_USERS_LIST:', response);
      let uList = [];
      if (Array.isArray(response)) {
        uList = response;
      } else if (response && Array.isArray(response.data)) {
        uList = response.data;
      } else if (response && Array.isArray(response.users)) {
        uList = response.users;
      }

      console.log('🔵 loadUsers - Users List extracted:', uList);
      if (uList.length > 0) {
        console.log('🔵 loadUsers - First User details:', uList[0]);
      }
      setUsers(uList);

      if (loggedInUserId) {
        const found = uList.find(x => x.id?.toString() === loggedInUserId.toString() || x.user_id?.toString() === loggedInUserId.toString());
        if (found) {
          setSelectedUser(found);
          await loadUserData(found.id || found.user_id, found);
          await loadActivity(found.id || found.user_id, found);
          return;
        }
      }

      if (uList.length > 0) {
        setSelectedUser(uList[0]);
        await loadUserData(uList[0].id || uList[0].user_id, uList[0]);
        await loadActivity(uList[0].id || uList[0].user_id, uList[0]);
      }
    } catch (error) {
      console.error('Error loading users in GamificationManager:', error);
    }
  };

  const loadGlobalActivity = async () => {
    try {
      setIsLoadingGlobalActivity(true);
      console.log('🔵 loadGlobalActivity - Cargando historial de todos los usuarios...');
      const history = await getAllUsersHistory();
      
      let hasGlobalData = false;
      
      if (history && history.actions && Array.isArray(history.actions) && history.actions.length > 0) {
        const mappedActions = history.actions.map(action => ({
          id: action.user_action_id || action.id,
          user: {
            name: action.user?.display_name || action.user?.name || action.user?.username || 'Usuario',
            avatar: action.user?.profile_picture || action.user?.avatar
          },
          action_name: action.action?.name || action.action_name,
          points_awarded: action.action?.points || action.points || 0,
          created_at: action.created_at,
          event_title: action.event?.title || null
        }));
        setGlobalActions(mappedActions);
        hasGlobalData = true;
      } else {
        setGlobalActions([]);
      }

      if (history && history.rewards && Array.isArray(history.rewards) && history.rewards.length > 0) {
        const mappedRewards = history.rewards.map(reward => ({
          id: reward.user_reward_id || reward.id || reward.redemption_id,
          user: {
            name: reward.user?.display_name || reward.user?.name || reward.user?.username || 'Usuario',
            avatar: reward.user?.profile_picture || reward.user?.avatar,
            email: reward.user?.email
          },
          reward_name: reward.reward_name || reward.offer?.title || reward.offer?.name || 'Recompensa',
          points_redeemed: reward.points_redeemed || reward.points || 0,
          redeemed_at: reward.redeemed_at || reward.created_at || reward.redeemedAt,
          status: reward.status || 'active',
          used_at: reward.used_at || reward.usedAt
        }));
        setGlobalRedemptions(mappedRewards);
        hasGlobalData = true;
      } else {
        setGlobalRedemptions([]);
      }

      // Fallback: Si no hay información global, usar el historial local del usuario seleccionado
      if (!hasGlobalData) {
        console.log('🔵 loadGlobalActivity - Historial global vacío, usando fallback de usuario seleccionado...');
        setGlobalActions(gamificationActions);
        setGlobalRedemptions(redemptionHistory);
      }
    } catch (error) {
      console.error('🔴 Error loading global activity:', error);
      console.log('🔵 loadGlobalActivity - Fallback a actividad local de usuario por error...');
      setGlobalActions(gamificationActions);
      setGlobalRedemptions(redemptionHistory);
    } finally {
      setIsLoadingGlobalActivity(false);
    }
  };

  const handleManualActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('No se ha seleccionado ningún usuario');
      return;
    }
    if (!manualActionData.action_name) {
      toast.error('Por favor selecciona una acción');
      return;
    }

    try {
      const targetId = selectedUser.id || selectedUser.user_id;
      console.log('🔵 handleManualActionSubmit - Payload:', {
        user_id: targetId,
        action_name: manualActionData.action_name,
        event_id: manualActionData.event_id || null
      });
      const selRule = pointsRules.find(r => r.rule_name === manualActionData.action_name || r.display_name === manualActionData.action_name);
      await registerAction({
        user_id: targetId,
        action_name: manualActionData.action_name,
        event_id: manualActionData.event_id || null,
        rule_id: selRule ? (selRule.rule_id || selRule.id) : null,
        point_type: selRule ? selRule.point_type : null
      });

      toast.success('Acción registrada y puntos sumados');
      setIsManualActionModalOpen(false);
      setManualActionData({ action_name: '', event_id: '' });
      
      await loadUserData(targetId, selectedUser);
      await loadActivity(targetId, selectedUser);
    } catch (error) {
      console.error('Error registering manual action:', error);
      toast.error(error.message || 'Error al registrar acción');
    }
  };

  const handleManualRedeemSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('No se ha seleccionado ningún usuario');
      return;
    }
    if (!manualRedeemData.reward_name) {
      toast.error('Por favor selecciona una recompensa');
      return;
    }
    if (parseFloat(userTotalPoints) < parseFloat(manualRedeemData.points_required)) {
      toast.error('El usuario no tiene suficientes puntos');
      return;
    }

    try {
      const targetId = selectedUser.id || selectedUser.user_id;
      await redeemReward({
        user_id: targetId,
        reward_name: manualRedeemData.reward_name,
        points_redeemed: manualRedeemData.points_required,
        offer_id: manualRedeemData.offer_id
      });

      toast.success('Canje realizado exitosamente');
      setIsManualRedeemModalOpen(false);
      setManualRedeemData({ reward_name: '', points_required: 0, offer_id: '' });
      
      await loadUserData(targetId, selectedUser);
      await loadActivity(targetId, selectedUser);
    } catch (error) {
      console.error('Error in manual redeem:', error);
      toast.error(error.message || 'Error al realizar canje');
    }
  };

  // Cargar reglas y datos iniciales desde el backend
  useEffect(() => {
    const loadInitialData = async () => {
      // Intentar obtener userId de múltiples fuentes
      let userId = getCurrentUserId();
      
      // Si no hay userId en localStorage, intentar obtenerlo del objeto user
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.user_id || user.id || user._id;
    if (userId) {
              console.log('🔵 GamificationManager - userId obtenido del objeto user:', userId);
              // Guardar en el formato correcto
              const userIdKey = localStorage.getItem('token') ? 'userId' : DASHBOARD_CONFIG?.AUTH?.USER_ID_KEY || 'userId';
              localStorage.setItem(userIdKey, userId.toString());
            }
          } catch (e) {
            console.error('Error parseando user:', e);
          }
        }
      }
      
      // Validar que userId sea válido
      if (userId) {
        // Convertir a número si es string
        if (typeof userId === 'string') {
          const numUserId = parseInt(userId, 10);
          if (!isNaN(numUserId) && numUserId > 0) {
            userId = numUserId;
          } else {
            console.warn('⚠️ GamificationManager - userId no es un número válido:', userId);
            userId = null;
          }
        } else if (typeof userId === 'number' && userId > 0) {
          // Ya es un número válido
        } else {
          console.warn('⚠️ GamificationManager - userId no es válido:', userId);
          userId = null;
        }
      }
      
      console.log('🔵 GamificationManager useEffect - Usuario ID final:', userId, 'Tipo:', typeof userId);
      console.log('🔵 GamificationManager - localStorage userId:', localStorage.getItem('userId'));
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('🔵 GamificationManager - user object:', { 
            user_id: user.user_id, 
            id: user.id, 
            _id: user._id 
          });
        } catch (e) {
          console.error('Error parseando user para log:', e);
        }
      }
      
      setCurrentUserId(userId);
      
      const results = await Promise.allSettled([
        loadRules(),
        loadOffers(),
        loadUsers(userId)
      ]);
      
      // Log de resultados
      results.forEach((result, index) => {
        const names = ['loadRules', 'loadOffers', 'loadUsers'];
        if (result.status === 'rejected') {
          console.error(`🔴 Error en ${names[index]}:`, result.reason);
        } else {
          console.log(`✅ ${names[index]} completado`);
        }
      });
    };
    
    loadInitialData();
  }, []);

  // Cargar rankings automáticamente cuando se abre la pestaña de rankings
  useEffect(() => {
    if (activeTab === 'rankings') {
      loadRealRankings();
    }
  }, [activeTab]);

  // Cargar actividad global cuando se abre la pestaña de actividad y escuchar sockets realtime
  useEffect(() => {
    if (activeTab === 'activity') {
      loadGlobalActivity();
    }

    const unsubscribeSocket = subscribeDashboardGamificationEvents((eventData) => {
      console.log('⚡ Socket event received in GamificationManager:', eventData);
      toast.success(`⚡ Actividad en tiempo real (Usuario #${eventData.userId || ''})`, { icon: '🏆' });
      loadGlobalActivity();
    });

    return () => {
      if (typeof unsubscribeSocket === 'function') unsubscribeSocket();
    };
  }, [activeTab]);

  const loadUserData = async (userId, userObj = null) => {
    try {
      if (!userId) {
        console.warn('⚠️ loadUserData - No hay userId, no se pueden cargar datos');
        setUserTotalPoints(0);
        setClaimableActions([]);
        return;
      }
      
      console.log('🔵 loadUserData - Cargando datos para usuario:', userId);
      const pointsData = await getUserPoints(userId);
      console.log('🔵 loadUserData - Puntos recibidos del servicio:', pointsData);
      
      // Intentar diferentes formatos de respuesta
      let totalPoints = 0;
      if (pointsData !== null && pointsData !== undefined) {
        if (typeof pointsData === 'number') {
          totalPoints = pointsData;
        } else if (typeof pointsData === 'string') {
          const parsed = parseFloat(pointsData);
          if (!isNaN(parsed)) {
            totalPoints = parsed;
          }
        } else {
          // Es un objeto
          const rawVal = pointsData.total_points !== undefined ? pointsData.total_points : (pointsData.points !== undefined ? pointsData.points : pointsData.count);
          if (rawVal !== undefined && rawVal !== null) {
            const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
            if (!isNaN(parsed)) {
              totalPoints = parsed;
            }
          }
        }
      }
      
      // Fallback: Si los puntos retornados de la API son 0 (o hubo error de permisos), intentar leerlos de selectedUser o del userObj provisto
      if (totalPoints === 0) {
        const targetUserObj = userObj || selectedUser;
        if (targetUserObj) {
          const fallbackPoints = targetUserObj.total_points !== undefined ? targetUserObj.total_points : (targetUserObj.points !== undefined ? targetUserObj.points : (targetUserObj.points_total || 0));
          if (fallbackPoints !== undefined && fallbackPoints !== null && Number(fallbackPoints) > 0) {
            console.log('🔵 loadUserData - Usando puntos de fallback del objeto de usuario:', fallbackPoints);
            totalPoints = Number(fallbackPoints);
          }
        }

        // Segundo Fallback: si sigue siendo 0, consultar ranking
        if (totalPoints === 0) {
          try {
            console.log('🔵 loadUserData - Intentando obtener puntos desde el ranking...');
            const rankingData = await getRankingUsuariosMasPuntos(200);
            console.log('🔵 loadUserData - Datos de ranking cargados para fallback:', rankingData);
            if (Array.isArray(rankingData)) {
              const foundInRanking = rankingData.find(r => (r.user_id || r.id)?.toString() === userId.toString());
              if (foundInRanking) {
                const rankingPoints = foundInRanking.count !== undefined ? foundInRanking.count : (foundInRanking.points !== undefined ? foundInRanking.points : (foundInRanking.total_points || 0));
                console.log('🟢 loadUserData - Puntos encontrados en ranking para usuario:', userId, '=', rankingPoints);
                totalPoints = Number(rankingPoints);
              }
            }
          } catch (rankingError) {
            console.warn('⚠️ loadUserData - Error al buscar puntos en el ranking para fallback:', rankingError.message);
          }
        }
      }
      
      console.log('🔵 loadUserData - Puntos extraídos:', totalPoints);
      setUserTotalPoints(totalPoints);
      
      const actions = await getClaimableActions(userId);
      console.log('🔵 loadUserData - Acciones reclamables recibidas:', actions);
      console.log('🔵 loadUserData - Es array?', Array.isArray(actions));
      setClaimableActions(Array.isArray(actions) ? actions : []);
    } catch (error) {
      console.error('🔴 Error loading user data:', error);
      console.error('🔴 Error stack:', error.stack);
      // No mostrar toast aquí para no spamear, solo log
      setUserTotalPoints(0);
      setClaimableActions([]);
    }
  };

  const loadActivity = async (userId, userObj = null) => {
    try {
      setIsLoadingActivity(true);
      
      // Validar userId antes de hacer la llamada
      if (!userId) {
        console.warn('⚠️ loadActivity - userId no proporcionado');
        setGamificationActions([]);
        setRedemptionHistory([]);
        return;
      }
      
      // Validar que userId sea un número válido
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(userIdNum) || userIdNum <= 0) {
        console.warn('⚠️ loadActivity - ID de usuario inválido:', userId, 'Tipo:', typeof userId);
        console.warn('⚠️ loadActivity - No se puede cargar actividad sin userId válido');
        setGamificationActions([]);
        setRedemptionHistory([]);
        return;
      }
      
      console.log('🔵 loadActivity - Cargando actividad para usuario:', userIdNum);
      
      const targetUser = userObj || selectedUser;
      
      try {
        const history = await getUserHistory(userIdNum);
        console.log('🔵 loadActivity - Historial recibido:', history);
        
        // Procesar historial solo si se obtuvo correctamente
        if (!history) {
          console.warn('⚠️ loadActivity - Historial es null o undefined');
          setGamificationActions([]);
          setRedemptionHistory([]);
          return;
        }
      
      // Mapear acciones del backend al formato del frontend
        if (history && history.actions && Array.isArray(history.actions)) {
        const mappedActions = history.actions.map(action => ({
          id: action.user_action_id || action.id,
          user: {
            name: action.user?.display_name || action.user?.name || targetUser?.display_name || targetUser?.name || targetUser?.username || 'Usuario',
            avatar: action.user?.profile_picture || action.user?.avatar || targetUser?.profile_picture || targetUser?.avatar
          },
          action_name: action.action?.name || action.action_name,
          points_awarded: action.action?.points || action.points || 0,
          created_at: action.created_at,
          event_title: action.event?.title || null
        }));
          console.log('🔵 loadActivity - Acciones mapeadas:', mappedActions);
        setGamificationActions(mappedActions);
        } else {
          console.warn('⚠️ loadActivity - No hay acciones en el historial');
          setGamificationActions([]);
      }

      // Mapear canjes del backend al formato del frontend
        if (history && history.rewards && Array.isArray(history.rewards)) {
        const mappedRewards = history.rewards.map(reward => ({
            id: reward.user_reward_id || reward.id || reward.redemption_id,
          user: {
            name: reward.user?.display_name || reward.user?.name || targetUser?.display_name || targetUser?.name || targetUser?.username || 'Usuario',
              avatar: reward.user?.profile_picture || reward.user?.avatar || targetUser?.profile_picture || targetUser?.avatar,
              email: reward.user?.email || targetUser?.email
            },
            reward_name: reward.reward_name || reward.offer?.title || reward.offer?.name || 'Recompensa',
            points_redeemed: reward.points_redeemed || reward.points || 0,
            redeemed_at: reward.redeemed_at || reward.created_at || reward.redeemedAt,
            status: reward.status || 'active',
            used_at: reward.used_at || reward.usedAt
          }));
          console.log('🔵 loadActivity - Canjes mapeados:', mappedRewards);
          setRedemptionHistory(mappedRewards);
        } else {
          console.warn('⚠️ loadActivity - No hay canjes en el historial');
          setRedemptionHistory([]);
        }

        // Calcular puntos netos reales basándose en el historial de transacciones (acciones - canjes)
        let calculatedPoints = 0;
        if (history && history.actions && Array.isArray(history.actions)) {
          history.actions.forEach(action => {
            const pts = Number(action.action?.points || action.points || 0);
            calculatedPoints += pts;
          });
        }
        if (history && history.rewards && Array.isArray(history.rewards)) {
          history.rewards.forEach(reward => {
            const pts = Number(reward.points_redeemed || (reward.reward && reward.reward.points) || 0);
            calculatedPoints -= pts;
          });
        }
        if (calculatedPoints < 0) calculatedPoints = 0;
        console.log('🟢 loadActivity - Puntos netos calculados desde el historial:', calculatedPoints);
        setUserTotalPoints(calculatedPoints);

      } catch (historyError) {
        // Si getUserHistory lanza un error (aunque no debería), manejarlo aquí
        console.warn('⚠️ loadActivity - Error al obtener historial:', historyError.message);
        console.warn('⚠️ loadActivity - Esto puede ser normal si el usuario no tiene historial');
        setGamificationActions([]);
        setRedemptionHistory([]);
      }
    } catch (error) {
      console.error('🔴 Error loading activity (error general):', error);
      console.error('🔴 Error stack:', error.stack);
      // No mostrar toast para no spamear, solo log
      setGamificationActions([]);
      setRedemptionHistory([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getFallbackRules = () => [
    { id: '1', rule_id: '1', display_name: 'Crear Evento', rule_name: 'Crear Evento', category: 'events', point_type: 'Events', points: 10, description: 'Sumar puntos por organizar un evento', is_active: true },
    { id: '2', rule_id: '2', display_name: 'Asistir a Evento', rule_name: 'Asistir a Evento', category: 'events', point_type: 'Events', points: 5, description: 'Sumar puntos por participar en un evento', is_active: true },
    { id: '3', rule_id: '3', display_name: 'Completar Perfil', rule_name: 'Completar Perfil', category: 'profile', point_type: 'Profile', points: 15, description: 'Sumar puntos por completar datos de perfil', is_active: true },
    { id: '4', rule_id: '4', display_name: 'Dar Like a Evento', rule_name: 'Dar Like a Evento', category: 'engagement', point_type: 'Engagement', points: 2, description: 'Sumar puntos por dar me gusta a un evento', is_active: true }
  ];

  const loadRules = async () => {
    try {
      setIsLoadingRules(true);
      const rules = await getAllRules();
      console.log('🔵 loadRules - Raw rules from backend:', JSON.stringify(rules, null, 2));
      // Mapear datos del backend al formato del frontend
      const mappedRules = rules.map(rule => ({
        id: rule.rule_id,
        rule_id: rule.rule_id,
        display_name: rule.rule_name,
        rule_name: rule.rule_name,
        category: rule.point_type.toLowerCase(),
        point_type: rule.point_type,
        points: rule.points,
        description: rule.description || '',
        is_active: rule.is_active
      }));
      setPointsRules(mappedRules.length > 0 ? mappedRules : getFallbackRules());
    } catch (error) {
      console.error('Error loading rules:', error);
      console.log('🔵 loadRules - Fallback a reglas por defecto por error de API (500)...');
      setPointsRules(getFallbackRules());
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const rule = pointsRules.find(r => r.id === ruleId || r.rule_id === ruleId);
      if (!rule) return;

      const updatedRule = await updateRule(rule.rule_id || rule.id, {
        rule_name: rule.rule_name,
        point_type: rule.point_type,
        points: rule.points,
        description: rule.description,
        is_active: !rule.is_active
      });

      // Actualizar estado local
      setPointsRules(prev => prev.map(r => 
        (r.id === ruleId || r.rule_id === ruleId) 
          ? { ...r, is_active: updatedRule.is_active }
          : r
      ));
      
      toast.success(`Regla ${updatedRule.is_active ? 'activada' : 'desactivada'}`);
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Error al cambiar el estado de la regla');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!formData.rule_name || !formData.point_type || !formData.points) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (formData.points < 1 || formData.points > 5) {
        toast.error('Los puntos deben estar entre 1 y 5');
        return;
      }

      await createRule(formData);
      toast.success('Regla creada exitosamente');
      setIsCreateModalOpen(false);
      setFormData({
        rule_name: '',
        point_type: 'Profile',
        points: 1,
        description: '',
        is_active: true
      });
      loadRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error(error.message || 'Error al crear la regla');
    }
  };

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      point_type: rule.point_type,
      points: rule.points,
      description: rule.description || '',
      is_active: rule.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!selectedRule) return;

      if (!formData.rule_name || !formData.point_type || !formData.points) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (formData.points < 1 || formData.points > 5) {
        toast.error('Los puntos deben estar entre 1 y 5');
        return;
      }

      await updateRule(selectedRule.rule_id || selectedRule.id, formData);
      toast.success('Regla actualizada exitosamente');
      setIsEditModalOpen(false);
      setSelectedRule(null);
      loadRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error(error.message || 'Error al actualizar la regla');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta regla?')) {
      return;
    }

    try {
      const rule = pointsRules.find(r => r.id === ruleId || r.rule_id === ruleId);
      if (!rule) return;

      await deleteRule(rule.rule_id || rule.id);
      toast.success('Regla eliminada exitosamente');
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Error al eliminar la regla');
    }
  };

  const loadOffers = async () => {
    try {
      setIsLoadingOffers(true);
      console.log('🔵 loadOffers - Iniciando carga de ofertas...');
      const offers = await getOffers();
      console.log('🔵 loadOffers - Ofertas recibidas del backend:', offers);
      
      // Verificar que offers sea un array
      if (!Array.isArray(offers)) {
        console.warn('⚠️ loadOffers - offers no es un array:', offers);
        setRewards([]);
        return;
      }
      
      console.log('🔵 loadOffers - Total de ofertas:', offers.length);
      
      // Mapear ofertas del backend al formato de recompensas
      const mappedRewards = offers.map(offer => {
        // Obtener el ID de la oferta (puede ser offer_id, id, o _id)
        const offerId = offer.offer_id || offer.id || offer._id;
        console.log('🔵 loadOffers - Mapeando oferta:', { 
          offer_id: offer.offer_id, 
          id: offer.id, 
          _id: offer._id,
          offerId_final: offerId,
          title: offer.title 
        });
        
        return {
          id: offerId,
          offer_id: offerId,
          name: offer.title,
          title: offer.title,
          description: offer.description || '',
          points_required: offer.points_required !== undefined && offer.points_required !== null ? offer.points_required : (offer.discount_percentage || offer.discount_amount || 0),
          category: offer.category || offer.offer_type || 'discounts',
          times_redeemed: offer.current_uses || 0,
          is_active: offer.is_active !== undefined ? offer.is_active : true,
          discount_percentage: offer.discount_percentage,
          discount_amount: offer.discount_amount,
          original_price: offer.original_price,
          final_price: offer.final_price,
          start_date: offer.start_date,
          end_date: offer.end_date,
          image_url: offer.image_url,
          terms_conditions: offer.terms_conditions,
          max_uses: offer.max_uses,
          promo_code: offer.promo_code,
          target_audience: offer.target_audience,
          offer_type: offer.offer_type,
          organizer_id: offer.organizer_id
        };
      });
      
      console.log('🔵 loadOffers - Ofertas mapeadas:', mappedRewards);
      console.log('🔵 loadOffers - Ofertas activas:', mappedRewards.filter(r => r.is_active).length);
      setRewards(mappedRewards);
    } catch (error) {
      console.error('🔴 Error loading offers:', error);
      toast.error(error.message || 'Error al cargar las ofertas');
      setRewards([]);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleToggleReward = async (rewardId) => {
    try {
      const reward = rewards.find(r => r.id === rewardId || r.offer_id === rewardId);
      if (!reward) return;

      const offerId = reward.offer_id || reward.id;
      const updatedOffer = await toggleOfferStatus(offerId, !reward.is_active);
      
      setRewards(prev => prev.map(r => 
        (r.id === rewardId || r.offer_id === rewardId) 
          ? { ...r, is_active: updatedOffer.is_active || updatedOffer.offer?.is_active }
          : r
      ));
      
      toast.success(`Oferta ${updatedOffer.is_active || updatedOffer.offer?.is_active ? 'activada' : 'desactivada'}`);
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast.error('Error al cambiar el estado de la oferta');
    }
  };

  const handleOfferImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOfferImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOfferImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Limpiar URL si se selecciona un archivo
      setOfferFormData({ ...offerFormData, image_url: '' });
    }
  };

  const handleEditOfferImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditOfferImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditOfferImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Limpiar URL si se selecciona un archivo
      setOfferFormData({ ...offerFormData, image_url: '' });
    }
  };

  const handleOfferUrlChange = (e) => {
    const url = e.target.value;
    setOfferFormData({ ...offerFormData, image_url: url });
    
    // Si hay URL válida, mostrar preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setOfferImagePreview(url);
      // Limpiar archivo si se ingresa URL
      setOfferImageFile(null);
    } else if (!url) {
      setOfferImagePreview(null);
    }
  };

  const handleEditOfferUrlChange = (e) => {
    const url = e.target.value;
    setOfferFormData({ ...offerFormData, image_url: url });
    
    // Si hay URL válida, mostrar preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setEditOfferImagePreview(url);
      // Limpiar archivo si se ingresa URL
      setEditOfferImageFile(null);
    }
  };

  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    setOfferFormData({
      title: offer.title || offer.name || '',
      description: offer.description || '',
      organizer_id: offer.organizer_id || getCurrentUserId(),
      discount_percentage: offer.discount_percentage || null,
      discount_amount: offer.discount_amount || null,
      original_price: offer.original_price || null,
      final_price: offer.final_price || null,
      start_date: offer.start_date ? new Date(offer.start_date).toISOString().slice(0, 16) : '',
      end_date: offer.end_date ? new Date(offer.end_date).toISOString().slice(0, 16) : '',
      category: offer.category || '',
      image_url: offer.image_url || '',
      original_image_url: offer.image_url || '',
      terms_conditions: offer.terms_conditions || '',
      is_active: offer.is_active !== undefined ? offer.is_active : true,
      max_uses: offer.max_uses || null,
      promo_code: offer.promo_code || '',
      target_audience: offer.target_audience || 'all',
      offer_type: offer.offer_type || 'percentage'
    });
    setEditOfferImageFile(null);
    setEditOfferImagePreview(offer.image_url || null);
    setIsEditOfferModalOpen(true);
  };

  const handleDeleteOffer = async (rewardId) => {
    console.log('🔵 handleDeleteOffer - rewardId recibido:', rewardId);
    console.log('🔵 handleDeleteOffer - rewards disponibles:', rewards.map(r => ({ id: r.id, offer_id: r.offer_id, title: r.title })));
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta oferta?')) {
      return;
    }

    try {
      const reward = rewards.find(r => r.id === rewardId || r.offer_id === rewardId);
      console.log('🔵 handleDeleteOffer - reward encontrado:', reward);
      
      if (!reward) {
        console.error('🔴 handleDeleteOffer - No se encontró la oferta con ID:', rewardId);
        toast.error('No se encontró la oferta');
        return;
      }

      const offerId = reward.offer_id || reward.id;
      console.log('🔵 handleDeleteOffer - offerId a eliminar:', offerId);
      
      if (!offerId) {
        console.error('🔴 handleDeleteOffer - offerId es undefined');
        toast.error('ID de oferta inválido');
        return;
      }
      
      await deleteOffer(offerId);
      toast.success('Oferta eliminada exitosamente');
      loadOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Error al eliminar la oferta');
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      if (!offerFormData.title || !offerFormData.start_date || !offerFormData.end_date || !offerFormData.points_required) {
        toast.error('Por favor completa todos los campos requeridos (Título, Fechas y Puntos Requeridos)');
        return;
      }

      // Validar que organizer_id esté presente
      const organizerId = offerFormData.organizer_id || getCurrentUserId();
      if (!organizerId) {
        toast.error('No se pudo obtener el ID del organizador. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Validar precios en el frontend antes de enviar
      const originalPrice = offerFormData.original_price ? Number(offerFormData.original_price) : null;
      const finalPrice = offerFormData.final_price ? Number(offerFormData.final_price) : null;
      
      if (originalPrice !== null && finalPrice !== null) {
        console.log('🔵 handleCreateOffer - Validando precios:', { originalPrice, finalPrice });
        if (finalPrice > originalPrice) {
          toast.error(`El precio final (${finalPrice}) no puede ser mayor al precio original (${originalPrice})`);
          return;
        }
      }

      const offerData = {
        ...offerFormData,
        organizer_id: organizerId
      };

      console.log('🔵 handleCreateOffer - Creando oferta con datos:', offerData);
      console.log('🔵 handleCreateOffer - Archivo de imagen:', offerImageFile);
      console.log('🔵 handleCreateOffer - Tipo de archivo:', offerImageFile ? offerImageFile.constructor.name : 'null');
      console.log('🔵 handleCreateOffer - image_url en formData:', offerFormData.image_url);
      
      // Validar que haya imagen (archivo o URL)
      if (!offerImageFile && !offerFormData.image_url) {
        toast.error('Por favor selecciona una imagen o ingresa una URL de imagen');
        return;
      }
      
      await createOffer(offerData, offerImageFile);
      toast.success('Oferta creada exitosamente');
      setIsCreateOfferModalOpen(false);
      setOfferFormData({
        title: '',
        description: '',
        organizer_id: getCurrentUserId(),
        discount_percentage: null,
        discount_amount: null,
        original_price: null,
        final_price: null,
        start_date: '',
        end_date: '',
        category: '',
        image_url: '',
        terms_conditions: '',
        is_active: true,
        max_uses: null,
        promo_code: '',
        target_audience: 'all',
        offer_type: 'percentage',
        points_required: null
      });
      setOfferImageFile(null);
      setOfferImagePreview(null);
      loadOffers();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(error.message || 'Error al crear la oferta');
    }
  };

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    try {
      if (!selectedOffer) return;

      if (!offerFormData.title || !offerFormData.start_date || !offerFormData.end_date) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const offerId = selectedOffer.offer_id || selectedOffer.id;
      await updateOffer(offerId, offerFormData, editOfferImageFile);
      toast.success('Oferta actualizada exitosamente');
      setIsEditOfferModalOpen(false);
      setSelectedOffer(null);
      setEditOfferImageFile(null);
      setEditOfferImagePreview(null);
      loadOffers();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error(error.message || 'Error al actualizar la oferta');
    }
  };

  const handleClaimAction = async (actionId) => {
    if (!currentUserId) {
      toast.error('Usuario no identificado');
      return;
    }

    try {
      await claimPoints(currentUserId, actionId);
      toast.success('Puntos reclamados exitosamente');
      // Recargar datos del usuario y actividades
      await loadUserData(currentUserId);
      await loadActivity(currentUserId);
    } catch (error) {
      console.error('Error claiming points:', error);
      toast.error(error.message || 'Error al reclamar puntos');
    }
  };

  const handleRedeemReward = async (rewardName, pointsRequired) => {
    if (!currentUserId) {
      toast.error('Usuario no identificado');
      return;
    }

    try {
      await redeemReward({
        user_id: currentUserId,
        reward_name: rewardName,
        points_redeemed: pointsRequired
      });
      toast.success('Recompensa canjeada exitosamente');
      // Recargar datos del usuario y actividades
      await loadUserData(currentUserId);
      await loadActivity(currentUserId);
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error(error.message || 'Error al canjear recompensa');
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'Gold': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'Bronze': return 'bg-orange-600/20 text-orange-300 border-orange-600/30';
      default: return 'bg-violet-600/20 text-zinc-400 border-purple-600/30';
    }
  };

  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase();
    switch (cat) {
      case 'events': return 'bg-blue-600/20 text-blue-300 border-blue-600/30';
      case 'engagement': return 'bg-green-600/20 text-green-300 border-green-600/30';
      case 'profile': return 'bg-violet-600/20 text-zinc-400 border-purple-600/30';
      case 'discounts': return 'bg-red-600/20 text-red-300 border-red-600/30';
      case 'badges': return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
      case 'merchandise': return 'bg-pink-600/20 text-pink-300 border-pink-600/30';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
    }
  };

  const getCategoryDisplayName = (pointType) => {
    switch (pointType) {
      case 'Profile': return 'Perfil';
      case 'Events': return 'Eventos';
      case 'Engagement': return 'Compromiso';
      default: return pointType;
    }
  };

  const loadRealRankings = async () => {
    try {
      setIsLoadingRankings(true);
      const [puntos, suscritos, likes, comentarios, eventos, eventosSuscritos, eventosLikes] = await Promise.allSettled([
        getRankingUsuariosMasPuntos(10),
        getRankingUsuariosMasSuscritos(10),
        getRankingUsuariosMasLikesDados(10),
        getRankingUsuariosMasComentarios(10),
        getRankingUsuariosMasEventosCreados(10),
        getRankingEventosMasSuscritos(10),
        getRankingEventosMasLikes(10)
      ]);

      setRealRankings({
        usuariosMasPuntos: puntos.status === 'fulfilled' ? puntos.value : [],
        usuariosMasSuscritos: suscritos.status === 'fulfilled' ? suscritos.value : [],
        usuariosMasLikesDados: likes.status === 'fulfilled' ? likes.value : [],
        usuariosMasComentarios: comentarios.status === 'fulfilled' ? comentarios.value : [],
        usuariosMasEventosCreados: eventos.status === 'fulfilled' ? eventos.value : [],
        eventosMasSuscritos: eventosSuscritos.status === 'fulfilled' ? eventosSuscritos.value : [],
        eventosMasLikes: eventosLikes.status === 'fulfilled' ? eventosLikes.value : []
      });
    } catch (error) {
      console.error('Error loading rankings:', error);
      toast.error('Error al cargar los rankings');
    } finally {
      setIsLoadingRankings(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="h-4 w-4 text-yellow-400" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-zinc-400">{position}</span>;
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30';
      case 2: return 'bg-gray-900/50 text-gray-200 border-gray-600/30';
      case 3: return 'bg-amber-900/50 text-amber-200 border-amber-600/30';
      default: return 'bg-zinc-800/50 text-zinc-300 border-purple-600/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Gamificación</h1>
          <p className="text-zinc-400 mt-2">Gestiona puntos, recompensas y clasificaciones</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 glass-panel border-zinc-800/50">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 text-zinc-400 focus:text-white"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger 
            value="points" 
            className="data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 text-zinc-400 focus:text-white"
          >
            <Star className="h-4 w-4 mr-2" />
            Puntos
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className="data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 text-zinc-400 focus:text-white"
          >
            <Gift className="h-4 w-4 mr-2" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger 
            value="rankings" 
            className="data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 text-zinc-400 focus:text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 text-zinc-400 focus:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* User Selector Card */}
          <Card className="glass-panel border-zinc-800/50 shadow-lg shadow-black/20">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Usuario en Gestión</span>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-violet-500/20">
                    <AvatarImage src={selectedUser?.profile_picture} />
                    <AvatarFallback className="bg-violet-900/50 text-violet-200 text-sm">
                      {selectedUser?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selectedUser?.name || 'Cargando...'}</h3>
                    <p className="text-xs text-zinc-400">{selectedUser?.email || 'Selecciona un usuario'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input 
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[180px] bg-zinc-900/50 border-zinc-800/60 text-white placeholder-zinc-500 text-xs h-9"
                />

                <Select 
                  value={selectedUser?.id?.toString() || selectedUser?.user_id?.toString() || ''} 
                  onValueChange={(val) => {
                    const u = users.find(x => x.id?.toString() === val || x.user_id?.toString() === val);
                    if (u) {
                      setSelectedUser(u);
                      loadUserData(u.id || u.user_id, u);
                      loadActivity(u.id || u.user_id, u);
                    }
                  }}
                >
                  <SelectTrigger className="w-[220px] bg-zinc-900/50 border-zinc-850 text-white h-9 text-xs">
                    <SelectValue placeholder="Seleccionar usuario..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800/60 max-h-[220px]">
                    {users.filter(u => 
                      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(u => (
                      <SelectItem key={u.id || u.user_id} value={u.id?.toString() || u.user_id?.toString()} className="text-white focus:bg-zinc-900 text-xs">
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  onClick={() => setIsManualRedeemModalOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs"
                >
                  <Gift className="h-4 w-4 mr-1.5" />
                  Canjear Puntos
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass-panel border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Total Puntos Otorgados
                </CardTitle>
                <Star className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userTotalPoints.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-400">Puntos del usuario seleccionado</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Acciones Disponibles
                </CardTitle>
                <Users className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{claimableActions.length}</div>
                <p className="text-xs text-zinc-400">Para reclamar puntos</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Ofertas Disponibles
                </CardTitle>
                <Gift className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {rewards.filter(r => r.is_active).length}
                </div>
                <p className="text-xs text-zinc-400">de {rewards.length} total</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Recompensas Canjeadas
                </CardTitle>
                <Trophy className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {redemptionHistory.length}
                </div>
                <p className="text-xs text-zinc-400">Total histórico</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Reglas Activas
                </CardTitle>
                <Target className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {pointsRules.filter(rule => rule.is_active).length}
                </div>
                <p className="text-xs text-zinc-400">de {pointsRules.length} total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-panel border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white">Ofertas Activas</CardTitle>
                <CardDescription className="text-zinc-400">
                  Ofertas disponibles para canjear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rewards.filter(r => r.is_active).length > 0 ? (
                    rewards.filter(r => r.is_active).slice(0, 5).map((offer) => (
                      <div key={offer.id || offer.offer_id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-violet-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Gift className="h-4 w-4 text-zinc-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-300 truncate">
                              {offer.name || offer.title}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {offer.description || 'Sin descripción'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {offer.discount_percentage && (
                            <Badge className="bg-yellow-900/50 text-yellow-200">
                              {offer.discount_percentage}% OFF
                            </Badge>
                          )}
                          {offer.discount_amount && (
                            <Badge className="bg-yellow-900/50 text-yellow-200">
                              ${offer.discount_amount} OFF
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No hay ofertas activas disponibles
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white">Acciones Reclamables</CardTitle>
                <CardDescription className="text-zinc-400">
                  Acciones disponibles para reclamar puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claimableActions.length > 0 ? (
                    claimableActions.slice(0, 5).map((action) => (
                      <div key={action.action_id || action.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-violet-600/20 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-zinc-400" />
                          </div>
                      <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-300">
                              {action.action_name || action.name}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {action.description || 'Sin descripción'}
                        </p>
                      </div>
                      </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-zinc-800/50 text-zinc-300">
                            {action.points || 0} pts
                          </Badge>
                          {currentUserId && (
                            <Button
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700"
                              onClick={() => handleClaimAction(action.action_id || action.id)}
                            >
                              Reclamar
                            </Button>
                          )}
                    </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No hay acciones disponibles para reclamar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white">Canjes Recientes</CardTitle>
                <CardDescription className="text-zinc-400">
                  Usuarios que canjearon sus puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redemptionHistory.length > 0 ? (
                    redemptionHistory.slice(0, 5).map((redemption) => (
                    <div key={redemption.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={redemption.user?.avatar || redemption.user?.profile_picture} 
                          alt={redemption.user?.name} 
                        />
                        <AvatarFallback className="bg-violet-600 text-white text-xs">
                          {redemption.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300">
                          <span className="font-medium">{redemption.user?.name || 'Usuario'}</span>
                          <span className="text-zinc-400"> canjeó </span>
                          <span className="font-medium text-zinc-300">{redemption.points_redeemed || 0} pts</span>
                        </p>
                        <p className="text-xs text-zinc-400">
                          {redemption.reward_name || 'Recompensa'}
                        </p>
                          {redemption.redeemed_at && (
                            <p className="text-xs text-purple-500 mt-1">
                              {new Date(redemption.redeemed_at).toLocaleDateString('es-DO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                      </div>
                      <Badge className={
                        redemption.status === 'used' 
                          ? 'bg-green-900/50 text-green-200 border-green-600/30'
                          : 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30'
                      }>
                        {redemption.status === 'used' ? 'Usado' : 'Activo'}
                      </Badge>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No hay canjes recientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Reglas de Puntos</h2>
              <p className="text-zinc-400">Gestiona cómo se otorgan los puntos</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Regla
            </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {isLoadingRules ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
          <div className="grid gap-4">
            {pointsRules.map((rule) => (
                <Card key={rule.id || rule.rule_id} className="glass-panel border-zinc-800/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold text-white">{rule.display_name || rule.rule_name}</h3>
                          <p className="text-zinc-400 text-sm">{rule.description || 'Sin descripción'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getCategoryColor(rule.category || rule.point_type)}>
                              {getCategoryDisplayName(rule.point_type)}
                          </Badge>
                          <Badge className="bg-zinc-800/50 text-zinc-300">
                            {rule.points} puntos
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.is_active}
                          onCheckedChange={() => handleToggleRule(rule.id || rule.rule_id)}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-zinc-400 hover:text-white"
                          onClick={() => handleEdit(rule)}
                        >
                        <Edit className="h-4 w-4" />
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(rule.id || rule.rule_id)}
                        >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
              {pointsRules.length === 0 && (
                <Card className="glass-panel border-zinc-800/50">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Star className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No hay reglas</h3>
                      <p className="text-zinc-400">Crea tu primera regla de puntos para comenzar</p>
          </div>
                  </CardContent>
                </Card>
              )}
          </div>
          )}
        </TabsContent>

        {/* Rewards Tab - Usa el gestor unificado de Promociones y Recompensas */}
        <TabsContent value="rewards" className="space-y-6">
          <PromotionsManager />
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Rankings y Estadísticas</h2>
              <p className="text-zinc-400">Descubre los usuarios y eventos más destacados</p>
            </div>
            <Button 
              onClick={loadRealRankings} 
              disabled={isLoadingRankings}
              className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
            >
              {isLoadingRankings ? 'Cargando...' : 'Actualizar Rankings'}
            </Button>
          </div>

          <Tabs value={rankingTab} onValueChange={setRankingTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-zinc-800/50">
              <TabsTrigger value="puntos" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400">
                <Star className="h-4 w-4 mr-2" />
                Puntos
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="eventos" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400">
                <Trophy className="h-4 w-4 mr-2" />
                Eventos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="puntos" className="space-y-6">
              <Card className="glass-panel border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-zinc-400" />
                    Usuarios con Más Puntos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realRankings.usuariosMasPuntos.map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                        <div className="flex items-center gap-3">
                          <Badge className={getRankColor(index + 1)}>
                            {getRankIcon(index + 1)}
                            #{index + 1}
                          </Badge>
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=7c3aed&color=fff&size=40`} 
                              alt={user.display_name || user.username}
                            />
                            <AvatarFallback className="bg-violet-600 text-white">
                              {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{user.display_name || user.username}</p>
                            <p className="text-sm text-zinc-400">@{user.username}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300">
                          {user.count} puntos
                        </Badge>
                      </div>
                    ))}
                    {realRankings.usuariosMasPuntos.length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        No hay datos disponibles. Haz clic en "Actualizar Rankings" para cargar.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-panel border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-zinc-400" />
                      Más Seguidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realRankings.usuariosMasSuscritos.slice(0, 5).map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getRankColor(index + 1)} variant="outline">
                              {getRankIcon(index + 1)}
                            </Badge>
                            <span className="text-white text-sm">{user.display_name || user.username}</span>
                          </div>
                          <span className="text-zinc-400 text-sm">{user.count} seguidores</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-zinc-400" />
                      Más Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realRankings.usuariosMasLikesDados.slice(0, 5).map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getRankColor(index + 1)} variant="outline">
                              {getRankIcon(index + 1)}
                            </Badge>
                            <span className="text-white text-sm">{user.display_name || user.username}</span>
                          </div>
                          <span className="text-zinc-400 text-sm">{user.count} likes</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="eventos" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-panel border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-zinc-400" />
                      Eventos Más Populares
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realRankings.eventosMasSuscritos.map((event, index) => (
                        <div key={event.event_id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                          <div className="flex items-center gap-3">
                            <Badge className={getRankColor(index + 1)}>
                              {getRankIcon(index + 1)}
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-white">{event.title}</p>
                              {event.organizer && (
                                <div className="flex items-center gap-2 mt-1">
                                  <img 
                                    src={event.organizer.profile_picture || event.organizer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.display_name || event.organizer.username || 'User')}&background=7c3aed&color=fff&size=16`} 
                                    alt={event.organizer.display_name || event.organizer.username}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <p className="text-sm text-zinc-400">
                                    Por: {event.organizer.display_name || event.organizer.username}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300">
                            {event.count} suscriptores
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-zinc-400" />
                      Eventos Más Queridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realRankings.eventosMasLikes.map((event, index) => (
                        <div key={event.event_id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                          <div className="flex items-center gap-3">
                            <Badge className={getRankColor(index + 1)}>
                              {getRankIcon(index + 1)}
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-white">{event.title}</p>
                              {event.organizer && (
                                <div className="flex items-center gap-2 mt-1">
                                  <img 
                                    src={event.organizer.profile_picture || event.organizer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.display_name || event.organizer.username || 'User')}&background=7c3aed&color=fff&size=16`} 
                                    alt={event.organizer.display_name || event.organizer.username}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <p className="text-sm text-zinc-400">
                                    Por: {event.organizer.display_name || event.organizer.username}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300">
                            {event.count} likes
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


          </Tabs>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Actividad de Gamificación</h2>
              <p className="text-zinc-400">Historial de canjes y actividades recientes de todos los usuarios</p>
            </div>
            <Button 
              onClick={() => loadGlobalActivity()} 
              disabled={isLoadingGlobalActivity}
              className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
            >
              {isLoadingGlobalActivity ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>

          {isLoadingGlobalActivity ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-panel border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Historial de Canjes</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Recompensas canjeadas recientemente por todos los usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {globalRedemptions.length > 0 ? (
                      globalRedemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-850">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={redemption.user.avatar} alt={redemption.user.name} />
                            <AvatarFallback className="bg-violet-600 text-white text-sm">
                              {redemption.user.name ? redemption.user.name.charAt(0) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-300">
                              {redemption.user.name}
                            </p>
                            <p className="text-xs text-zinc-400">
                              Canjeó: {redemption.reward_name}
                            </p>
                            <p className="text-xs text-purple-500">
                              {new Date(redemption.redeemed_at).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              redemption.status === 'used' 
                                ? 'bg-green-900/50 text-green-200 border-green-600/30'
                                : 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30'
                            }>
                              {redemption.status === 'used' ? 'Usado' : 'Activo'}
                            </Badge>
                            <p className="text-xs text-zinc-400 mt-1">
                              -{redemption.points_redeemed} pts
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No hay historial de canjes
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Acciones de Puntos</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Actividad reciente de todos los usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {globalActions.length > 0 ? (
                      globalActions.map((action) => (
                        <div key={action.id} className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-850">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={action.user.avatar} alt={action.user.name} />
                            <AvatarFallback className="bg-violet-600 text-white text-sm">
                              {action.user.name ? action.user.name.charAt(0) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-300">
                              {action.user.name}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {action.action_name?.replace('_', ' ') || 'Acción'}
                              {action.event_title && `: ${action.event_title}`}
                            </p>
                            {action.created_at && (
                              <p className="text-xs text-purple-500">
                                {new Date(action.created_at).toLocaleDateString('es-DO')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className="bg-zinc-800/50 text-zinc-300">
                              +{action.points_awarded} pts
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No hay acciones registradas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Rule Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-panel border-zinc-800/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nueva Regla</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Completa la información para crear una nueva regla de puntos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule_name" className="text-zinc-300">Nombre de la Regla *</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ej: Completar perfil"
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="point_type" className="text-zinc-300">Tipo de Punto *</Label>
              <select
                id="point_type"
                value={formData.point_type}
                onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="Profile">Perfil</option>
                <option value="Events">Eventos</option>
                <option value="Engagement">Compromiso</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points" className="text-zinc-300">Puntos (1-5) *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la regla..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-zinc-300">Regla activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:bg-zinc-800/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
              >
                Crear Regla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-panel border-zinc-800/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Regla</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica la información de la regla
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_rule_name" className="text-zinc-300">Nombre de la Regla *</Label>
              <Input
                id="edit_rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ej: Completar perfil"
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_point_type" className="text-zinc-300">Tipo de Punto *</Label>
              <select
                id="edit_point_type"
                value={formData.point_type}
                onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="Profile">Perfil</option>
                <option value="Events">Eventos</option>
                <option value="Engagement">Compromiso</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_points" className="text-zinc-300">Puntos (1-5) *</Label>
              <Input
                id="edit_points"
                type="number"
                min="1"
                max="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description" className="text-zinc-300">Descripción</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la regla..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active" className="text-zinc-300">Regla activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:bg-zinc-800/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
              >
                Actualizar Regla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Offer Modal */}
      <Dialog open={isCreateOfferModalOpen} onOpenChange={(open) => {
        setIsCreateOfferModalOpen(open);
        if (!open) {
          setOfferImageFile(null);
          setOfferImagePreview(null);
          setOfferFormData({
            title: '',
            description: '',
            organizer_id: getCurrentUserId(),
            discount_percentage: null,
            discount_amount: null,
            original_price: null,
            final_price: null,
            start_date: '',
            end_date: '',
            category: '',
            image_url: '',
            terms_conditions: '',
            is_active: true,
            max_uses: null,
            promo_code: '',
            target_audience: 'all',
            offer_type: 'percentage'
          });
        }
      }}>
        <DialogContent className="glass-panel border-zinc-800/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nueva Oferta</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Completa la información para crear una nueva oferta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_title" className="text-zinc-300">Título *</Label>
                <Input
                  id="offer_title"
                  value={offerFormData.title}
                  onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                  placeholder="Ej: Descuento de Verano"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer_category" className="text-zinc-300">Categoría</Label>
                <Input
                  id="offer_category"
                  value={offerFormData.category}
                  onChange={(e) => setOfferFormData({ ...offerFormData, category: e.target.value })}
                  placeholder="Ej: Música, Deportes"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_description" className="text-zinc-300">Descripción</Label>
              <Textarea
                id="offer_description"
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                placeholder="Descripción de la oferta..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_type" className="text-zinc-300">Tipo de Oferta *</Label>
                <select
                  id="offer_type"
                  value={offerFormData.offer_type}
                  onChange={(e) => setOfferFormData({ ...offerFormData, offer_type: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed_amount">Cantidad Fija</option>
                  <option value="free_shipping">Envío Gratis</option>
                  <option value="buy_one_get_one">Compra 1 Lleva 1</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_audience" className="text-zinc-300">Audiencia Objetivo</Label>
                <select
                  id="target_audience"
                  value={offerFormData.target_audience}
                  onChange={(e) => setOfferFormData({ ...offerFormData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos</option>
                  <option value="new_users">Usuarios Nuevos</option>
                  <option value="existing_users">Usuarios Existentes</option>
                  <option value="premium_users">Usuarios Premium</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_percentage" className="text-zinc-300">Descuento %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={offerFormData.discount_percentage || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 10"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount" className="text-zinc-300">Descuento Fijo ($)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  value={offerFormData.discount_amount || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 50"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original_price" className="text-zinc-300">Precio Original</Label>
                <Input
                  id="original_price"
                  type="number"
                  min="0"
                  value={offerFormData.original_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 100"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_price" className="text-zinc-300">Precio Final</Label>
                <Input
                  id="final_price"
                  type="number"
                  min="0"
                  value={offerFormData.final_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, final_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 90"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_required" className="text-zinc-300">Puntos Requeridos *</Label>
              <Input
                id="points_required"
                type="number"
                min="0"
                value={offerFormData.points_required || ''}
                onChange={(e) => setOfferFormData({ ...offerFormData, points_required: e.target.value ? parseInt(e.target.value, 10) : null })}
                placeholder="Ej: 100"
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-zinc-300">Fecha de Inicio *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={offerFormData.start_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, start_date: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-zinc-300">Fecha de Fin *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={offerFormData.end_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, end_date: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo_code" className="text-zinc-300">Código Promocional</Label>
                <Input
                  id="promo_code"
                  value={offerFormData.promo_code}
                  onChange={(e) => setOfferFormData({ ...offerFormData, promo_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: SUMMER50"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses" className="text-zinc-300">Usos Máximos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={offerFormData.max_uses || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Dejar vacío para ilimitado"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_image" className="text-zinc-300">Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {offerImagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-800/50 flex-shrink-0">
                    <img src={offerImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="offer_image"
                    type="file"
                    accept="image/*"
                    onChange={handleOfferImageChange}
                    className="bg-zinc-900/50 border-zinc-800/60 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-zinc-400 mt-1">Selecciona una imagen desde tu dispositivo</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-zinc-300">O desde URL</Label>
              <Input
                id="image_url"
                value={offerFormData.image_url}
                onChange={handleOfferUrlChange}
                placeholder="https://example.com/image.jpg"
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
              />
              <p className="text-xs text-zinc-400">Pega la URL de una imagen (http:// o https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_conditions" className="text-zinc-300">Términos y Condiciones</Label>
              <Textarea
                id="terms_conditions"
                value={offerFormData.terms_conditions}
                onChange={(e) => setOfferFormData({ ...offerFormData, terms_conditions: e.target.value })}
                placeholder="Términos y condiciones de la oferta..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="offer_is_active"
                checked={offerFormData.is_active}
                onCheckedChange={(checked) => setOfferFormData({ ...offerFormData, is_active: checked })}
              />
              <Label htmlFor="offer_is_active" className="text-zinc-300">Oferta activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOfferModalOpen(false)}
                className="text-zinc-400 hover:bg-zinc-800/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
              >
                Crear Oferta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Modal */}
      <Dialog open={isEditOfferModalOpen} onOpenChange={(open) => {
        setIsEditOfferModalOpen(open);
        if (!open) {
          setEditOfferImageFile(null);
          setEditOfferImagePreview(null);
          setSelectedOffer(null);
        }
      }}>
        <DialogContent className="glass-panel border-zinc-800/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Oferta</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica la información de la oferta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_offer_title" className="text-zinc-300">Título *</Label>
                <Input
                  id="edit_offer_title"
                  value={offerFormData.title}
                  onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                  placeholder="Ej: Descuento de Verano"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_offer_category" className="text-zinc-300">Categoría</Label>
                <Input
                  id="edit_offer_category"
                  value={offerFormData.category}
                  onChange={(e) => setOfferFormData({ ...offerFormData, category: e.target.value })}
                  placeholder="Ej: Música, Deportes"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_offer_description" className="text-zinc-300">Descripción</Label>
              <Textarea
                id="edit_offer_description"
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                placeholder="Descripción de la oferta..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_offer_type" className="text-zinc-300">Tipo de Oferta *</Label>
                <select
                  id="edit_offer_type"
                  value={offerFormData.offer_type}
                  onChange={(e) => setOfferFormData({ ...offerFormData, offer_type: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed_amount">Cantidad Fija</option>
                  <option value="free_shipping">Envío Gratis</option>
                  <option value="buy_one_get_one">Compra 1 Lleva 1</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_target_audience" className="text-zinc-300">Audiencia Objetivo</Label>
                <select
                  id="edit_target_audience"
                  value={offerFormData.target_audience}
                  onChange={(e) => setOfferFormData({ ...offerFormData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos</option>
                  <option value="new_users">Usuarios Nuevos</option>
                  <option value="existing_users">Usuarios Existentes</option>
                  <option value="premium_users">Usuarios Premium</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_discount_percentage" className="text-zinc-300">Descuento %</Label>
                <Input
                  id="edit_discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={offerFormData.discount_percentage || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 10"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_discount_amount" className="text-zinc-300">Descuento Fijo ($)</Label>
                <Input
                  id="edit_discount_amount"
                  type="number"
                  min="0"
                  value={offerFormData.discount_amount || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 50"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_original_price" className="text-zinc-300">Precio Original</Label>
                <Input
                  id="edit_original_price"
                  type="number"
                  min="0"
                  value={offerFormData.original_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 100"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_final_price" className="text-zinc-300">Precio Final</Label>
                <Input
                  id="edit_final_price"
                  type="number"
                  min="0"
                  value={offerFormData.final_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, final_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 90"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date" className="text-zinc-300">Fecha de Inicio *</Label>
                <Input
                  id="edit_start_date"
                  type="datetime-local"
                  value={offerFormData.start_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, start_date: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date" className="text-zinc-300">Fecha de Fin *</Label>
                <Input
                  id="edit_end_date"
                  type="datetime-local"
                  value={offerFormData.end_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, end_date: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_promo_code" className="text-zinc-300">Código Promocional</Label>
                <Input
                  id="edit_promo_code"
                  value={offerFormData.promo_code}
                  onChange={(e) => setOfferFormData({ ...offerFormData, promo_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: SUMMER50"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_uses" className="text-zinc-300">Usos Máximos</Label>
                <Input
                  id="edit_max_uses"
                  type="number"
                  min="1"
                  value={offerFormData.max_uses || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Dejar vacío para ilimitado"
                  className="bg-zinc-900/50 border-zinc-800/60 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_offer_image" className="text-zinc-300">Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {editOfferImagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-800/50 flex-shrink-0">
                    <img src={editOfferImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="edit_offer_image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditOfferImageChange}
                    className="bg-zinc-900/50 border-zinc-800/60 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-zinc-400 mt-1">Selecciona una imagen desde tu dispositivo</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_image_url" className="text-zinc-300">O desde URL</Label>
              <Input
                id="edit_image_url"
                value={offerFormData.image_url}
                onChange={handleEditOfferUrlChange}
                placeholder="https://example.com/image.jpg"
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
              />
              <p className="text-xs text-zinc-400">Pega la URL de una imagen (http:// o https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_terms_conditions" className="text-zinc-300">Términos y Condiciones</Label>
              <Textarea
                id="edit_terms_conditions"
                value={offerFormData.terms_conditions}
                onChange={(e) => setOfferFormData({ ...offerFormData, terms_conditions: e.target.value })}
                placeholder="Términos y condiciones de la oferta..."
                className="bg-zinc-900/50 border-zinc-800/60 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_offer_is_active"
                checked={offerFormData.is_active}
                onCheckedChange={(checked) => setOfferFormData({ ...offerFormData, is_active: checked })}
              />
              <Label htmlFor="edit_offer_is_active" className="text-zinc-300">Oferta activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOfferModalOpen(false)}
                className="text-zinc-400 hover:bg-zinc-800/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
              >
                Actualizar Oferta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>



      {/* Manual Redeem Modal */}
      <Dialog open={isManualRedeemModalOpen} onOpenChange={setIsManualRedeemModalOpen}>
        <DialogContent className="bg-zinc-950/95 border border-zinc-800/60 text-white max-w-md backdrop-blur-lg animate-fade-in">
          <DialogHeader>
            <DialogTitle className="text-white">Canjear Recompensa Manual</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Canjea puntos del usuario {selectedUser?.name} por una oferta. Puntos disponibles: {userTotalPoints}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualRedeemSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="redeem_reward_name" className="text-zinc-300">Seleccionar Oferta *</Label>
              <select
                id="redeem_reward_name"
                value={manualRedeemData.offer_id}
                onChange={(e) => {
                  const offer = rewards.find(r => r.id?.toString() === e.target.value || r.offer_id?.toString() === e.target.value);
                  const parsedPoints = offer ? parseFloat(offer.points_required !== undefined && offer.points_required !== null ? offer.points_required : (offer.discount_percentage || offer.discount_amount || 0)) : 0;
                  setManualRedeemData({ 
                    reward_name: offer ? (offer.title || offer.name) : '', 
                    points_required: isNaN(parsedPoints) ? 0 : parsedPoints,
                    offer_id: offer ? (offer.id || offer.offer_id || '').toString() : ''
                  });
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800/60 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              >
                <option value="" className="bg-zinc-950 text-white">Selecciona una recompensa...</option>
                {rewards.filter(r => r.is_active).map((offer) => (
                  <option key={offer.id || offer.offer_id} value={offer.id || offer.offer_id} className="bg-zinc-950 text-white">
                    {offer.title || offer.name} ({offer.points_required || offer.discount_percentage || 0} pts)
                  </option>
                ))}
              </select>
            </div>

            {manualRedeemData.reward_name && (
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg space-y-1">
                <p className="text-xs text-zinc-400">Detalles del Canje</p>
                <p className="text-sm font-semibold text-white">Puntos requeridos: {manualRedeemData.points_required} pts</p>
                {parseFloat(userTotalPoints) < parseFloat(manualRedeemData.points_required) ? (
                  <p className="text-xs text-rose-400 font-medium">⚠️ Puntos insuficientes (Faltan {parseFloat(manualRedeemData.points_required) - parseFloat(userTotalPoints)} pts)</p>
                ) : (
                  <p className="text-xs text-emerald-400 font-medium">✓ Puntos disponibles suficientes</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsManualRedeemModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!manualRedeemData.reward_name || parseFloat(userTotalPoints) < parseFloat(manualRedeemData.points_required)}
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white border border-transparent"
              >
                Canjear Puntos
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamificationManager;