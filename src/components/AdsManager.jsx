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
  Upload
} from 'lucide-react';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  getAdStats
} from '../services/adsService';
import { toast } from 'react-hot-toast';

const AdsManager = () => {
  const [activeTab, setActiveTab] = useState('ads');
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
      const adsList = await getAds();
      setAds(adsList);
      const adStats = await getAdStats();
      setStats(adStats);
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
      await createAd(formData);
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
      await updateAd(selectedAd.id || selectedAd._id, formData);
      toast.success('✨ Anuncio actualizado correctamente');
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
            Configura los Rewarded Ads de &quot;Multiplica 2X tus Puntos&quot;, la duración del anuncio, límites diarios por usuario y consulta las estadísticas de visualizaciones.
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Anuncio
        </Button>
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
              <h3 className="text-2xl font-bold text-sky-400 mt-1">{stats.totalViews?.toLocaleString() || '1,420'}</h3>
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
              <h3 className="text-2xl font-bold text-violet-400 mt-1">{stats.conversionRate || '90.1'}%</h3>
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
        <TabsContent value="ads">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-white flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-amber-400" />
                Catálogo de Anuncios Configurados
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Estos anuncios son servidos al backend y a la app React Native para validar recompensas 2X de puntos.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center p-12 text-zinc-500">
                  No hay anuncios configurados. Presiona &quot;Crear Anuncio&quot; para agregar uno.
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

                        <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/60 rounded-lg text-xs border border-zinc-800/60 mb-4">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span>Duración: <strong>{ad.duration}s</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Zap className="h-3.5 w-3.5 text-amber-400" />
                            <span>Multiplicador: <strong className="text-amber-400">{ad.multiplier}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Award className="h-3.5 w-3.5 text-amber-400" />
                            <span>Recompensa: <strong>{ad.reward}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Límite diario: <strong>{ad.daily_limit} ad/día</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
                        <span>Vistas completadas: <strong className="text-white">{ad.completions_count || 0}</strong></span>
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
              <CardDescription className="text-zinc-400">
                Gestiona convenios con marcas y patrocinadores de eventos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div className="space-y-1">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Campaña Oficial</Badge>
                  <h4 className="text-lg font-bold text-white">Multiplicador Doble Coins Ezploro</h4>
                  <p className="text-xs text-zinc-400">Patrocinado por Ezploro Gamification System • Objetivo: 10,000 reproducciones</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">1,280 / 10,000</span>
                  <p className="text-xs text-zinc-500">12.8% completado</p>
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
              <CardDescription className="text-zinc-400">
                Define el título, tipo, duración y multiplicador de recompensas para la app.
              </CardDescription>
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
                        <SelectItem value="Interstitial">Interstitial (Pantalla Completa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Título del Anuncio</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Multiplica 2X tus Puntos"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Duración (segundos)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Multiplicador</Label>
                    <Input
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                      placeholder="Ej: 2X, 3X, 5X"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Límite Diario</Label>
                    <Input
                      type="number"
                      value={formData.daily_limit}
                      onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                      placeholder="1"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Descripción para el Usuario</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Duplica instantáneamente tus Ezploro Coins acumulados"
                    rows={3}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center justify-between">
                    <span>Imagen o Media del Anuncio</span>
                    <span className="text-xs text-amber-400 font-normal">Selección Local / Archivo</span>
                  </Label>

                  {formData.media_url ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                      <img
                        src={formData.media_url}
                        alt="Ad Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg">
                          <Upload className="h-4 w-4" />
                          Cambiar Archivo Local
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLocalMediaChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, media_url: '' }))}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="h-7 w-7 text-amber-400 mb-1.5 animate-bounce" />
                        <p className="text-xs font-bold text-white mb-0.5">Haz clic para seleccionar imagen del anuncio</p>
                        <p className="text-[11px] text-zinc-500">Selecciona desde tu equipo (PNG, JPG, WEBP)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalMediaChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('ads')} className="border-zinc-700 text-zinc-300">
                    Cancelar
                  </Button>
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
              <CardDescription className="text-zinc-400">
                Rendimiento de reproducciones e impacto en la gamificación.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Coins Entregados por Ads</span>
                  <h2 className="text-3xl font-extrabold text-amber-400 mt-2">128,400 PTS</h2>
                  <p className="text-xs text-zinc-500 mt-1">Acumulado del mes</p>
                </div>
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Promedio de Anuncios / Usuario</span>
                  <h2 className="text-3xl font-extrabold text-sky-400 mt-2">0.92 ad/día</h2>
                  <p className="text-xs text-zinc-500 mt-1">Cerca del límite de 1 por día</p>
                </div>
                <div className="p-5 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Retención tras Anuncio</span>
                  <h2 className="text-3xl font-extrabold text-emerald-400 mt-2">94.8%</h2>
                  <p className="text-xs text-zinc-500 mt-1">Usuarios no abandonan la app</p>
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
            <DialogTitle>Editar Anuncio</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica la duración, multiplicador o límite diario.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (segundos)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Multiplicador</Label>
                <Input
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center justify-between">
                <span>Imagen / Media del Anuncio</span>
                <span className="text-xs text-amber-400 font-normal">Selección Local</span>
              </Label>

              {formData.media_url ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                  <img
                    src={formData.media_url}
                    alt="Ad Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                      <Upload className="h-3.5 w-3.5" />
                      Cambiar Imagen Local
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalMediaChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, media_url: '' }))}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-amber-400 mb-1 animate-bounce" />
                    <p className="text-xs font-bold text-white mb-0.5">Seleccionar imagen local</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalMediaChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-zinc-700 text-zinc-300">
                Cancelar
              </Button>
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
