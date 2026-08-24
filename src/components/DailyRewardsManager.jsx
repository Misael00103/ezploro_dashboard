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
  Star
} from 'lucide-react';
import {
  getDailyChestConfig,
  updateDailyChestConfig,
  getDailyRewardHistory
} from '../services/dailyRewardsService';
import {
  getVipPassLevels,
  saveVipPassLevel
} from '../services/vipPassService';
import { toast } from 'react-hot-toast';

const DailyRewardsManager = () => {
  const [activeTab, setActiveTab] = useState('daily-chest');
  const [chestConfig, setChestConfig] = useState({});
  const [vipLevels, setVipLevels] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChest, setIsSavingChest] = useState(false);

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

      const hist = await getDailyRewardHistory();
      setHistory(hist);
    } catch (error) {
      console.error('Error cargando datos de premios diarios:', error);
      toast.error('Error al obtener la configuración de premios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
            Administra el Cofre Místico de la Suerte (premios diarios aleatorios, min/max points, cooldown) y configura los niveles y recompensas del Pass VIP.
          </p>
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
            Niveles Pass VIP
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-zinc-400">
            <History className="h-4 w-4 mr-2" />
            Historial de Entregas
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

        {/* Tab 2: VIP Pass Levels */}
        <TabsContent value="vip-pass">
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

        {/* Tab 3: History */}
        <TabsContent value="history">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">Historial de Cofres y Recompensas</CardTitle>
              <CardDescription className="text-zinc-400">
                Registro de usuarios que abrieron el cofre místico diario.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id || item.claimed_at} className="flex items-center justify-between p-4 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.user_name || item.username || item.user_email || 'Usuario'}</h4>
                          <p className="text-xs text-zinc-400">{item.user_email || item.email || 'App Usuario'} • {item.chest_name || item.action_name || 'Cofre Místico de la Suerte'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-400">+{item.points_awarded || item.points || 0} PTS</span>
                        <p className="text-[11px] text-zinc-500">
                          {item.claimed_at ? new Date(item.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-400">
                    <Gift className="h-12 w-12 mx-auto text-purple-400/50 mb-3" />
                    <p className="font-semibold text-white">No hay reclamos de cofres registrados aún</p>
                    <p className="text-xs text-zinc-500 mt-1">Los reclamos de cofres y premios diarios de los usuarios en la app aparecerán aquí en tiempo real.</p>
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
