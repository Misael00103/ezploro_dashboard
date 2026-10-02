import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  Tv, 
  ShieldCheck, 
  Loader2, 
  Activity, 
  Coins, 
  Smartphone, 
  Save, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  getAdMobConfig, 
  saveAdMobConfig, 
  getAdMobMonetizationStats 
} from '../services/adsService';
import { toast } from 'react-hot-toast';

export default function AdMobConfigCard({ onConfigUpdated }) {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [config, setConfig] = useState({
    isActive: true,
    pointsReward: 100,
    dailyLimit: 10,
    publisherId: 'pub-3940256099942544',
    appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
    appIdIos: 'ca-app-pub-3940256099942544~1458002511',
    rewardedUnitIdAndroid: 'ca-app-pub-3940256099942544/5224354917',
    rewardedUnitIdIos: 'ca-app-pub-3940256099942544/1712485313',
    interstitialUnitIdAndroid: 'ca-app-pub-3940256099942544/1033173712',
    bannerUnitIdAndroid: 'ca-app-pub-3940256099942544/6300978111',
    testMode: true,
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getAdMobConfig();
      if (data) {
        setConfig((prev) => ({
          ...prev,
          isActive: data.isActive ?? true,
          pointsReward: Number(data.pointsReward ?? 100) || 100,
          dailyLimit: Number(data.dailyLimit ?? 10) || 10,
          publisherId: data.publisherId || 'pub-3940256099942544',
          appIdAndroid: data.appIdAndroid || 'ca-app-pub-3940256099942544~3347511713',
          appIdIos: data.appIdIos || 'ca-app-pub-3940256099942544~1458002511',
          rewardedUnitIdAndroid: data.rewardedUnitIdAndroid || 'ca-app-pub-3940256099942544/5224354917',
          rewardedUnitIdIos: data.rewardedUnitIdIos || 'ca-app-pub-3940256099942544/1712485313',
          interstitialUnitIdAndroid: data.interstitialUnitIdAndroid || 'ca-app-pub-3940256099942544/1033173712',
          bannerUnitIdAndroid: data.bannerUnitIdAndroid || 'ca-app-pub-3940256099942544/6300978111',
          testMode: data.testMode !== undefined ? data.testMode : true,
        }));
      }
    } catch (e) {
      console.error('Error cargando configuración de AdMob:', e);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getAdMobMonetizationStats();
      if (res && res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('No se pudieron obtener métricas de AdMob:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveAdMobConfig(config);
      toast.success('Configuración de Google AdMob guardada exitosamente');
      if (typeof onConfigUpdated === 'function') {
        try {
          onConfigUpdated(config);
        } catch (callbackErr) {
          console.warn('Error en callback onConfigUpdated:', callbackErr);
        }
      }
    } catch (e) {
      toast.error('Error guardando configuración: ' + (e.message || 'Error del servidor'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de Configuración Google AdMob */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
          <Tv className="h-48 w-48 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Tv className="h-3.5 w-3.5" />
                  Google AdMob Monetization
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  App-Ads.txt Verificado
                </Badge>
              </div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                🟡 Configuración de Google AdMob
              </h2>
              <p className="text-xs text-zinc-400">
                Gestiona tus App IDs y Ad Units de Android / iOS sincronizados con Google AdMob SDK.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300">
                {config.isActive ? 'AdMob Activo' : 'Pausado'}
              </span>
              <Switch
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          {/* Formulario de Campos de AdMob */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 col-span-1 md:col-span-2">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                Publisher ID (Google AdMob Account)
              </Label>
              <Input
                type="text"
                value={config.publisherId}
                onChange={(e) => setConfig({ ...config, publisherId: e.target.value })}
                placeholder="pub-3940256099942544"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">ID de tu cuenta de desarrollador en Google AdMob (Utilizado en app-ads.txt)</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                App ID Android (Google AdMob)
              </Label>
              <Input
                type="text"
                value={config.appIdAndroid}
                onChange={(e) => setConfig({ ...config, appIdAndroid: e.target.value })}
                placeholder="ca-app-pub-3940256099942544~3347511713"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Configurado en AndroidManifest.xml</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                App ID iOS (Google AdMob)
              </Label>
              <Input
                type="text"
                value={config.appIdIos}
                onChange={(e) => setConfig({ ...config, appIdIos: e.target.value })}
                placeholder="ca-app-pub-3940256099942544~1458002511"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Configurado en Info.plist (GADApplicationIdentifier)</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Rewarded Unit ID Android
              </Label>
              <Input
                type="text"
                value={config.rewardedUnitIdAndroid}
                onChange={(e) => setConfig({ ...config, rewardedUnitIdAndroid: e.target.value })}
                placeholder="ca-app-pub-3940256099942544/5224354917"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Bloque de anuncios Recompensados para Android</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Rewarded Unit ID iOS
              </Label>
              <Input
                type="text"
                value={config.rewardedUnitIdIos}
                onChange={(e) => setConfig({ ...config, rewardedUnitIdIos: e.target.value })}
                placeholder="ca-app-pub-3940256099942544/1712485313"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Bloque de anuncios Recompensados para iOS</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                Puntos por Anuncio Visto
              </Label>
              <Input
                type="number"
                min="1"
                value={config.pointsReward}
                onChange={(e) => setConfig({ ...config, pointsReward: Number(e.target.value) || 100 })}
                className="bg-zinc-900 border-zinc-800 text-amber-300 font-bold text-sm focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Recompensa acreditada al usuario tras completar el video</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Límite Diario por Usuario
              </Label>
              <Input
                type="number"
                min="1"
                value={config.dailyLimit}
                onChange={(e) => setConfig({ ...config, dailyLimit: Number(e.target.value) || 10 })}
                className="bg-zinc-900 border-zinc-800 text-emerald-300 font-bold text-sm focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Límite diario de impresiones recompensadas por usuario</span>
            </div>
          </div>

          {/* Test Mode Switch */}
          <div className="p-4 rounded-xl bg-zinc-950/90 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modo Prueba (Test Ads)</h4>
                <p className="text-[11px] text-zinc-400">
                  Usa anuncios de prueba de Google AdMob para evitar penalizaciones o bloqueos de cuenta durante desarrollo.
                </p>
              </div>
            </div>
            <Switch
              checked={config.testMode}
              onCheckedChange={(checked) => setConfig({ ...config, testMode: checked })}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          {/* Botón de Guardado */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando en Servidor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Configuración Google AdMob
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas de Monetización de AdMob */}
      <Card className="glass-panel border-zinc-800/50 bg-zinc-950/70">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              Métricas de Monetización (Google AdMob API)
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Métricas e ingresos sincronizados desde Google AdMob Network.
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
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <span className="text-xs">Consultando API de Google AdMob...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Impresiones</span>
                <p className="text-xl font-bold text-white mt-1">
                  {stats.impressions || stats.totalImpressions || 0}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Completados</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {stats.completions || stats.totalCompletions || 0}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Ingresos Estimados</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  ${Number(stats.revenue || stats.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">eCPM</span>
                <p className="text-xl font-bold text-sky-400 mt-1">
                  ${Number(stats.ecpm || stats.combinedEcpm || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-400 text-xs">
              <p>Credenciales de Google AdMob sincronizadas. Haz clic en "Actualizar" para consultar estadísticas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
