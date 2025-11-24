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
  mockGamificationActions, 
  mockPointsRules, 
  mockUserRankings, 
  mockRedemptionHistory 
} from '../mock';
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
import { registerAction, getUserPoints, redeemReward, getUserHistory } from '../services/gamificationService';
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

const GamificationManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pointsRules, setPointsRules] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [userRankings, setUserRankings] = useState(mockUserRankings);
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
      
      // Cargar todo en paralelo, incluso si hay errores
      const results = await Promise.allSettled([
        loadRules(),
        loadOffers(),
        userId ? loadUserData(userId) : Promise.resolve(),
        userId ? loadActivity(userId) : Promise.resolve()
      ]);
      
      // Log de resultados
      results.forEach((result, index) => {
        const names = ['loadRules', 'loadOffers', 'loadUserData', 'loadActivity'];
        if (result.status === 'rejected') {
          console.error(`🔴 Error en ${names[index]}:`, result.reason);
        } else {
          console.log(`✅ ${names[index]} completado`);
        }
      });
    };
    
    loadInitialData();
  }, []);

  const loadUserData = async (userId) => {
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
      const totalPoints = pointsData?.total_points 
        || pointsData?.points 
        || pointsData?.count 
        || (typeof pointsData === 'number' ? pointsData : 0);
      
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

  const loadActivity = async (userId) => {
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
            name: action.user?.display_name || action.user?.name || 'Usuario',
            avatar: action.user?.profile_picture || action.user?.avatar
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
            name: reward.user?.display_name || reward.user?.name || 'Usuario',
              avatar: reward.user?.profile_picture || reward.user?.avatar,
              email: reward.user?.email
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

  const loadRules = async () => {
    try {
      setIsLoadingRules(true);
      const rules = await getAllRules();
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
      setPointsRules(mappedRules);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Error al cargar las reglas');
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
      const mappedRewards = offers.map(offer => ({
        id: offer.offer_id,
        offer_id: offer.offer_id,
        name: offer.title,
        title: offer.title,
        description: offer.description || '',
        points_required: offer.discount_percentage || offer.discount_amount || 0,
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
      }));
      
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
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta oferta?')) {
      return;
    }

    try {
      const reward = rewards.find(r => r.id === rewardId || r.offer_id === rewardId);
      if (!reward) return;

      const offerId = reward.offer_id || reward.id;
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
      default: return 'bg-purple-600/20 text-purple-300 border-purple-600/30';
    }
  };

  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase();
    switch (cat) {
      case 'events': return 'bg-blue-600/20 text-blue-300 border-blue-600/30';
      case 'engagement': return 'bg-green-600/20 text-green-300 border-green-600/30';
      case 'profile': return 'bg-purple-600/20 text-purple-300 border-purple-600/30';
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
      default: return <span className="text-purple-400">{position}</span>;
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30';
      case 2: return 'bg-gray-900/50 text-gray-200 border-gray-600/30';
      case 3: return 'bg-amber-900/50 text-amber-200 border-amber-600/30';
      default: return 'bg-purple-900/50 text-purple-200 border-purple-600/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Gamificación</h1>
          <p className="text-purple-300 mt-2">Gestiona puntos, recompensas y clasificaciones</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-black/30 border border-purple-500/30">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger 
            value="points" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Star className="h-4 w-4 mr-2" />
            Puntos
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Gift className="h-4 w-4 mr-2" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger 
            value="rankings" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Crown className="h-4 w-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">
                  Total Puntos Otorgados
                </CardTitle>
                <Star className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userTotalPoints.toLocaleString()}
                </div>
                <p className="text-xs text-purple-300">Puntos del usuario actual</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">
                  Acciones Disponibles
                </CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{claimableActions.length}</div>
                <p className="text-xs text-purple-300">Para reclamar puntos</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">
                  Ofertas Disponibles
                </CardTitle>
                <Gift className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {rewards.filter(r => r.is_active).length}
                </div>
                <p className="text-xs text-purple-300">de {rewards.length} total</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">
                  Recompensas Canjeadas
                </CardTitle>
                <Trophy className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {redemptionHistory.length}
                </div>
                <p className="text-xs text-purple-300">Total histórico</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">
                  Reglas Activas
                </CardTitle>
                <Target className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {pointsRules.filter(rule => rule.is_active).length}
                </div>
                <p className="text-xs text-purple-300">de {pointsRules.length} total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Ofertas Activas</CardTitle>
                <CardDescription className="text-purple-300">
                  Ofertas disponibles para canjear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rewards.filter(r => r.is_active).length > 0 ? (
                    rewards.filter(r => r.is_active).slice(0, 5).map((offer) => (
                      <div key={offer.id || offer.offer_id} className="flex items-center justify-between p-3 rounded-lg bg-purple-900/10">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Gift className="h-4 w-4 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-200 truncate">
                              {offer.name || offer.title}
                            </p>
                            <p className="text-xs text-purple-400 truncate">
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
                    <div className="text-center py-8 text-purple-300">
                      No hay ofertas activas disponibles
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Acciones Reclamables</CardTitle>
                <CardDescription className="text-purple-300">
                  Acciones disponibles para reclamar puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claimableActions.length > 0 ? (
                    claimableActions.slice(0, 5).map((action) => (
                      <div key={action.action_id || action.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-900/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-purple-400" />
                          </div>
                      <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-200">
                              {action.action_name || action.name}
                            </p>
                            <p className="text-xs text-purple-400">
                              {action.description || 'Sin descripción'}
                        </p>
                      </div>
                      </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-purple-900/50 text-purple-200">
                            {action.points || 0} pts
                          </Badge>
                          {currentUserId && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleClaimAction(action.action_id || action.id)}
                            >
                              Reclamar
                            </Button>
                          )}
                    </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-purple-300">
                      No hay acciones disponibles para reclamar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Canjes Recientes</CardTitle>
                <CardDescription className="text-purple-300">
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
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {redemption.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-purple-200">
                          <span className="font-medium">{redemption.user?.name || 'Usuario'}</span>
                          <span className="text-purple-300"> canjeó </span>
                          <span className="font-medium text-purple-200">{redemption.points_redeemed || 0} pts</span>
                        </p>
                        <p className="text-xs text-purple-400">
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
                    <div className="text-center py-8 text-purple-300">
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
              <p className="text-purple-300">Gestiona cómo se otorgan los puntos</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Regla
            </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {isLoadingRules ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
          <div className="grid gap-4">
            {pointsRules.map((rule) => (
                <Card key={rule.id || rule.rule_id} className="bg-black/40 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold text-white">{rule.display_name || rule.rule_name}</h3>
                          <p className="text-purple-300 text-sm">{rule.description || 'Sin descripción'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getCategoryColor(rule.category || rule.point_type)}>
                              {getCategoryDisplayName(rule.point_type)}
                          </Badge>
                          <Badge className="bg-purple-900/50 text-purple-200">
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
                          className="text-purple-300 hover:text-white"
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
                <Card className="bg-black/40 border-purple-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Star className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No hay reglas</h3>
                      <p className="text-purple-300">Crea tu primera regla de puntos para comenzar</p>
          </div>
                  </CardContent>
                </Card>
              )}
          </div>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Recompensas</h2>
              <p className="text-purple-300">Administra las recompensas disponibles</p>
            </div>
            <Dialog open={isCreateOfferModalOpen} onOpenChange={setIsCreateOfferModalOpen}>
              <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recompensa
            </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {isLoadingOffers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
          <div className="grid gap-4 md:grid-cols-2">
              {rewards.length > 0 ? (
                rewards.map((reward) => (
                  <Card key={reward.id || reward.offer_id} className="bg-black/40 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            {reward.image_url ? (
                              <img 
                                src={reward.image_url} 
                                alt={reward.name || reward.title}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full rounded-lg flex items-center justify-center ${reward.image_url ? 'hidden' : ''}`}>
                        <Gift className="h-6 w-6 text-purple-400" />
                      </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white">{reward.name || reward.title}</h3>
                            <p className="text-purple-300 text-sm mt-1 line-clamp-2">{reward.description}</p>
                            <div className="flex items-center flex-wrap gap-2 mt-3">
                              {reward.discount_percentage && (
                          <Badge className="bg-yellow-900/50 text-yellow-200 border-yellow-600/30">
                                  {reward.discount_percentage}% OFF
                          </Badge>
                              )}
                              {reward.discount_amount && (
                                <Badge className="bg-yellow-900/50 text-yellow-200 border-yellow-600/30">
                                  ${reward.discount_amount} OFF
                                </Badge>
                              )}
                          <Badge className={getCategoryColor(reward.category)}>
                                {reward.category || reward.offer_type || 'discounts'}
                          </Badge>
                          <span className="text-xs text-purple-400">
                                Canjeado {reward.times_redeemed || 0} veces
                          </span>
                              {reward.promo_code && (
                                <Badge className="bg-purple-900/50 text-purple-200">
                                  {reward.promo_code}
                                </Badge>
                              )}
                        </div>
                            {reward.final_price && (
                              <p className="text-sm text-purple-200 mt-2">
                                Precio final: ${reward.final_price}
                              </p>
                            )}
                      </div>
                    </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                      <Switch
                        checked={reward.is_active}
                            onCheckedChange={() => handleToggleReward(reward.id || reward.offer_id)}
                      />
                      <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-purple-300 hover:text-white"
                              onClick={() => handleEditOffer(reward)}
                            >
                          <Edit className="h-4 w-4" />
                        </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteOffer(reward.id || reward.offer_id)}
                            >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))
              ) : (
                <Card className="bg-black/40 border-purple-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Gift className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No hay ofertas</h3>
                      <p className="text-purple-300">Crea tu primera oferta para comenzar</p>
          </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Rankings y Estadísticas</h2>
              <p className="text-purple-300">Descubre los usuarios y eventos más destacados</p>
            </div>
            <Button 
              onClick={loadRealRankings} 
              disabled={isLoadingRankings}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isLoadingRankings ? 'Cargando...' : 'Actualizar Rankings'}
            </Button>
          </div>

          <Tabs value={rankingTab} onValueChange={setRankingTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-purple-500/30">
              <TabsTrigger value="puntos" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300">
                <Star className="h-4 w-4 mr-2" />
                Puntos
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="eventos" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300">
                <Trophy className="h-4 w-4 mr-2" />
                Eventos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="puntos" className="space-y-6">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-400" />
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
                            <AvatarFallback className="bg-purple-600 text-white">
                              {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{user.display_name || user.username}</p>
                            <p className="text-sm text-purple-300">@{user.username}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                          {user.count} puntos
                        </Badge>
                      </div>
                    ))}
                    {realRankings.usuariosMasPuntos.length === 0 && (
                      <div className="text-center py-8 text-purple-300">
                        No hay datos disponibles. Haz clic en "Actualizar Rankings" para cargar.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
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
                          <span className="text-purple-300 text-sm">{user.count} seguidores</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-400" />
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
                          <span className="text-purple-300 text-sm">{user.count} likes</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="eventos" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
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
                                  <p className="text-sm text-purple-300">
                                    Por: {event.organizer.display_name || event.organizer.username}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                            {event.count} suscriptores
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-400" />
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
                                  <p className="text-sm text-purple-300">
                                    Por: {event.organizer.display_name || event.organizer.username}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
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
            <p className="text-purple-300">Historial de canjes y actividades recientes</p>
            </div>
            {currentUserId && (
              <Button 
                onClick={() => loadActivity(currentUserId)} 
                disabled={isLoadingActivity}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoadingActivity ? 'Cargando...' : 'Actualizar'}
              </Button>
            )}
          </div>

          {isLoadingActivity ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Historial de Canjes</CardTitle>
                <CardDescription className="text-purple-300">
                  Recompensas canjeadas recientemente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redemptionHistory.length > 0 ? (
                    redemptionHistory.map((redemption) => (
                    <div key={redemption.id} className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/10">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={redemption.user.avatar} alt={redemption.user.name} />
                        <AvatarFallback className="bg-purple-600 text-white text-sm">
                          {redemption.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-200">
                          {redemption.user.name}
                        </p>
                        <p className="text-xs text-purple-400">
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
                        <p className="text-xs text-purple-400 mt-1">
                          -{redemption.points_redeemed} pts
                        </p>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-8 text-purple-300">
                      No hay historial de canjes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Acciones de Puntos</CardTitle>
                <CardDescription className="text-purple-300">
                  Actividad reciente de usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gamificationActions.length > 0 ? (
                    gamificationActions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/10">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={action.user.avatar} alt={action.user.name} />
                        <AvatarFallback className="bg-purple-600 text-white text-sm">
                          {action.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-200">
                          {action.user.name}
                        </p>
                        <p className="text-xs text-purple-400">
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
                        <Badge className="bg-purple-900/50 text-purple-200">
                          +{action.points_awarded} pts
                        </Badge>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-8 text-purple-300">
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
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nueva Regla</DialogTitle>
            <DialogDescription className="text-purple-300">
              Completa la información para crear una nueva regla de puntos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule_name" className="text-purple-200">Nombre de la Regla *</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ej: Completar perfil"
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="point_type" className="text-purple-200">Tipo de Punto *</Label>
              <select
                id="point_type"
                value={formData.point_type}
                onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="Profile">Perfil</option>
                <option value="Events">Eventos</option>
                <option value="Engagement">Compromiso</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points" className="text-purple-200">Puntos (1-5) *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-purple-200">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la regla..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-purple-200">Regla activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Crear Regla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Regla</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información de la regla
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_rule_name" className="text-purple-200">Nombre de la Regla *</Label>
              <Input
                id="edit_rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ej: Completar perfil"
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_point_type" className="text-purple-200">Tipo de Punto *</Label>
              <select
                id="edit_point_type"
                value={formData.point_type}
                onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="Profile">Perfil</option>
                <option value="Events">Eventos</option>
                <option value="Engagement">Compromiso</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_points" className="text-purple-200">Puntos (1-5) *</Label>
              <Input
                id="edit_points"
                type="number"
                min="1"
                max="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description" className="text-purple-200">Descripción</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la regla..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active" className="text-purple-200">Regla activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nueva Oferta</DialogTitle>
            <DialogDescription className="text-purple-300">
              Completa la información para crear una nueva oferta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_title" className="text-purple-200">Título *</Label>
                <Input
                  id="offer_title"
                  value={offerFormData.title}
                  onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                  placeholder="Ej: Descuento de Verano"
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer_category" className="text-purple-200">Categoría</Label>
                <Input
                  id="offer_category"
                  value={offerFormData.category}
                  onChange={(e) => setOfferFormData({ ...offerFormData, category: e.target.value })}
                  placeholder="Ej: Música, Deportes"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_description" className="text-purple-200">Descripción</Label>
              <Textarea
                id="offer_description"
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                placeholder="Descripción de la oferta..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_type" className="text-purple-200">Tipo de Oferta *</Label>
                <select
                  id="offer_type"
                  value={offerFormData.offer_type}
                  onChange={(e) => setOfferFormData({ ...offerFormData, offer_type: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed_amount">Cantidad Fija</option>
                  <option value="free_shipping">Envío Gratis</option>
                  <option value="buy_one_get_one">Compra 1 Lleva 1</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_audience" className="text-purple-200">Audiencia Objetivo</Label>
                <select
                  id="target_audience"
                  value={offerFormData.target_audience}
                  onChange={(e) => setOfferFormData({ ...offerFormData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <Label htmlFor="discount_percentage" className="text-purple-200">Descuento %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={offerFormData.discount_percentage || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 10"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount" className="text-purple-200">Descuento Fijo ($)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  value={offerFormData.discount_amount || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 50"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original_price" className="text-purple-200">Precio Original</Label>
                <Input
                  id="original_price"
                  type="number"
                  min="0"
                  value={offerFormData.original_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 100"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_price" className="text-purple-200">Precio Final</Label>
                <Input
                  id="final_price"
                  type="number"
                  min="0"
                  value={offerFormData.final_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, final_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 90"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_required" className="text-purple-200">Puntos Requeridos *</Label>
              <Input
                id="points_required"
                type="number"
                min="0"
                value={offerFormData.points_required || ''}
                onChange={(e) => setOfferFormData({ ...offerFormData, points_required: e.target.value ? parseInt(e.target.value, 10) : null })}
                placeholder="Ej: 100"
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-purple-200">Fecha de Inicio *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={offerFormData.start_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, start_date: e.target.value })}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-purple-200">Fecha de Fin *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={offerFormData.end_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, end_date: e.target.value })}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo_code" className="text-purple-200">Código Promocional</Label>
                <Input
                  id="promo_code"
                  value={offerFormData.promo_code}
                  onChange={(e) => setOfferFormData({ ...offerFormData, promo_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: SUMMER50"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses" className="text-purple-200">Usos Máximos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={offerFormData.max_uses || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Dejar vacío para ilimitado"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_image" className="text-purple-200">Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {offerImagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30 flex-shrink-0">
                    <img src={offerImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="offer_image"
                    type="file"
                    accept="image/*"
                    onChange={handleOfferImageChange}
                    className="bg-black/50 border-purple-500/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-purple-400 mt-1">Selecciona una imagen desde tu dispositivo</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-purple-200">O desde URL</Label>
              <Input
                id="image_url"
                value={offerFormData.image_url}
                onChange={handleOfferUrlChange}
                placeholder="https://example.com/image.jpg"
                className="bg-black/50 border-purple-500/30 text-white"
              />
              <p className="text-xs text-purple-400">Pega la URL de una imagen (http:// o https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_conditions" className="text-purple-200">Términos y Condiciones</Label>
              <Textarea
                id="terms_conditions"
                value={offerFormData.terms_conditions}
                onChange={(e) => setOfferFormData({ ...offerFormData, terms_conditions: e.target.value })}
                placeholder="Términos y condiciones de la oferta..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="offer_is_active"
                checked={offerFormData.is_active}
                onCheckedChange={(checked) => setOfferFormData({ ...offerFormData, is_active: checked })}
              />
              <Label htmlFor="offer_is_active" className="text-purple-200">Oferta activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOfferModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Oferta</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información de la oferta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_offer_title" className="text-purple-200">Título *</Label>
                <Input
                  id="edit_offer_title"
                  value={offerFormData.title}
                  onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                  placeholder="Ej: Descuento de Verano"
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_offer_category" className="text-purple-200">Categoría</Label>
                <Input
                  id="edit_offer_category"
                  value={offerFormData.category}
                  onChange={(e) => setOfferFormData({ ...offerFormData, category: e.target.value })}
                  placeholder="Ej: Música, Deportes"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_offer_description" className="text-purple-200">Descripción</Label>
              <Textarea
                id="edit_offer_description"
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                placeholder="Descripción de la oferta..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_offer_type" className="text-purple-200">Tipo de Oferta *</Label>
                <select
                  id="edit_offer_type"
                  value={offerFormData.offer_type}
                  onChange={(e) => setOfferFormData({ ...offerFormData, offer_type: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed_amount">Cantidad Fija</option>
                  <option value="free_shipping">Envío Gratis</option>
                  <option value="buy_one_get_one">Compra 1 Lleva 1</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_target_audience" className="text-purple-200">Audiencia Objetivo</Label>
                <select
                  id="edit_target_audience"
                  value={offerFormData.target_audience}
                  onChange={(e) => setOfferFormData({ ...offerFormData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <Label htmlFor="edit_discount_percentage" className="text-purple-200">Descuento %</Label>
                <Input
                  id="edit_discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={offerFormData.discount_percentage || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 10"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_discount_amount" className="text-purple-200">Descuento Fijo ($)</Label>
                <Input
                  id="edit_discount_amount"
                  type="number"
                  min="0"
                  value={offerFormData.discount_amount || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discount_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 50"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_original_price" className="text-purple-200">Precio Original</Label>
                <Input
                  id="edit_original_price"
                  type="number"
                  min="0"
                  value={offerFormData.original_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 100"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_final_price" className="text-purple-200">Precio Final</Label>
                <Input
                  id="edit_final_price"
                  type="number"
                  min="0"
                  value={offerFormData.final_price || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, final_price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Ej: 90"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date" className="text-purple-200">Fecha de Inicio *</Label>
                <Input
                  id="edit_start_date"
                  type="datetime-local"
                  value={offerFormData.start_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, start_date: e.target.value })}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date" className="text-purple-200">Fecha de Fin *</Label>
                <Input
                  id="edit_end_date"
                  type="datetime-local"
                  value={offerFormData.end_date}
                  onChange={(e) => setOfferFormData({ ...offerFormData, end_date: e.target.value })}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_promo_code" className="text-purple-200">Código Promocional</Label>
                <Input
                  id="edit_promo_code"
                  value={offerFormData.promo_code}
                  onChange={(e) => setOfferFormData({ ...offerFormData, promo_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: SUMMER50"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_uses" className="text-purple-200">Usos Máximos</Label>
                <Input
                  id="edit_max_uses"
                  type="number"
                  min="1"
                  value={offerFormData.max_uses || ''}
                  onChange={(e) => setOfferFormData({ ...offerFormData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Dejar vacío para ilimitado"
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_offer_image" className="text-purple-200">Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {editOfferImagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30 flex-shrink-0">
                    <img src={editOfferImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="edit_offer_image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditOfferImageChange}
                    className="bg-black/50 border-purple-500/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-purple-400 mt-1">Selecciona una imagen desde tu dispositivo</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_image_url" className="text-purple-200">O desde URL</Label>
              <Input
                id="edit_image_url"
                value={offerFormData.image_url}
                onChange={handleEditOfferUrlChange}
                placeholder="https://example.com/image.jpg"
                className="bg-black/50 border-purple-500/30 text-white"
              />
              <p className="text-xs text-purple-400">Pega la URL de una imagen (http:// o https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_terms_conditions" className="text-purple-200">Términos y Condiciones</Label>
              <Textarea
                id="edit_terms_conditions"
                value={offerFormData.terms_conditions}
                onChange={(e) => setOfferFormData({ ...offerFormData, terms_conditions: e.target.value })}
                placeholder="Términos y condiciones de la oferta..."
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_offer_is_active"
                checked={offerFormData.is_active}
                onCheckedChange={(checked) => setOfferFormData({ ...offerFormData, is_active: checked })}
              />
              <Label htmlFor="edit_offer_is_active" className="text-purple-200">Oferta activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOfferModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Actualizar Oferta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamificationManager;