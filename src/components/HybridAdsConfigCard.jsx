import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Gamepad2, 
  Tv, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  Coins,
  Layers,
  Save,
  CheckCircle2,
  ArrowRightLeft,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  getMonetizationConfig, 
  saveMonetizationConfig, 
  getCombinedMonetizationStats 
} from '../services/adsService';
import UnityAdsConfigCard from './UnityAdsConfigCard';
import AdMobConfigCard from './AdMobConfigCard';
import { toast } from 'react-hot-toast';

export default function HybridAdsConfigCard({ onConfigUpdated }) {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [subTab, setSubTab] = useState('hub');
  const [config, setConfig] = useState({
    activeMode: 'hybrid', // 'hybrid' | 'unity' | 'admob'
    primaryProvider: 'unity',
    fallbackProvider: 'admob',
    waterfallEnabled: true,
    pointsReward: 100,
    dailyLimit: 10,
    unityConfig: { isActive: true },
    admobConfig: { isActive: true }
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getMonetizationConfig();
      if (data) {
        setConfig(data);
      }
    } catch (e) {
      console.error('Error cargando configuración unificada:', e);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getCombinedMonetizationStats();
      if (res && res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Error obteniendo métricas combinadas:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSaveStrategy = async (newMode = config.activeMode) => {
    setLoading(true);
    try {
      const updated = {
        ...config,
        activeMode: newMode,
      };
      await saveMonetizationConfig(updated);
      setConfig(updated);
      toast.success(
        newMode === 'hybrid'
          ? '⚡ Modo Híbrido (Unity Ads + AdMob) activado exitosamente'
          : newMode === 'unity'
          ? '🎮 Modo Solo Unity Ads activado exitosamente'
          : '🟡 Modo Solo Google AdMob activado exitosamente'
      );
      if (typeof onConfigUpdated === 'function') {
        try {
          onConfigUpdated(updated);
        } catch (err) {}
      }
    } catch (e) {
      toast.error('Error al guardar estrategia: ' + (e.message || 'Error del servidor'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Principal de Red de Monetización */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          <Zap className="h-64 w-64 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-violet-500/20 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Estrategia Global de Monetización
                </Badge>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 font-mono flex items-center gap-1">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Waterfall Híbrido Activo
                </Badge>
              </div>
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                ⚡ Servidores de Monetización: Unity Ads + Google AdMob
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
                Configura los proveedores de anuncios para que funcionen <strong>de forma independiente (Solo Unity / Solo AdMob)</strong> o <strong>de forma conjunta (Modo Híbrido Waterfall)</strong> conservando todas tus credenciales.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setSubTab('hub')}
                variant={subTab === 'hub' ? 'default' : 'outline'}
                className={subTab === 'hub' ? 'bg-amber-500 text-zinc-950 font-bold text-xs' : 'border-zinc-800 text-zinc-300 text-xs'}
              >
                <Sliders className="h-3.5 w-3.5 mr-1" />
                Estrategia Redes
              </Button>
              <Button
                type="button"
                onClick={() => setSubTab('unity')}
                variant={subTab === 'unity' ? 'default' : 'outline'}
                className={subTab === 'unity' ? 'bg-violet-600 text-white font-bold text-xs' : 'border-zinc-800 text-zinc-300 text-xs'}
              >
                <Gamepad2 className="h-3.5 w-3.5 mr-1 text-violet-400" />
                Unity Ads
              </Button>
              <Button
                type="button"
                onClick={() => setSubTab('admob')}
                variant={subTab === 'admob' ? 'default' : 'outline'}
                className={subTab === 'admob' ? 'bg-amber-600 text-white font-bold text-xs' : 'border-zinc-800 text-zinc-300 text-xs'}
              >
                <Tv className="h-3.5 w-3.5 mr-1 text-amber-400" />
                Google AdMob
              </Button>
            </div>
          </div>

          {subTab === 'hub' && (
            <div className="space-y-6">
              {/* Tarjetas de Selección de Modo */}
              <div>
                <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 block">
                  Selecciona el Modo de Funcionamiento Activo:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Modo Híbrido */}
                  <div
                    onClick={() => handleSaveStrategy('hybrid')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden ${
                      config.activeMode === 'hybrid'
                        ? 'bg-gradient-to-br from-amber-950/50 via-purple-950/50 to-zinc-950 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {config.activeMode === 'hybrid' && (
                      <Badge className="absolute top-3 right-3 bg-amber-500 text-zinc-950 font-bold text-[10px]">
                        ACTIVO
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-white">⚡ Híbrido (Ambos)</h3>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Activa tanto <strong>Unity Ads</strong> como <strong>Google AdMob</strong> simultáneamente con cascada Waterfall de respaldo si un anuncio no se carga.
                    </p>
                  </div>

                  {/* Solo Unity Ads */}
                  <div
                    onClick={() => handleSaveStrategy('unity')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden ${
                      config.activeMode === 'unity'
                        ? 'bg-gradient-to-br from-purple-950/60 via-zinc-900 to-zinc-950 border-purple-500 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/40'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {config.activeMode === 'unity' && (
                      <Badge className="absolute top-3 right-3 bg-purple-600 text-white font-bold text-[10px]">
                        ACTIVO
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-white">🎮 Solo Unity Ads</h3>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Sirve únicamente anuncios a través de la red oficial de <strong>Unity Ads (S2S Callback HMAC)</strong>.
                    </p>
                  </div>

                  {/* Solo Google AdMob */}
                  <div
                    onClick={() => handleSaveStrategy('admob')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden ${
                      config.activeMode === 'admob'
                        ? 'bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {config.activeMode === 'admob' && (
                      <Badge className="absolute top-3 right-3 bg-amber-500 text-zinc-950 font-bold text-[10px]">
                        ACTIVO
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <Tv className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-white">🟡 Solo Google AdMob</h3>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Sirve únicamente anuncios a través de la red oficial de <strong>Google AdMob Network</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ajustes globales de Puntos & Límites */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                  <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-400" />
                    Puntos Recompensa por Anuncio (Global)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.pointsReward}
                    onChange={(e) => setConfig({ ...config, pointsReward: Number(e.target.value) || 100 })}
                    className="bg-zinc-900 border-zinc-800 text-amber-300 font-extrabold text-base focus:border-purple-500"
                  />
                  <span className="text-[10px] text-zinc-500">Puntos otorgados al usuario tanto en Unity Ads como en AdMob</span>
                </div>

                <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                  <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Límite Diario Global por Usuario
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.dailyLimit}
                    onChange={(e) => setConfig({ ...config, dailyLimit: Number(e.target.value) || 10 })}
                    className="bg-zinc-900 border-zinc-800 text-emerald-300 font-extrabold text-base focus:border-purple-500"
                  />
                  <span className="text-[10px] text-zinc-500">Número máximo de recompensas diarias acumulables entre ambas redes</span>
                </div>
              </div>

              {/* Botón de Guardado de Parámetros Globales */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => handleSaveStrategy(config.activeMode)}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sincronizando Estrategia...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Configuración Global de Monetización
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {subTab === 'unity' && (
            <UnityAdsConfigCard onConfigUpdated={() => loadConfig()} />
          )}

          {subTab === 'admob' && (
            <AdMobConfigCard onConfigUpdated={() => loadConfig()} />
          )}
        </div>
      </div>

      {/* Panel de Métricas Combinadas (Híbridas) */}
      <Card className="glass-panel border-zinc-800/50 bg-zinc-950/70">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              Métricas Consolidadas (Unity Ads + Google AdMob)
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Rendimiento unificado e ingresos combinados de ambas plataformas publicitaras.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={statsLoading}
            className="border-zinc-800 text-zinc-300 hover:text-white text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${statsLoading ? 'animate-spin text-amber-400' : ''}`} />
            Actualizar Métricas
          </Button>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <span className="text-xs">Consolidando métricas de Unity y AdMob...</span>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold uppercase">Impresiones Totales</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {(stats.totalImpressions || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold uppercase">Anuncios Completados</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {(stats.totalCompletions || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold uppercase">Ingresos Estimados Totales</span>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    ${Number(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold uppercase">eCPM Combinado</span>
                  <p className="text-2xl font-bold text-sky-400 mt-1">
                    ${Number(stats.combinedEcpm || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Desglose por Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Gamepad2 className="h-4 w-4" /> Unity Ads Network
                    </span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                      S2S HMAC
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>Impresiones: <strong className="text-white">{stats.unity?.impressions || 0}</strong></span>
                    <span>Ingresos: <strong className="text-amber-300">${Number(stats.unity?.revenue || 0).toFixed(2)}</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Tv className="h-4 w-4" /> Google AdMob Network
                    </span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                      App-Ads.txt
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>Impresiones: <strong className="text-white">{stats.admob?.impressions || 0}</strong></span>
                    <span>Ingresos: <strong className="text-amber-300">${Number(stats.admob?.revenue || 0).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-400 text-xs">
              <p>Haz clic en "Actualizar Métricas" para sincronizar estadísticas en vivo.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
