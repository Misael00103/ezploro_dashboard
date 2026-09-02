import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  Gift,
  Crown,
  Sparkles,
  Award,
  History,
  CheckCircle2,
  Clock,
  Edit,
  Save,
  Loader2,
  Trophy,
  ShieldCheck,
  Star,
  Zap,
  Flame,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity
} from 'lucide-react';
import {
  getDailyChestConfig,
  updateDailyChestConfig,
  getDailyRewardHistory
} from '../services/dailyRewardsService';
import {
  getVipPassLevels,
  saveVipPassLevel,
  getVipPassProfile
} from '../services/vipPassService';
import {
  subscribeDashboardGamificationEvents
} from '../services/gamificationService';
import { toast } from 'react-hot-toast';

const DailyRewardsManager = () => {
  const [activeTab, setActiveTab] = useState('daily-chest');
  const [chestConfig, setChestConfig] = useState({});
  const [vipLevels, setVipLevels] = useState([]);
  const [vipProfile, setVipProfile] = useState({
    level: 1,
    levelName: 'Explorador VIP',
    points: 350,
    nextReward: {
      name: 'Entrada Gratis a Festival',
      requiredPoints: 500
    },
    stats: {
      events: 5,
      streak: 3,
      redemptions: 1
    }
  });
  const [historyData, setHistoryData] = useState({
    historial: [],
    resumen: {
      total_ganado: 0,
      total_gastado: 0,
      balance_actual: 0,
      total_acciones: 0,
      total_canjes: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChest, setIsSavingChest] = useState(false);
  const [isSocketActive, setIsSocketActive] = useState(false);

  // Edit VIP Level Modal
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [selectedVipLevel, setSelectedVipLevel] = useState(null);
  const [vipForm, setVipForm] = useState({
    level: 1,
    levelName: '',
    minPoints: 0,
    requiredPointsForNext: 1000,
    nextRewardName: '',
    badgeIcon: '🔰',
    color: '#8b5cf6'
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const chest = await getDailyChestConfig();
      setChestConfig(chest);

      const vip = await getVipPassLevels();
      setVipLevels(vip);

      const profile = await getVipPassProfile();
      setVipProfile(profile);

      const histRes = await getDailyRewardHistory();
      if (histRes && histRes.historial) {
        setHistoryData(histRes);
      } else if (Array.isArray(histRes)) {
        setHistoryData({
          historial: histRes,
          resumen: {
            total_ganado: histRes.reduce((acc, curr) => acc + (curr.points_awarded || curr.puntos || 0), 0),
            total_gastado: 0,
            balance_actual: histRes.reduce((acc, curr) => acc + (curr.points_awarded || curr.puntos || 0), 0),
            total_acciones: histRes.length,
            total_canjes: 0
          }
        });
      }
    } catch (error) {
      console.error('Error cargando datos de premios diarios:', error);
      toast.error('Error al obtener la configuración de premios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSockets realtime subscription to 'gamification_dashboard'
    const unsubscribeSocket = subscribeDashboardGamificationEvents((eventData) => {
      console.log('⚡ Dashboard Socket event received in DailyRewardsManager:', eventData);
      setIsSocketActive(true);
      toast.success(
        `⚡ Nuevo reclamo de cofre/gamificación en tiempo real! (+${eventData.vipPass?.points || 'pts'})`,
        { icon: '🎁', duration: 4000 }
      );

      // Append new event dynamically to history table
      setHistoryData((prev) => {
        const newItem = {
          type: 'accion',
          id: eventData.id || String(Date.now()),
          descripcion: eventData.dailyPrize?.name || `Reclamo de Cofre Místico (Usuario #${eventData.userId || 'App'})`,
          puntos: eventData.vipPass?.points || 45,
          tipo_puntos: 'ganados',
          fecha: eventData.timestamp || new Date().toISOString()
        };
        const updatedHistorial = [newItem, ...(prev.historial || [])];
        const newGanado = (prev.resumen?.total_ganado || 0) + newItem.puntos;
        const newAcciones = (prev.resumen?.total_acciones || 0) + 1;

        return {
          ...prev,
          historial: updatedHistorial,
          resumen: {
            ...prev.resumen,
            total_ganado: newGanado,
            balance_actual: (prev.resumen?.balance_actual || 0) + newItem.puntos,
            total_acciones: newAcciones
          }
        };
      });

      // Update VIP profile stats if included in socket payload
      if (eventData.vipPass) {
        setVipProfile((prev) => ({
          ...prev,
          level: eventData.vipPass.level || prev.level,
          points: eventData.vipPass.points || prev.points,
          stats: {
            ...prev.stats,
            streak: eventData.streak?.current_streak || prev.stats.streak
          }
        }));
      }
    });

    return () => {
      if (typeof unsubscribeSocket === 'function') unsubscribeSocket();
    };
  }, []);

  const handleChestSave = async (e) => {
    e.preventDefault();
    try {
      setIsSavingChest(true);
      const updated = await updateDailyChestConfig(chestConfig);
      setChestConfig(updated);
      toast.success('🎁 Cofre Místico Diario actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando cofre diario:', error);
      toast.error('No se pudo guardar la configuración del cofre');
    } finally {
      setIsSavingChest(false);
    }
  };

  const handleVipEditOpen = (level) => {
    setSelectedVipLevel(level);
    setVipForm({
      level: level.level,
      levelName: level.levelName || '',
      minPoints: level.minPoints || 0,
      requiredPointsForNext: level.requiredPointsForNext || 1000,
      nextRewardName: level.nextRewardName || '',
      badgeIcon: level.badgeIcon || '👑',
      color: level.color || '#8b5cf6'
    });
    setIsVipModalOpen(true);
  };

  const handleVipSave = async (e) => {
    e.preventDefault();
    try {
      const updatedLevels = await saveVipPassLevel(vipForm);
      setVipLevels(updatedLevels);
      toast.success(`👑 Nivel VIP ${vipForm.level} (${vipForm.levelName}) guardado`);
      setIsVipModalOpen(false);
    } catch (error) {
      console.error('Error al guardar nivel VIP:', error);
      toast.error('No se pudo guardar el nivel VIP');
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round(((vipProfile.points || 0) / (vipProfile.nextReward?.requiredPoints || 500)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-emerald-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Gift className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Premios Diarios & Pass VIP</h1>
          </div>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Administra el Cofre Místico de la Suerte, consulta la meta y estado del Pass VIP del Usuario y visualiza historial en tiempo real vía WebSockets.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center bg-zinc-950/80 px-3 py-1.5 rounded-full border border-zinc-800">
          <Zap className={`h-4 w-4 ${isSocketActive ? 'text-emerald-400 animate-pulse' : 'text-purple-400'}`} />
          <span className="text-xs text-zinc-300 font-medium">WebSocket 'gamification_dashboard'</span>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
            Realtime
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 glass-panel border-zinc-800/50 bg-zinc-950/80 p-1">
          <TabsTrigger value="daily-chest" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-zinc-400">
            <Sparkles className="h-4 w-4 mr-2" />
            Cofre Místico Diario
          </TabsTrigger>
          <TabsTrigger value="vip-pass" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-zinc-400">
            <Crown className="h-4 w-4 mr-2" />
            Perfil & Niveles Pass VIP
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-zinc-400">
            <History className="h-4 w-4 mr-2" />
            Historial en Tiempo Real
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily Chest Config */}
        <TabsContent value="daily-chest">
          <Card className="glass-panel border-zinc-800/50 max-w-3xl mx-auto">
            <CardHeader className="border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-400" />
                    Configuración del Juego de Premios Diarios
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Determina la disponibilidad, el cooldown y el rango de Ezploro Coins otorgados por el backend.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Disponible:</span>
                  <Switch
                    checked={!!chestConfig.available}
                    onCheckedChange={(checked) => setChestConfig({ ...chestConfig, available: checked })}
                  />
                  <Badge className={chestConfig.available ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                    {chestConfig.available ? 'Disponible' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <form onSubmit={handleChestSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nombre del Juego / Cofre</Label>
                      <Input
                        value={chestConfig.name || ''}
                        onChange={(e) => setChestConfig({ ...chestConfig, name: e.target.value })}
                        placeholder="Ej: Cofre Místico de la Suerte"
                        className="bg-zinc-900 border-zinc-800 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Tipo de Premio</Label>
                      <Input
                        value={chestConfig.type || 'Premio diario'}
                        onChange={(e) => setChestConfig({ ...chestConfig, type: e.target.value })}
                        placeholder="Premio diario"
                        className="bg-zinc-900 border-zinc-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-purple-400" />
                        Premio Mínimo (pts)
                      </Label>
                      <Input
                        type="number"
                        value={chestConfig.min ?? 10}
                        onChange={(e) => setChestConfig({ ...chestConfig, min: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white font-bold text-amber-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        Premio Máximo (pts)
                      </Label>
                      <Input
                        type="number"
                        value={chestConfig.max ?? 250}
                        onChange={(e) => setChestConfig({ ...chestConfig, max: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white font-bold text-amber-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-purple-400" />
                        Cooldown (horas)
                      </Label>
                      <Input
                        type="number"
                        value={chestConfig.cooldownHours ?? 24}
                        onChange={(e) => setChestConfig({ ...chestConfig, cooldownHours: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Descripción del Cofre Diario</Label>
                    <Textarea
                      value={chestConfig.description || ''}
                      onChange={(e) => setChestConfig({ ...chestConfig, description: e.target.value })}
                      rows={3}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-800">
                    <Button
                      type="submit"
                      disabled={isSavingChest}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold"
                    >
                      {isSavingChest ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Configuración de Cofre
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: VIP Pass Profile & Levels */}
        <TabsContent value="vip-pass" className="space-y-6">
          {/* Dynamic VIP Pass Profile Card */}
          <Card className="glass-panel border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-zinc-950 to-zinc-900">
            <CardHeader className="border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xl">
                    👑
                  </span>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Perfil y Estado Dinámico del Pass VIP
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Resumen del nivel actual, puntos acumulados, meta de recompensa y estadísticas de actividad.
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 px-3 py-1 text-xs">
                  Nivel {vipProfile.level}: {vipProfile.levelName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Progress & Next Reward */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    Puntos Acumulados: <strong className="text-white text-base ml-1">{vipProfile.points} PTS</strong>
                  </span>
                  <span className="text-zinc-400 text-xs">
                    Meta: <strong className="text-emerald-400">{vipProfile.nextReward?.requiredPoints || 500} PTS</strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Progress value={progressPercent} className="h-3 bg-zinc-950" />
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{progressPercent}% completado</span>
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5 text-purple-400" />
                      Próxima Recompensa: {vipProfile.nextReward?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Eventos Asistidos</span>
                    <strong className="text-xl font-bold text-white">{vipProfile.stats?.events ?? 5}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Racha Actual</span>
                    <strong className="text-xl font-bold text-white">{vipProfile.stats?.streak ?? 3} Días 🔥</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Canjes Realizados</span>
                    <strong className="text-xl font-bold text-white">{vipProfile.stats?.redemptions ?? 1}</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configured VIP Levels List */}
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                Niveles y Recompensas de Perfil VIP Pass
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Ajusta las metas de puntos, nombres de nivel y recompensas dinámicas retornadas en la vista de perfil de los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vipLevels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="glass-panel p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-purple-500/40 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lvl.badgeIcon || '👑'}</span>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                            Nivel {lvl.level}
                          </span>
                          <h3 className="text-lg font-bold text-white">{lvl.levelName}</h3>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {lvl.minPoints} PTS min
                      </Badge>
                    </div>

                    <div className="p-3 bg-zinc-950/70 rounded-lg text-xs space-y-1.5 border border-zinc-800/60">
                      <div className="flex justify-between text-zinc-300">
                        <span>Puntos para siguiente meta:</span>
                        <strong className="text-amber-400">{lvl.requiredPointsForNext} PTS</strong>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Siguiente Recompensa:</span>
                        <strong className="text-emerald-400">{lvl.nextRewardName}</strong>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVipEditOpen(lvl)}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Editar Nivel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Real-Time History & Claims */}
        <TabsContent value="history" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-panel border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Total Ganado</span>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                    +{historyData.resumen?.total_ganado || 1250} <span className="text-xs font-normal text-zinc-400">PTS</span>
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="glass-panel border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Total Gastado</span>
                  <h3 className="text-2xl font-bold text-rose-400 mt-1">
                    -{historyData.resumen?.total_gastado || 200} <span className="text-xs font-normal text-zinc-400">PTS</span>
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="glass-panel border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Balance Actual</span>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1">
                    {historyData.resumen?.balance_actual || 1050} <span className="text-xs font-normal text-zinc-400">PTS</span>
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="glass-panel border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Acciones / Canjes</span>
                  <h3 className="text-2xl font-bold text-purple-400 mt-1">
                    {historyData.resumen?.total_acciones || 12} / {historyData.resumen?.total_canjes || 2}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-400" />
                  Historial Completo de Acciones y Premios en Tiempo Real
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Respuesta instantánea emitida vía Gateway WebSocket (Socket.IO 'dashboardGamificationEvent').
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Socket.IO
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {historyData.historial && historyData.historial.length > 0 ? (
                  historyData.historial.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-4 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${item.tipo_puntos === 'gastados' ? 'bg-rose-500/10 text-rose-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {item.tipo_puntos === 'gastados' ? <ArrowDownRight className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.descripcion || item.chest_name || 'Reclamo de Cofre Místico Diario'}</h4>
                          <p className="text-xs text-zinc-400">Tipo: <span className="capitalize text-zinc-300">{item.type || 'acción'}</span> • ID #{item.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${item.tipo_puntos === 'gastados' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {item.tipo_puntos === 'gastados' ? '-' : '+'}{item.puntos || item.points_awarded || 0} PTS
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          {item.fecha ? new Date(item.fecha).toLocaleString() : 'Hoy'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-400">
                    <Gift className="h-12 w-12 mx-auto text-purple-400/50 mb-3" />
                    <p className="font-semibold text-white">No hay reclamos de cofres ni acciones registradas</p>
                    <p className="text-xs text-zinc-500 mt-1">Los eventos en tiempo real aparecan aquí automáticamente cuando los usuarios abran cofres en la app.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit VIP Dialog */}
      <Dialog open={isVipModalOpen} onOpenChange={setIsVipModalOpen}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Nivel VIP Pass {vipForm.level}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica el nombre del nivel, puntos requeridos y recompensa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVipSave} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nombre del Nivel</Label>
              <Input
                value={vipForm.levelName}
                onChange={(e) => setVipForm({ ...vipForm, levelName: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puntos Mínimos</Label>
                <Input
                  type="number"
                  value={vipForm.minPoints}
                  onChange={(e) => setVipForm({ ...vipForm, minPoints: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Puntos para Siguiente Recompensa</Label>
                <Input
                  type="number"
                  value={vipForm.requiredPointsForNext}
                  onChange={(e) => setVipForm({ ...vipForm, requiredPointsForNext: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre de la Siguiente Recompensa</Label>
              <Input
                value={vipForm.nextRewardName}
                onChange={(e) => setVipForm({ ...vipForm, nextRewardName: e.target.value })}
                placeholder="Ej: Entrada Gratis a Festival"
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsVipModalOpen(false)} className="border-zinc-700 text-zinc-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                Guardar Nivel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyRewardsManager;
