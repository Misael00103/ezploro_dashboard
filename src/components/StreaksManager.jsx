import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import {
  Flame,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  Save,
  Loader2,
  Zap,
  Shield,
  HelpCircle
} from 'lucide-react';
import {
  getStreakConfig,
  updateStreakConfig
} from '../services/streakService';
import {
  subscribeDashboardGamificationEvents,
  subscribeStreakEvents
} from '../services/gamificationService';
import { toast } from 'react-hot-toast';

const StreaksManager = () => {
  const [streakConfig, setStreakConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSocketActive, setIsSocketActive] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const config = await getStreakConfig();
      setStreakConfig(config);
    } catch (error) {
      console.error('Error cargando configuración de rachas:', error);
      toast.error('Error al cargar la configuración de rachas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Suscripción WebSocket a eventos de rachas en tiempo real
    const unsubscribeDashboard = subscribeDashboardGamificationEvents((eventData) => {
      if (eventData.streak || eventData.type === 'streak') {
        console.log('⚡ Evento en tiempo real de Racha recibido en StreaksManager:', eventData);
        setIsSocketActive(true);
        toast.success(`🔥 Racha diaria actualizada en tiempo real (Usuario #${eventData.userId || ''})`, { icon: '⚡' });
        loadData();
      }
    });

    const unsubscribeStreak = subscribeStreakEvents({
      onStreakUpdated: (data) => {
        console.log('⚡ Evento dailyStreakUpdated:', data);
        setIsSocketActive(true);
        toast.success(`🔥 Racha acumulada: ${data.current_streak || ''} días!`, { icon: '⚡' });
        loadData();
      },
      onCheckIn: (data) => {
        console.log('⚡ Evento streakCheckIn:', data);
        setIsSocketActive(true);
        toast.success(`🔥 Check-in diario registrado para Usuario #${data.userId || ''}`, { icon: '✅' });
        loadData();
      }
    });

    return () => {
      if (typeof unsubscribeDashboard === 'function') unsubscribeDashboard();
      if (typeof unsubscribeStreak === 'function') unsubscribeStreak();
    };
  }, []);

  const handleFieldChange = (field, value) => {
    if (!streakConfig) return;
    const updated = { ...streakConfig };

    if (field === 'target' || field === 'target_days' || field === 'targetDays') {
      const val = parseInt(value) || 0;
      updated.target = val;
      updated.target_days = val;
      updated.targetDays = val;
    } else if (field === 'basePointsPerDay' || field === 'base_points_per_day') {
      const val = parseInt(value) || 0;
      updated.basePointsPerDay = val;
      updated.base_points_per_day = val;
    } else if (field === 'freezeCostPoints' || field === 'freeze_streak_cost') {
      const val = parseInt(value) || 0;
      updated.freezeCostPoints = val;
      updated.freeze_streak_cost = val;
    } else if (field === 'rules_summary' || field === 'summary_rules') {
      updated.rules_summary = value;
      updated.summary_rules = value;
    } else if (field === 'enabled' || field === 'is_active') {
      updated.enabled = !!value;
      updated.is_active = !!value;
    } else {
      updated[field] = value;
    }

    setStreakConfig(updated);
  };

  const handleDayChange = (index, field, value) => {
    if (!streakConfig) return;
    const daysList = streakConfig.days_config || streakConfig.daysConfig || streakConfig.days || streakConfig.daysOfWeek || [];
    const updatedDays = [...daysList];
    const dayItem = { ...updatedDays[index] };

    if (field === 'bonus' || field === 'is_bonus' || field === 'isBonus' || field === 'bonusDay') {
      const boolVal = !!value;
      dayItem.bonus = boolVal;
      dayItem.is_bonus = boolVal;
      dayItem.isBonus = boolVal;
      dayItem.bonusDay = boolVal;
    } else if (field === 'points' || field === 'points_day' || field === 'pointsDay' || field === 'puntos') {
      const numPts = parseInt(value) || 0;
      dayItem.points = numPts;
      dayItem.points_day = numPts;
      dayItem.pointsDay = numPts;
      dayItem.puntos = numPts;
    } else {
      dayItem[field] = value;
    }

    updatedDays[index] = dayItem;

    setStreakConfig({
      ...streakConfig,
      days: updatedDays,
      days_config: updatedDays,
      daysConfig: updatedDays,
      daysOfWeek: updatedDays
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!streakConfig) return;

    try {
      setIsSaving(true);
      const updated = await updateStreakConfig(streakConfig);
      setStreakConfig(updated);
      toast.success('🔥 Configuración de Rachas Diarias guardada con éxito');
    } catch (error) {
      console.error('Error guardando configuración de rachas:', error);
      toast.error('Ocurrió un error al guardar las rachas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isSystemEnabled = !!(streakConfig?.enabled ?? streakConfig?.is_active);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-amber-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Configuración de Rachas Diarias</h1>
          </div>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Controla los objetivos de rachas de 7 días, puntos base por día, días con bonus especial (⭐) y costo de protección de racha.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <Zap className={`h-4 w-4 ${isSocketActive ? 'text-emerald-400 animate-pulse' : 'text-orange-400'}`} />
            <span className="text-xs text-zinc-300 font-medium">Socket Realtime</span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Live</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Sistema de Rachas:</span>
            <Switch
              checked={isSystemEnabled}
              onCheckedChange={(checked) => handleFieldChange('enabled', checked)}
            />
            <Badge className={isSystemEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
              {isSystemEnabled ? 'Activo' : 'Pausado'}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Settings Card */}
        <Card className="glass-panel border-zinc-800/50">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-400" />
              Parámetros Generales de la Racha
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Definiciones globales para los días acumulados de la app.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Target de Días (Meta)</Label>
                <Input
                  type="number"
                  value={streakConfig.target ?? streakConfig.target_days ?? 7}
                  onChange={(e) => handleFieldChange('target', e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-bold text-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Puntos Base por Día</Label>
                <Input
                  type="number"
                  value={streakConfig.basePointsPerDay ?? streakConfig.base_points_per_day ?? 10}
                  onChange={(e) => handleFieldChange('basePointsPerDay', e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-sky-400" />
                  Costo Congelar Racha (PTS)
                </Label>
                <Input
                  type="number"
                  value={streakConfig.freezeCostPoints ?? streakConfig.freeze_streak_cost ?? 50}
                  onChange={(e) => handleFieldChange('freezeCostPoints', e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Resumen de Reglas</Label>
              <Textarea
                value={streakConfig.rules_summary ?? streakConfig.summary_rules ?? ''}
                onChange={(e) => handleFieldChange('rules_summary', e.target.value)}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-white text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Days Table Card */}
        <Card className="glass-panel border-zinc-800/50">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-400" />
              Configuración por Día de la Semana (Lun - Dom)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Establece cuáles días otorgan bonus especial (⭐) o multiplicadores de Ezploro Coins.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {(streakConfig.days_config || streakConfig.daysConfig || streakConfig.days || streakConfig.daysOfWeek || []).map((dayObj, idx) => {
                const isBonusActive = dayObj.is_bonus === true || dayObj.bonus === true || dayObj.isBonus === true || dayObj.bonusDay === true;
                const currentPts = dayObj.points ?? dayObj.points_day ?? dayObj.puntos ?? dayObj.pointsDay ?? 10;
                const dayLabel = dayObj.day || dayObj.name || `Día ${idx + 1}`;
                return (
                  <div
                    key={dayLabel || idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isBonusActive
                        ? 'bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-900/50 border-zinc-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{dayLabel}</span>
                        {isBonusActive && (
                          <span className="text-amber-400 text-sm animate-pulse">⭐</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400">Puntos Día</Label>
                        <Input
                          type="number"
                          value={currentPts}
                          onChange={(e) => handleDayChange(idx, 'points', e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-white h-8 text-xs font-bold text-center"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-400">Día Bonus</span>
                        <Switch
                          checked={isBonusActive}
                          onCheckedChange={(checked) => handleDayChange(idx, 'bonus', checked)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-zinc-950 font-bold px-8 shadow-lg shadow-orange-500/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando Cambios...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración de Rachas
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StreaksManager;
