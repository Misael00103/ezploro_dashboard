import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  Gamepad2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles, 
  Loader2, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  Coins,
  Layers,
  Smartphone,
  Save,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  getUnityAdsConfig, 
  saveUnityAdsConfig, 
  getUnityMonetizationStats 
} from '../services/adsService';
import { toast } from 'react-hot-toast';

export default function UnityAdsConfigCard({ onConfigUpdated }) {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [config, setConfig] = useState({
    isActive: true,
    pointsReward: 100,
    dailyLimit: 10,
    gameIdAndroid: '',
    gameIdIos: '',
    placementAndroid: 'Rewarded_Android',
    placementIos: 'Rewarded_iOS',
    s2sCallbackUrl: 'https://api-v5-backend-ezploro.apps.ezploro.com/api/gamification/unity-callback?sid={user_id}&oid={order_id}&hmac={hash}',
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getUnityAdsConfig();
      if (data) {
        setConfig((prev) => ({
          ...prev,
          isActive: data.isActive ?? data.is_active ?? true,
          pointsReward: Number(data.pointsReward ?? data.points_reward ?? 100) || 100,
          dailyLimit: Number(data.dailyLimit ?? data.daily_limit ?? 10) || 10,
          gameIdAndroid: data.gameIdAndroid || data.game_id_android || data.android?.gameId || '',
          gameIdIos: data.gameIdIos || data.game_id_ios || data.ios?.gameId || '',
          placementAndroid: data.placementAndroid || data.placement_android || data.android?.placementId || 'Rewarded_Android',
          placementIos: data.placementIos || data.placement_ios || data.ios?.placementId || 'Rewarded_iOS',
          s2sCallbackUrl: 'https://api-v5-backend-ezploro.apps.ezploro.com/api/gamification/unity-callback?sid={user_id}&oid={order_id}&hmac={hash}',
        }));
      }
    } catch (e) {
      console.error('Error cargando configuración de Unity Ads:', e);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getUnityMonetizationStats();
      if (res && res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('No se pudieron obtener métricas de Unity:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveUnityAdsConfig(config);
      toast.success('Configuración de Unity Ads guardada exitosamente');
      if (onConfigUpdated) onConfigUpdated(config);
    } catch (e) {
      toast.error('Error guardando configuración: ' + (e.message || 'Error del servidor'));
    } finally {
      setLoading(false);
    }
  };

  const copyS2SUrl = () => {
    navigator.clipboard.writeText(config.s2sCallbackUrl);
    setCopiedCallback(true);
    toast.success('URL del Callback S2S copiada');
    setTimeout(() => setCopiedCallback(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de Configuración Unity Ads */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-zinc-900 to-zinc-950 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
          <Gamepad2 className="h-48 w-48 text-purple-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Unity Ads Monetization (Reemplazo AdMob)
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  S2S HMAC SHA-256 Verificado
                </Badge>
              </div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                🎮 Configuración de Unity Ads (Recompensas)
              </h2>
              <p className="text-xs text-zinc-400">
                Administra los Game IDs de iOS / Android y los placements de anuncios recompensados sincronizados en tiempo real con la App Móvil.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300">
                {config.isActive ? 'Monetización Activa' : 'Pausada'}
              </span>
              <Switch
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>

          {/* Formulario de Campos de Unity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-purple-400" />
                Game ID Android
              </Label>
              <Input
                type="text"
                value={config.gameIdAndroid}
                onChange={(e) => setConfig({ ...config, gameIdAndroid: e.target.value })}
                placeholder="Ej: 5891234"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Obtenido en Unity Cloud Dashboard &gt; Monetization</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-purple-400" />
                Game ID iOS
              </Label>
              <Input
                type="text"
                value={config.gameIdIos}
                onChange={(e) => setConfig({ ...config, gameIdIos: e.target.value })}
                placeholder="Ej: 5891235"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Identificador del proyecto Unity para dispositivos Apple</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                Placement ID Android
              </Label>
              <Input
                type="text"
                value={config.placementAndroid}
                onChange={(e) => setConfig({ ...config, placementAndroid: e.target.value })}
                placeholder="Rewarded_Android"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Nombre del Ad Unit Recompensado en Unity Console</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                Placement ID iOS
              </Label>
              <Input
                type="text"
                value={config.placementIos}
                onChange={(e) => setConfig({ ...config, placementIos: e.target.value })}
                placeholder="Rewarded_iOS"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Nombre del Ad Unit Recompensado para iOS</span>
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
                className="bg-zinc-900 border-zinc-800 text-amber-300 font-bold text-sm focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Cantidad de puntos acreditados automáticamente al usuario tras ver el anuncio completo</span>
            </div>

            <div className="space-y-2 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Límite Diario por Usuario
              </Label>
              <Input
                type="number"
                min="1"
                value={config.dailyLimit}
                onChange={(e) => setConfig({ ...config, dailyLimit: Number(e.target.value) || 10 })}
                className="bg-zinc-900 border-zinc-800 text-emerald-300 font-bold text-sm focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Número máximo de anuncios recompensados que puede ver cada usuario por día</span>
            </div>
          </div>

          {/* S2S Callback URL Helper Box */}
          <div className="p-4 rounded-xl bg-zinc-950/90 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Server-to-Server (S2S) Callback URL para Unity Cloud Dashboard
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyS2SUrl}
                className="border-purple-500/40 text-purple-300 hover:bg-purple-950/50 text-xs h-7"
              >
                {copiedCallback ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copiar URL
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Pega esta URL exacta en tu Ad Unit de Unity Cloud &gt; <strong>Server-to-server redeem callback</strong>:
            </p>
            <div className="p-2.5 bg-black/60 rounded-lg border border-zinc-800 text-xs font-mono text-purple-300 break-all select-all">
              {config.s2sCallbackUrl}
            </div>
          </div>

          {/* Botón de Guardado */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando en Servidor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Configuración Unity Ads
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas de Monetización en Tiempo Real */}
      <Card className="glass-panel border-zinc-800/50 bg-zinc-950/70">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Métricas de Monetización en Tiempo Real (Unity Cloud API)
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Datos sincronizados directamente desde la API oficial de Unity Monetization mediante Service Account.
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
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${statsLoading ? 'animate-spin text-purple-400' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <span className="text-xs">Consultando API de Unity Monetization...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Impresiones</span>
                <p className="text-xl font-bold text-white mt-1">
                  {stats.impressions || stats.data?.impressions || stats.adImpressions || 0}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Completados</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {stats.completions || stats.data?.completions || 0}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Ingresos Estimados</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  ${Number(stats.revenue || stats.data?.revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">eCPM</span>
                <p className="text-xl font-bold text-sky-400 mt-1">
                  ${Number(stats.ecpm || stats.data?.ecpm || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-400 text-xs">
              <p>Credenciales de Unity Cloud conectadas. Haz clic en "Actualizar" para consultar estadísticas de monetización en vivo.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
