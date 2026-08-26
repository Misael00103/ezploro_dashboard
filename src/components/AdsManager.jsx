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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Tv,
  PlayCircle,
  Eye,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  Calendar,
  Sparkles,
  Loader2,
  Clock,
  Zap,
  Award,
  Upload,
  RefreshCw,
  Gift
} from 'lucide-react';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  getAdStats,
  getRewardedAdState,
  saveRewardedAdConfig
} from '../services/adsService';
import { toast } from 'react-hot-toast';

const AdsManager = () => {
  const [activeTab, setActiveTab] = useState('ads');
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState({});
  const [rewardedState, setRewardedState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Rewarded Ad',
    duration: 30,
    multiplier: '2X',
    reward: 'Puntos',
    status: 'Activo',
    daily_limit: 1,
    description: '',
    media_url: ''
  });

  const handleLocalMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo multimedia debe pesar menos de 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          media_url: reader.result
        }));
        toast.success('🎬 Banner / Ad local cargado correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Purgar la caché residual del navegador si contenía contadores simulados legacy (1422 / 1282)
      try {
        const raw = localStorage.getItem('ezploro_ads_config');
        if (raw && (raw.includes('1422') || raw.includes('1420') || raw.includes('1282') || raw.includes('1280'))) {
          localStorage.removeItem('ezploro_ads_config');
        }
      } catch (e) {}

      const [adsList, adStats, rewardedInfo] = await Promise.all([
        getAds(),
        getAdStats(),
        getRewardedAdState()
      ]);
      setAds(adsList);
      setStats(adStats);
      setRewardedState(rewardedInfo);
    } catch (error) {
      console.error('Error cargando anuncios:', error);
      toast.error('Error al cargar la información de publicidad');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOpen = () => {
    setFormData({
      title: 'Multiplica 2X tus Puntos',
      type: 'Rewarded Ad',
      duration: 30,
      multiplier: '2X',
      reward: 'Puntos',
      status: 'Activo',
      daily_limit: 1,
      description: 'Duplica instantáneamente tus Ezploro Coins acumulados al ver este anuncio completo de 30s.',
      media_url: ''
    });
    setActiveTab('create');
  };

  const handleEditOpen = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title || '',
      type: ad.type || 'Rewarded Ad',
      duration: ad.duration || 30,
      multiplier: ad.multiplier || '2X',
      reward: ad.reward || 'Puntos',
      status: ad.status || 'Activo',
      daily_limit: ad.daily_limit || 1,
      description: ad.description || '',
      media_url: ad.media_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title) {
        toast.error('El título del anuncio es obligatorio');
        return;
      }
      if (formData.type === 'Rewarded Ad') {
        await saveRewardedAdConfig(formData);
      } else {
        await createAd(formData);
      }
      toast.success('📢 Anuncio creado exitosamente');
      setActiveTab('ads');
      loadData();
    } catch (error) {
      console.error('Error al crear anuncio:', error);
      toast.error('Ocurrió un error al guardar el anuncio');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAd) return;
    try {
      if (formData.type === 'Rewarded Ad' || selectedAd.id === 'ad-rewarded-2x') {
        await saveRewardedAdConfig({ ...selectedAd, ...formData });
      } else {
        await updateAd(selectedAd.id || selectedAd._id, formData);
      }
      toast.success('✨ Configuración guardada correctamente para la app móvil');
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error al actualizar anuncio:', error);
      toast.error('Error al actualizar el anuncio');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const updated = await toggleAdStatus(id);
      if (updated) {
        toast.success(`Anuncio ${updated.status === 'Activo' ? 'Activado' : 'Desactivado'}`);
        loadData();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('No se pudo cambiar el estado del anuncio');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este anuncio?')) {
      try {
        await deleteAd(id);
        toast.success('Anuncio eliminado');
        loadData();
      } catch (error) {
        console.error('Error al eliminar anuncio:', error);
        toast.error('No se pudo eliminar el anuncio');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-amber-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Megaphone className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Publicidad & Ads</h1>
          </div>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Configura los Rewarded Ads de &quot;Multiplica 2X tus Puntos&quot;, la duración del anuncio, límites diarios por usuario y consulta las estadísticas de visualizaciones consumidas por la app móvil.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadData()}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button
            onClick={handleCreateOpen}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Anuncio
          </Button>
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-zinc-800/50 bg-zinc-900/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Anuncios</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalAds || 0}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Tv className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-zinc-800/50 bg-zinc-900/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Anuncios Activos</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeAds || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-zinc-800/50 bg-zinc-900/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Vistas Totales</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1">{(stats.totalViews || 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
              <Eye className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-zinc-800/50 bg-zinc-900/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tasa de Conversión</p>
              <h3 className="text-2xl font-bold text-violet-400 mt-1">{stats.conversionRate || '0.0'}%</h3>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-panel border-zinc-800/50 bg-zinc-950/80 p-1">
          <TabsTrigger value="ads" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-zinc-400">
            <Tv className="h-4 w-4 mr-2" />
            Anuncios (Rewarded Ads)
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-zinc-400">
            <Calendar className="h-4 w-4 mr-2" />
            Campañas
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-zinc-400">
            <Plus className="h-4 w-4 mr-2" />
            Crear Anuncio
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-zinc-400">
            <BarChart2 className="h-4 w-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ads List */}
        <TabsContent value="ads" className="space-y-6">
          {/* Featured Rewarded 2X Configuration Card */}
          {rewardedState && (
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
                <Zap className="h-48 w-48 text-amber-400" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold uppercase tracking-wider">
                        ⭐ Configuración Principal Rewarded Ad 2X
                      </Badge>
                      <Badge className={rewardedState.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                        {rewardedState.status}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                      {rewardedState.title || 'Multiplica 2X tus Puntos'}
                      <span className="text-amber-400 text-lg font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                        {rewardedState.multiplier || '2X'}
                      </span>
                    </h2>
                  </div>

                  <Button
                    onClick={() => handleEditOpen(rewardedState)}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Configuración
                  </Button>
                </div>

                <p className="text-zinc-300 text-sm">{rewardedState.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Duración del Anuncio</span>
                    <div className="flex items-center gap-2 mt-1 text-white font-bold text-lg">
                      <Clock className="h-5 w-5 text-amber-400" />
                      {parseInt(rewardedState.duration) || 30}s
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Límite Diario / Usuario</span>
                    <div className="flex items-center gap-2 mt-1 text-emerald-400 font-bold text-lg">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      {parseInt(rewardedState.daily_limit) || 1} ad/día
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Visualizaciones Móviles</span>
                    <div className="flex items-center gap-2 mt-1 text-sky-400 font-bold text-lg">
                      <Eye className="h-5 w-5 text-sky-400" />
                      {rewardedState.views_count || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Recompensas Reclamadas</span>
                    <div className="flex items-center gap-2 mt-1 text-purple-400 font-bold text-lg">
                      <Award className="h-5 w-5 text-purple-400" />
                      {rewardedState.completions_count || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-white flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-amber-400" />
                Catálogo de Anuncios Configurados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center p-12 text-zinc-500">
                  No hay anuncios configurados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ads.map((ad) => (
                    <div
                      key={ad.id || ad._id}
                      className="glass-panel p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                              {ad.type}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1">{ad.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={ad.status === 'Activo'}
                              onCheckedChange={() => handleToggleStatus(ad.id || ad._id)}
                            />
                            <Badge className={ad.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                              {ad.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{ad.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
                        <span>Vistas: <strong className="text-white">{ad.completions_count || 0}</strong></span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOpen(ad)}
                            className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(ad.id || ad._id)}
                            className="h-8 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Campaigns */}
        <TabsContent value="campaigns">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">Campañas Publicitarias Activas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div className="space-y-1">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Campaña Oficial</Badge>
                  <h4 className="text-lg font-bold text-white">Multiplicador Doble Coins Ezploro</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Create Ad Form */}
        <TabsContent value="create">
          <Card className="glass-panel border-zinc-800/50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Crear Nuevo Anuncio (Ad)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo de Anuncio</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Rewarded Ad">Rewarded Ad (Con Premio)</SelectItem>
                        <SelectItem value="Banner">Banner Promocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Título del Anuncio</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold">
                    Guardar Anuncio
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Statistics */}
        <TabsContent value="stats">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">Estadísticas de Publicidad</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Coins Entregados por Ads</span>
                  <h2 className="text-3xl font-extrabold text-amber-400 mt-2">
                    {((stats.totalCompletions || 0) * 100).toLocaleString()} PTS
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Calculado sobre reproducciones reales completadas</p>
                </div>
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Uso Diario Configurado</span>
                  <h2 className="text-3xl font-extrabold text-sky-400 mt-2">
                    {rewardedState?.daily_limit || 1} ad/día
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Límite por usuario consumible en la app</p>
                </div>
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Tasa de Conversión Real</span>
                  <h2 className="text-3xl font-extrabold text-emerald-400 mt-2">
                    {stats.conversionRate || '0.0'}%
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Vistas completadas en la app móvil</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Configuración de Anuncio</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica la duración, multiplicador, límite diario por usuario y estado servido a la app móvil.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Duración (segundos)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Multiplicador</Label>
                <Input
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Límite Diario</Label>
                <Input
                  type="number"
                  value={formData.daily_limit}
                  onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsManager;

