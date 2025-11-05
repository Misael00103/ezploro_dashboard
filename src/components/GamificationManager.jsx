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
  mockRewards, 
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
import { toast } from 'react-hot-toast';

const GamificationManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pointsRules, setPointsRules] = useState([]);
  const [rewards, setRewards] = useState(mockRewards);
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
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

  // Cargar reglas y datos iniciales desde el backend
  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
    loadRules();
    if (userId) {
      loadUserData(userId);
      loadActivity(userId);
    }
  }, []);

  const loadUserData = async (userId) => {
    try {
      const pointsData = await getUserPoints(userId);
      setUserTotalPoints(pointsData.total_points || 0);
      
      const actions = await getClaimableActions(userId);
      setClaimableActions(actions || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadActivity = async (userId) => {
    try {
      setIsLoadingActivity(true);
      const history = await getUserHistory(userId);
      
      // Mapear acciones del backend al formato del frontend
      if (history.actions && Array.isArray(history.actions)) {
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
        setGamificationActions(mappedActions);
      }

      // Mapear canjes del backend al formato del frontend
      if (history.rewards && Array.isArray(history.rewards)) {
        const mappedRewards = history.rewards.map(reward => ({
          id: reward.user_reward_id || reward.id,
          user: {
            name: reward.user?.display_name || reward.user?.name || 'Usuario',
            avatar: reward.user?.profile_picture || reward.user?.avatar
          },
          reward_name: reward.reward_name,
          points_redeemed: reward.points_redeemed || 0,
          redeemed_at: reward.redeemed_at || reward.created_at,
          status: reward.status || 'active'
        }));
        setRedemptionHistory(mappedRewards);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      toast.error('Error al cargar la actividad');
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

  const handleToggleReward = (rewardId) => {
    setRewards(prev => prev.map(reward => 
      reward.id === rewardId ? { ...reward, is_active: !reward.is_active } : reward
    ));
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  Recompensas Canjeadas
                </CardTitle>
                <Gift className="h-4 w-4 text-purple-400" />
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
                <CardTitle className="text-white">Acciones Recientes</CardTitle>
                <CardDescription className="text-purple-300">
                  Últimas actividades de puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gamificationActions.length > 0 ? (
                    gamificationActions.slice(0, 5).map((action) => (
                    <div key={action.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                        <Award className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-purple-200">
                          <span className="font-medium">{action.user.name}</span>
                          <span className="text-purple-300"> ganó </span>
                          <span className="font-medium text-purple-200">{action.points_awarded} pts</span>
                        </p>
                        <p className="text-xs text-purple-400">
                            {action.action_name?.replace('_', ' ').toUpperCase() || 'Acción'}
                            {action.event_title && ` - ${action.event_title}`}
                        </p>
                          {action.created_at && (
                            <p className="text-xs text-purple-500 mt-1">
                              {new Date(action.created_at).toLocaleDateString('es-DO')}
                            </p>
                          )}
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-purple-300">
                      No hay acciones recientes
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
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recompensa
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id} className="bg-black/40 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Gift className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{reward.name}</h3>
                        <p className="text-purple-300 text-sm mt-1">{reward.description}</p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge className="bg-yellow-900/50 text-yellow-200 border-yellow-600/30">
                            {reward.points_required} pts
                          </Badge>
                          <Badge className={getCategoryColor(reward.category)}>
                            {reward.category}
                          </Badge>
                          <span className="text-xs text-purple-400">
                            Canjeado {reward.times_redeemed} veces
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Switch
                        checked={reward.is_active}
                        onCheckedChange={() => handleToggleReward(reward.id)}
                      />
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
};

export default GamificationManager;