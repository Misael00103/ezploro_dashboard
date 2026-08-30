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
  Gift,
  Layers,
  Target,
  Coins
} from 'lucide-react';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  getAdStats,
  getRewardedAdState,
  saveRewardedAdConfig,
  getCampaigns,
  createCampaign,
  updateCampaign,
  toggleCampaignStatus,
  deleteCampaign,
  resetAdsCatalog
} from '../services/adsService';
import { toast } from 'react-hot-toast';

const AdsManager = () => {
  const [activeTab, setActiveTab] = useState('ads');
  const [ads, setAds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({});
  const [rewardedState, setRewardedState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    type: 'Rewarded 2X',
    status: 'Activa',
    target_audience: 'Todos los Usuarios',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    budget_pts: 50000,
    description: ''
  });

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

  const loadCampaignsList = () => {
    const list = getCampaigns();
    setCampaigns(list);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      loadCampaignsList();
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

  const handleOpenCreateCampaign = () => {
    setSelectedCampaign(null);
    setCampaignFormData({
      name: '',
      type: 'Rewarded 2X',
      status: 'Activa',
      target_audience: 'Todos los Usuarios',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      budget_pts: 50000,
      description: ''
    });
    setIsCampaignModalOpen(true);
  };

  const handleOpenEditCampaign = (camp) => {
    setSelectedCampaign(camp);
    setCampaignFormData({
      name: camp.name || '',
      type: camp.type || 'Rewarded 2X',
      status: camp.status || 'Activa',
      target_audience: camp.target_audience || 'Todos los Usuarios',
      start_date: camp.start_date || new Date().toISOString().split('T')[0],
      end_date: camp.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      budget_pts: camp.budget_pts || 50000,
      description: camp.description || ''
    });
    setIsCampaignModalOpen(true);
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!campaignFormData.name) {
      toast.error('El nombre de la campaña es obligatorio');
      return;
    }
    try {
      if (selectedCampaign) {
        await updateCampaign(selectedCampaign.id, campaignFormData);
        toast.success('✨ Campaña actualizada con éxito');
      } else {
        await createCampaign(campaignFormData);
        toast.success('📢 Campaña creada y activada con éxito');
      }
      setIsCampaignModalOpen(false);
      loadCampaignsList();
    } catch (error) {
      toast.error('Error al guardar la campaña');
    }
  };

  const handleToggleCampaign = async (id) => {
    await toggleCampaignStatus(id);
    toast.success('Estado de campaña actualizado');
    loadCampaignsList();
  };

  const handleDeleteCampaign = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta campaña publicitaria?')) {
      await deleteCampaign(id);
      toast.success('Campaña eliminada');
      loadCampaignsList();
    }
  };

  const handleCreateOpen = () => {
    setFormData({
      title: 'Nuevo Anuncio Recompensado 2X',
      type: 'Rewarded Ad',
      duration: 30,
      multiplier: '2X',
      reward: 'Puntos',
      reward_points: 100,
      status: 'Activo',
      daily_limit: 1,
      campaign_name: campaigns[0]?.name || 'Multiplicador Doble Ezploro Coins',
      placement: 'Pantalla de Recompensas',
      ad_unit_id: 'ca-app-pub-3940256099942544/5224354917',
      description: 'Duplica instantáneamente tus Ezploro Coins acumulados al ver este anuncio completo.',
      media_url: ''
    });
    setActiveTab('create');
  };

  const handleEditOpen = (ad) => {
    const targetId = ad ? (ad.id || ad._id) : null;
    const matchedAd = ads.find(a => (targetId && (String(a.id) === String(targetId) || String(a._id) === String(targetId))) || a.title === ad?.title) || ad;
    setSelectedAd(matchedAd);
    setFormData({
      title: matchedAd.title || '',
      type: matchedAd.type || 'Rewarded Ad',
      duration: matchedAd.duration || 30,
      multiplier: matchedAd.multiplier || '2X',
      reward: matchedAd.reward || 'Puntos',
      reward_points: matchedAd.reward_points !== undefined ? matchedAd.reward_points : 100,
      status: matchedAd.status || 'Activo',
      daily_limit: matchedAd.daily_limit || 1,
      campaign_name: matchedAd.campaign_name || campaigns[0]?.name || 'Multiplicador Doble Ezploro Coins',
      placement: matchedAd.placement || 'Pantalla de Recompensas',
      ad_unit_id: matchedAd.ad_unit_id || '',
      description: matchedAd.description || '',
      media_url: matchedAd.media_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleQuickUpdatePrimary = async (fields) => {
    if (!rewardedState) return;
    try {
      const targetId = rewardedState.id || rewardedState._id || 'ad-rewarded-2x';
      const updatedAd = await updateAd(targetId, { ...rewardedState, ...fields });
      const result = await saveRewardedAdConfig(updatedAd);
      setRewardedState(result || updatedAd);
      toast.success('✨ Configuración principal actualizada con éxito');
      await loadData();
    } catch (e) {
      console.error('Error al actualizar configuración principal:', e);
      toast.error('Error al actualizar configuración');
    }
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

  const handleSelectPrimaryAd = async (ad) => {
    if (!ad) return;
    try {
      const updated = {
        ...ad,
        is_active: ad.is_active !== undefined ? ad.is_active : (ad.status ? ad.status === 'Activo' : true),
        status: ad.status || (ad.is_active === false ? 'Inactivo' : 'Activo')
      };
      const result = await saveRewardedAdConfig(updated);
      setRewardedState(result || updated);
      toast.success(`⭐ '${ad.title}' es ahora el Anuncio Principal seleccionado`);
      await loadData();
    } catch (error) {
      console.error('Error al cambiar anuncio principal:', error);
      toast.error('Error al establecer anuncio principal');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAd) return;
    try {
      const targetId = selectedAd.id || selectedAd._id;
      const updatedAd = await updateAd(targetId, formData);
      await saveRewardedAdConfig(updatedAd || { ...selectedAd, ...formData });
      toast.success('✨ Anuncio actualizado con éxito');
      setIsEditModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar anuncio:', error);
      toast.error('Error al actualizar el anuncio');
    }
  };

  const handleToggleStatus = async (adOrId) => {
    try {
      const updated = await toggleAdStatus(adOrId);
      if (updated) {
        toast.success(`Anuncio ${updated.status === 'Activo' ? 'Activado' : 'Desactivado'}`);
        loadData();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('No se pudo cambiar el estado del anuncio');
    }
  };

  const handleDelete = async (adOrId) => {
    if (window.confirm('¿Estás seguro de eliminar este anuncio?')) {
      try {
        await deleteAd(adOrId);
        toast.success('Anuncio eliminado');
        loadData();
      } catch (error) {
        console.error('Error al eliminar anuncio:', error);
        toast.error('No se pudo eliminar el anuncio');
      }
    }
  };

  const handleResetAds = async () => {
    if (window.confirm('¿Restablecer el catálogo de anuncios a los 2 anuncios limpios por defecto?')) {
      try {
        setIsLoading(true);
        await resetAdsCatalog();
        toast.success('🧹 Catálogo restablecido a 2 anuncios limpios');
        await loadData();
      } catch (error) {
        toast.error('Error al restablecer catálogo');
      } finally {
        setIsLoading(false);
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
            onClick={handleResetAds}
            variant="ghost"
            className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white text-xs"
          >
            Restablecer
          </Button>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold uppercase tracking-wider">
                        ⭐ Configuración Principal Rewarded Ad (Transmitido a la App)
                      </Badge>
                      <Badge className={rewardedState.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                        {rewardedState.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        {rewardedState.title || 'Multiplica 2X tus Puntos'}
                        <span className="text-amber-400 text-lg font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                          🎁 {rewardedState.reward_points || 100} PTS ({rewardedState.multiplier || '2X'})
                        </span>
                      </h2>

                      {ads.length > 0 && (() => {
                        const matchedAdInList = ads.find(a => 
                          (rewardedState?.id && String(a.id || a._id) === String(rewardedState.id || rewardedState._id)) ||
                          (rewardedState?.title && a.title === rewardedState.title)
                        );
                        const currentSelectId = matchedAdInList ? String(matchedAdInList.id || matchedAdInList._id) : String(ads[0]?.id || ads[0]?._id || '');

                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 font-semibold">Cambiar Activo:</span>
                            <Select
                              value={currentSelectId}
                              onValueChange={(selectedId) => {
                                const target = ads.find(a => String(a.id || a._id) === String(selectedId));
                                if (target) handleSelectPrimaryAd(target);
                              }}
                            >
                              <SelectTrigger className="bg-zinc-950/90 border-amber-500/40 text-amber-300 font-bold h-8 text-xs w-64">
                                <SelectValue placeholder="Seleccionar Anuncio Principal" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                {ads.map(item => (
                                  <SelectItem key={String(item.id || item._id)} value={String(item.id || item._id)}>
                                    ⭐ {item.title} ({item.reward_points !== undefined ? item.reward_points : 5} PTS)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEditOpen(rewardedState)}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Configuración
                  </Button>
                </div>

                {(rewardedState.media_url || rewardedState.mediaUrl || rewardedState.imageUrl || rewardedState.banner_url) && (
                  <div className="w-full h-40 rounded-xl overflow-hidden my-3 border border-amber-500/30 bg-zinc-950 relative">
                    <img
                      src={rewardedState.media_url || rewardedState.mediaUrl || rewardedState.imageUrl || rewardedState.banner_url}
                      alt={rewardedState.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-zinc-300 text-sm">{rewardedState.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Duración del Anuncio</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                      <Select
                        value={String(rewardedState.duration || 30)}
                        onValueChange={(val) => handleQuickUpdatePrimary({ duration: parseInt(val) || 30 })}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white font-bold h-8 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="15">15 Segundos</SelectItem>
                          <SelectItem value="30">30 Segundos</SelectItem>
                          <SelectItem value="45">45 Segundos</SelectItem>
                          <SelectItem value="60">60 Segundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Puntos PTS Recompensa</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Gift className="h-5 w-5 text-amber-400 shrink-0" />
                      <Input
                        type="number"
                        min="1"
                        key={`pts-${rewardedState.id || 'primary'}-${rewardedState.reward_points}`}
                        defaultValue={rewardedState.reward_points !== undefined ? rewardedState.reward_points : 100}
                        onBlur={(e) => {
                          const pts = parseInt(e.target.value) || 100;
                          if (pts !== rewardedState.reward_points) {
                            handleQuickUpdatePrimary({ reward_points: pts, rewardPoints: pts, points: pts });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const pts = parseInt(e.target.value) || 100;
                            handleQuickUpdatePrimary({ reward_points: pts, rewardPoints: pts, points: pts });
                          }
                        }}
                        className="bg-zinc-900 border-zinc-700 text-amber-300 font-bold h-8 text-xs w-full"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Límite Diario / Usuario</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
                      <Select
                        value={String(rewardedState.daily_limit || 1)}
                        onValueChange={(val) => handleQuickUpdatePrimary({ daily_limit: parseInt(val) || 1 })}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-emerald-400 font-bold h-8 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="1">1 Anuncio / día</SelectItem>
                          <SelectItem value="2">2 Anuncios / día</SelectItem>
                          <SelectItem value="3">3 Anuncios / día</SelectItem>
                          <SelectItem value="5">5 Anuncios / día</SelectItem>
                          <SelectItem value="10">10 Anuncios / día</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Visualizaciones / Recompensas</span>
                    <div className="flex items-center gap-2 mt-2 text-sky-300 font-bold text-xs">
                      <Eye className="h-4 w-4 text-sky-400" />
                      <span>{rewardedState.views_count || 0} vistas</span>
                      <Award className="h-4 w-4 text-purple-400 ml-1" />
                      <span>{rewardedState.completions_count || 0} ok</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-white text-lg font-bold">Catálogo de Anuncios Configurados</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Gestiona la lista de todos tus anuncios. Puedes seleccionar cuál transmitir como Anuncio Principal a la App Móvil.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-12 text-zinc-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-400" />
                  Cargando catálogo de anuncios...
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center p-12 text-zinc-500">
                  No hay anuncios configurados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ads.map((ad) => {
                    const isPrimary = Boolean(rewardedState && (
                      (rewardedState.id && ad.id && String(rewardedState.id) === String(ad.id)) ||
                      (rewardedState._id && ad._id && String(rewardedState._id) === String(ad._id))
                    ));
                    return (
                      <div
                        key={ad.id || ad._id}
                        className={`glass-panel p-5 rounded-xl border transition-all flex flex-col justify-between ${
                          isPrimary ? 'border-amber-500/60 bg-amber-950/10' : 'border-zinc-800/80 bg-zinc-900/50 hover:border-amber-500/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                  {ad.type}
                                </span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                  🎁 {ad.reward_points || 100} PTS ({ad.multiplier || '2X'})
                                </span>
                                {isPrimary && (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold uppercase">
                                    <Sparkles className="h-3 w-3 mr-1 text-amber-400" /> Principal Activo
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-white mt-1">{ad.title}</h3>
                              <span className="inline-block text-[11px] font-medium text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-800/40 mt-1">
                                🎯 Campaña: {ad.campaign_name || 'Multiplicador Doble Ezploro Coins'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={ad.status === 'Activo'}
                                onCheckedChange={() => handleToggleStatus(ad)}
                              />
                              <Badge className={ad.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                                {ad.status}
                              </Badge>
                            </div>
                          </div>

                          {(ad.media_url || ad.mediaUrl || ad.imageUrl || ad.banner_url || ad.bannerUrl) && (
                            <div className="w-full h-32 rounded-xl overflow-hidden my-3 border border-zinc-800/80 bg-zinc-950 relative group">
                              <img
                                src={ad.media_url || ad.mediaUrl || ad.imageUrl || ad.banner_url || ad.bannerUrl}
                                alt={ad.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{ad.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
                          <span>Vistas: <strong className="text-white">{ad.completions_count || 0}</strong></span>
                          <div className="flex items-center gap-2">
                            {!isPrimary && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectPrimaryAd(ad)}
                                className="h-8 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 text-xs font-semibold"
                              >
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                Transmitir a App
                              </Button>
                            )}
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
                              onClick={() => handleDelete(ad)}
                              className="h-8 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Campaigns */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Campañas Publicitarias</h2>
              <p className="text-xs text-zinc-400">Crea, edita y administra presupuestos, fechas y audiencias de campañas publicitarias.</p>
            </div>
            <Button
              onClick={handleOpenCreateCampaign}
              className="bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-zinc-950 font-bold shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="glass-panel p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge className={camp.status === 'Activa' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
                        {camp.status}
                      </Badge>
                      <h3 className="text-xl font-extrabold text-white mt-2">{camp.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={camp.status === 'Activa'}
                        onCheckedChange={() => handleToggleCampaign(camp.id)}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 line-clamp-2">{camp.description}</p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block font-medium">Tipo & Audiencia</span>
                      <span className="text-amber-300 font-bold">{camp.type} • {camp.target_audience}</span>
                    </div>

                    <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block font-medium">Presupuesto PTS</span>
                      <span className="text-purple-300 font-bold">{(camp.budget_pts || 50000).toLocaleString()} PTS</span>
                    </div>

                    <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 col-span-2">
                      <span className="text-zinc-400 block font-medium">Vigencia de la Campaña</span>
                      <span className="text-white font-mono">{camp.start_date} ➔ {camp.end_date}</span>
                    </div>
                  </div>

                  {(() => {
                    const linkedAds = ads.filter(a => (a.campaign_name && a.campaign_name === camp.name) || (!a.campaign_name && camp.name === 'Multiplicador Doble Ezploro Coins'));
                    return (
                      <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-1.5 mt-2">
                        <span className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">Anuncios Vinculados ({linkedAds.length}):</span>
                        {linkedAds.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {linkedAds.map(la => (
                              <Badge key={la.id || la._id} className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px]">
                                📺 {la.title} ({la.type})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic block">Sin anuncios vinculados a esta campaña</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditCampaign(camp)}
                    className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar Campaña
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="h-8 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Create Ad Form */}
        <TabsContent value="create">
          <Card className="glass-panel border-zinc-800/50 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-400" />
                Crear Nuevo Anuncio (Ad)
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Personaliza campañas publicitarias, rewarded ads, placements y límites servidos a la app móvil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo de Anuncio</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Rewarded Ad">Rewarded Ad (Con Premio 2X/3X)</SelectItem>
                        <SelectItem value="Banner">Banner Promocional</SelectItem>
                        <SelectItem value="Interstitial">Interstitial (Pantalla Completa)</SelectItem>
                        <SelectItem value="Special Offer">Oferta Especial / Patrocinado</SelectItem>
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

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Campaña Publicitaria</Label>
                    <Select
                      value={formData.campaign_name || (campaigns[0]?.name || 'Multiplicador Doble Ezploro Coins')}
                      onValueChange={(val) => setFormData({ ...formData, campaign_name: val })}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue placeholder="Seleccionar Campaña" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            🎯 {c.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="Sin Campaña (Global)">Sin Campaña (Global)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Duración (Segundos)</Label>
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
                      placeholder="Ej: 2X, 3X"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Puntos Recompensa (PTS)</Label>
                    <Input
                      type="number"
                      value={formData.reward_points || 100}
                      onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) || 0 })}
                      placeholder="Ej: 100 PTS"
                      className="bg-zinc-900 border-zinc-800 text-amber-400 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Límite Diario / Usuario</Label>
                    <Input
                      type="number"
                      value={formData.daily_limit}
                      onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Estado Inicial</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Ubicación en App (Placement)</Label>
                    <Select value={formData.placement || 'Pantalla de Recompensas'} onValueChange={(val) => setFormData({ ...formData, placement: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Pantalla de Recompensas">Pantalla de Recompensas (Ganar Puntos)</SelectItem>
                        <SelectItem value="Home Principal">Home Principal</SelectItem>
                        <SelectItem value="Detalle de Eventos">Detalle de Eventos</SelectItem>
                        <SelectItem value="Suscripción VIP">Suscripción VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Google AdMob Ad Unit ID (Opcional)</Label>
                    <Input
                      value={formData.ad_unit_id || ''}
                      onChange={(e) => setFormData({ ...formData, ad_unit_id: e.target.value })}
                      placeholder="ca-app-pub-3940256099942544/5224354917"
                      className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Descripción del Beneficio</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Escribe la descripción visible para los usuarios en la app..."
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300">Imagen / Banner del Anuncio (Opcional)</Label>
                    {formData.media_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, media_url: '' })}
                        className="h-6 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs p-0 px-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Quitar Foto / Dejar sin imagen
                      </Button>
                    )}
                  </div>

                  {formData.media_url && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 my-2 relative">
                      <img src={formData.media_url} alt="Vista previa" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalMediaChange}
                      className="bg-zinc-900 border-zinc-800 text-white text-xs cursor-pointer"
                    />
                    <Input
                      type="url"
                      placeholder="o pega URL de imagen (https://...)"
                      value={formData.media_url || ''}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear y Activar Anuncio
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
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Configuración de Anuncio</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica la duración, multiplicador, límite diario por usuario, placement y estado servido a la app móvil.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Título del Anuncio</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
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
                    <SelectItem value="Special Offer">Oferta Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Campaña Publicitaria</Label>
                <Select
                  value={formData.campaign_name || (campaigns[0]?.name || 'Multiplicador Doble Ezploro Coins')}
                  onValueChange={(val) => setFormData({ ...formData, campaign_name: val })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Seleccionar Campaña" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        🎯 {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Sin Campaña (Global)">Sin Campaña (Global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Duración (s)</Label>
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
                <Label className="text-zinc-300 text-xs">Puntos PTS</Label>
                <Input
                  type="number"
                  value={formData.reward_points || 100}
                  onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-900 border-zinc-800 text-amber-400 font-bold"
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
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Estado</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Ubicación (Placement)</Label>
                <Select value={formData.placement || 'Pantalla de Recompensas'} onValueChange={(val) => setFormData({ ...formData, placement: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Pantalla de Recompensas">Pantalla de Recompensas</SelectItem>
                    <SelectItem value="Home Principal">Home Principal</SelectItem>
                    <SelectItem value="Detalle de Eventos">Detalle de Eventos</SelectItem>
                    <SelectItem value="Suscripción VIP">Suscripción VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">AdMob Unit ID</Label>
                <Input
                  value={formData.ad_unit_id || ''}
                  onChange={(e) => setFormData({ ...formData, ad_unit_id: e.target.value })}
                  placeholder="ca-app-pub-..."
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-xs">Descripción del Anuncio</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 text-xs">Imagen / Banner del Anuncio (Opcional)</Label>
                {formData.media_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, media_url: '' })}
                    className="h-6 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs p-0 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Quitar Foto / Dejar sin imagen
                  </Button>
                )}
              </div>

              {formData.media_url && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 my-2 relative">
                  <img src={formData.media_url} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalMediaChange}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs cursor-pointer"
                />
                <Input
                  type="url"
                  placeholder="o pega URL de imagen (https://...)"
                  value={formData.media_url || ''}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
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

      {/* Edit Campaign Dialog */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign ? 'Editar Campaña Publicitaria' : 'Crear Nueva Campaña Publicitaria'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Define los parámetros de vigencia, audiencia, presupuesto de puntos y estado de la campaña.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCampaignSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nombre de la Campaña</Label>
                <Input
                  value={campaignFormData.name}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                  placeholder="Ej: Multiplicador Doble Ezploro Coins"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Tipo de Campaña</Label>
                <Select value={campaignFormData.type} onValueChange={(val) => setCampaignFormData({ ...campaignFormData, type: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Rewarded 2X">Rewarded 2X (Recompensa Doble)</SelectItem>
                    <SelectItem value="Banner Destacado">Banner Destacado</SelectItem>
                    <SelectItem value="Patrocinio Especial">Patrocinio Especial de Eventos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Audiencia Objetivo</Label>
                <Select value={campaignFormData.target_audience} onValueChange={(val) => setCampaignFormData({ ...campaignFormData, target_audience: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="Todos los Usuarios">Todos los Usuarios</SelectItem>
                    <SelectItem value="Usuarios VIP">Usuarios VIP</SelectItem>
                    <SelectItem value="Nuevos Usuarios">Nuevos Usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Presupuesto Puntos (PTS)</Label>
                <Input
                  type="number"
                  value={campaignFormData.budget_pts}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, budget_pts: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Estado Inicial</Label>
                <Select value={campaignFormData.status} onValueChange={(val) => setCampaignFormData({ ...campaignFormData, status: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="Activa">Activa</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={campaignFormData.start_date}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, start_date: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Fecha de Finalización</Label>
                <Input
                  type="date"
                  value={campaignFormData.end_date}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, end_date: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-xs">Descripción de la Campaña</Label>
              <Textarea
                value={campaignFormData.description}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                rows={2}
                placeholder="Escribe la descripción de la campaña publicitaria..."
                className="bg-zinc-900 border-zinc-800 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold">
                {selectedCampaign ? 'Guardar Cambios' : 'Crear Campaña'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsManager;

