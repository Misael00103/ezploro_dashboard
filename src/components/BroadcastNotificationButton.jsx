import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Loader2, Clock, Send, CalendarClock } from 'lucide-react';
import { Badge } from './ui/badge';
import { sendBroadcastNotification, getPendingJobs } from '../services/notificationService';
import { toast } from 'react-hot-toast';

// Presets extraídos del ScheduledNotificationService del backend
const SCHEDULE_PRESETS = [
  { label: 'Inmediato', value: 'now' },
  { label: 'Jueves 18:00 — Anticipación finde (Semana A)', value: 'thu-18' },
  { label: 'Sábado 20:30 — Urgencia noche (Semana A)',     value: 'sat-20' },
  { label: 'Viernes 12:30 — Weekend lineup (Semana B)',    value: 'fri-12' },
  { label: 'Domingo 13:00 — Sunday chill (Semana B)',      value: 'sun-13' },
  { label: 'Personalizado',                                value: 'custom' },
];

// Calcula la próxima fecha para un día/hora dado
const nextOccurrence = (dayOfWeek, hour, minute) => {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  result.setDate(now.getDate() + (diff === 0 && result <= now ? 7 : diff));
  return result.toISOString().slice(0, 16); // formato datetime-local
};

const PRESET_DATES = {
  'thu-18': () => nextOccurrence(4, 18, 0),
  'sat-20': () => nextOccurrence(6, 20, 30),
  'fri-12': () => nextOccurrence(5, 12, 30),
  'sun-13': () => nextOccurrence(0, 13, 0),
};

// Textos de ejemplo del backend por preset
const PRESET_DEFAULTS = {
  'thu-18': {
    titleEs: '¿Qué se hace este finde? 👀',
    bodyEs: 'Los 3 corillos más duros de Santo Domingo ya están en el mapa. Entra, chequea y arma el plan.',
    titleEn: 'What\'s the plan this weekend? 👀',
    bodyEn: 'The 3 hottest spots in Santo Domingo are already on the map. Check it out and make your plan.',
  },
  'sat-20': {
    titleEs: 'La noche está joven 🌃',
    bodyEs: '¿Todavía sin plan pa\' hoy? Chequea el mapa, mira dónde está el ambiente y únete al grupo.',
    titleEn: 'The night is still young 🌃',
    bodyEn: 'No plans yet? Check the map, see where the vibe is and join the group.',
  },
  'fri-12': {
    titleEs: 'El lineup del finde ya está 🚀',
    bodyEs: 'Únete a los chats de eventos de este fin de semana para ver quién va y cómo está el ambiente.',
    titleEn: 'The weekend lineup is live 🚀',
    bodyEn: 'Join the event chats for this weekend to see who\'s going and what the vibe is like.',
  },
  'sun-13': {
    titleEs: 'Domingo de relax 😎',
    bodyEs: 'Para cerrar la semana con todo. Chequea los spots activos hoy.',
    titleEn: 'Sunday chill vibes 😎',
    bodyEn: 'To wind down or close the week on a high note. Check out the spots active today.',
  },
};

const EMPTY_FORM = { titleEs: '', bodyEs: '', titleEn: '', bodyEn: '' };

const BroadcastNotificationButton = () => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset]   = useState('now');
  const [scheduled, setScheduled] = useState('');
  const [form, setForm]       = useState(EMPTY_FORM);
  const [pendingJobs, setPendingJobs] = useState([]);

  useEffect(() => {
    const refresh = () => setPendingJobs(getPendingJobs());
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [open]);


  const handlePresetChange = (value) => {
    setPreset(value);
    if (PRESET_DEFAULTS[value]) {
      setForm(PRESET_DEFAULTS[value]);
      setScheduled(PRESET_DATES[value]?.() ?? '');
    } else if (value === 'now') {
      setScheduled('');
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: 'bg-black/50 border-purple-500/30 text-white placeholder:text-purple-500/50',
  });

  const handleSend = async () => {
    if (!form.titleEs.trim() || !form.bodyEs.trim() || !form.titleEn.trim() || !form.bodyEn.trim()) {
      toast.error('Completa el título y mensaje en ambos idiomas');
      return;
    }
    if (preset !== 'now' && !scheduled) {
      toast.error('Selecciona una fecha y hora de envío');
      return;
    }
    setLoading(true);
    try {
      const result = await sendBroadcastNotification({
        ...form,
        scheduledFor: preset === 'now' ? null : new Date(scheduled).toISOString(),
      });
      toast.success(
        preset === 'now'
          ? `Notificación enviada a ${result.totalUsers} usuarios`
          : `Notificación programada para ${new Date(scheduled).toLocaleString('es-ES')}`
      );
      setForm(EMPTY_FORM);
      setPreset('now');
      setScheduled('');
      setOpen(false);
      setPendingJobs(getPendingJobs());
    } catch (error) {
      toast.error(error.message || 'Error al enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 relative">
          <Bell className="h-4 w-4" />
          Enviar Notificación
          {pendingJobs.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-yellow-500 text-black text-xs">
              {pendingJobs.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-400" />
            Notificación a todos los usuarios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* Jobs programados pendientes */}
          {pendingJobs.length > 0 && (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-900/10 p-3 space-y-1">
              <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {pendingJobs.length} notificación(es) programada(s)
              </p>
              {pendingJobs.map((j) => (
                <p key={j.id} className="text-xs text-yellow-300/70">
                  • {new Date(j.scheduledFor).toLocaleString('es-ES')} — {j.titleEs}
                </p>
              ))}
            </div>
          )}

          {/* Preset de horario */}
          <div className="space-y-1.5">
            <Label className="text-purple-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Horario de envío
            </Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-purple-500/30 text-white">
                {SCHEDULE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="focus:bg-purple-900/50">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha personalizada */}
          {(preset === 'custom' || (preset !== 'now' && scheduled)) && (
            <div className="space-y-1.5">
              <Label className="text-purple-200">Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
          )}

          {/* Contenido bilingüe */}
          <Tabs defaultValue="es" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-black/40 border border-purple-500/20">
              <TabsTrigger value="es" className="data-[state=active]:bg-purple-600 text-purple-300 data-[state=active]:text-white">
                🇪🇸 Español
              </TabsTrigger>
              <TabsTrigger value="en" className="data-[state=active]:bg-purple-600 text-purple-300 data-[state=active]:text-white">
                🇺🇸 English
              </TabsTrigger>
            </TabsList>

            <TabsContent value="es" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-purple-200">Título</Label>
                <Input placeholder="Ej: ¡Nueva actualización!" {...field('titleEs')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-purple-200">Mensaje</Label>
                <Textarea placeholder="Escribe el mensaje en español..." rows={3} {...field('bodyEs')} />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-purple-200">Title</Label>
                <Input placeholder="E.g.: New update available!" {...field('titleEn')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-purple-200">Message</Label>
                <Textarea placeholder="Write the message in English..." rows={3} {...field('bodyEn')} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-purple-300">
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Send className="h-4 w-4 mr-2" />}
              {preset === 'now' ? 'Enviar ahora' : 'Programar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastNotificationButton;
