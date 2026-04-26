import { BASE_URL } from './config';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─── Obtener IDs de todos los usuarios activos ───────────────────────────────
const getUserIds = async () => {
  const res = await fetch(`${BASE_URL}/users?is_active=true&limit=10000`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios');
  const users = data.data || data.users || data;
  return Array.isArray(users) ? users.map((u) => u.user_id || u.id).filter(Boolean) : [];
};

// ─── Envío real al backend ────────────────────────────────────────────────────
const sendNow = async ({ titleEs, bodyEs, titleEn, bodyEn }) => {
  const userIds = await getUserIds();
  if (userIds.length === 0) throw new Error('No se encontraron usuarios activos');

  const res = await fetch(`${BASE_URL}/notifications/system/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      type: 'SYSTEM_ANNOUNCEMENT',
      userIds,
      title: titleEs,
      body: bodyEs,
      titleEs, bodyEs,
      titleEn, bodyEn,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Broadcast error:', data);
    throw new Error(data.error || data.message || JSON.stringify(data));
  }
  return { ...data, totalUsers: userIds.length };
};

// ─── API pública ──────────────────────────────────────────────────────────────
export const sendBroadcastNotification = async ({ titleEs, bodyEs, titleEn, bodyEn, scheduledFor = null }) => {
  if (!scheduledFor) {
    return sendNow({ titleEs, bodyEs, titleEn, bodyEn });
  }

  const delay = new Date(scheduledFor).getTime() - Date.now();
  if (delay <= 0) throw new Error('La fecha programada ya pasó');

  const job = { titleEs, bodyEs, titleEn, bodyEn, scheduledFor, id: Date.now() };
  _saveJob(job);

  setTimeout(() => _executeJob(job), delay);
  return { scheduled: true, scheduledFor, totalUsers: null };
};

// ─── Gestión de jobs en localStorage ─────────────────────────────────────────
const _saveJob = (job) => {
  const jobs = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
  localStorage.setItem('scheduledNotifications', JSON.stringify([...jobs, job]));
};

const _removeJob = (id) => {
  const jobs = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
  localStorage.setItem('scheduledNotifications', JSON.stringify(jobs.filter((j) => j.id !== id)));
};

const _executeJob = async (job) => {
  try {
    await sendNow(job);
    _removeJob(job.id);
    console.log('✅ Notificación programada enviada:', job.scheduledFor);
  } catch (e) {
    console.error('❌ Error enviando notificación programada:', e);
  }
};

// ─── Scheduler automático (mismos horarios que el backend cron) ───────────────
// Se inicializa una sola vez al importar el módulo.
// Comprueba cada minuto si algún horario fijo debe ejecutarse.

const FIXED_SCHEDULES = [
  // Semana A — Jueves 18:00
  {
    id: 'week-a-thu',
    dayOfWeek: 4, hour: 18, minute: 0,
    titleEs: '¿Qué se hace este finde? 👀',
    bodyEs: 'Los 3 corillos más duros de Santo Domingo ya están en el mapa. Entra, chequea y arma el plan.',
    titleEn: "What's the plan this weekend? 👀",
    bodyEn: "The 3 hottest spots in Santo Domingo are already on the map. Check it out and make your plan.",
  },
  // Semana A — Sábado 20:30
  {
    id: 'week-a-sat',
    dayOfWeek: 6, hour: 20, minute: 30,
    titleEs: 'La noche está joven 🌃',
    bodyEs: "¿Todavía sin plan pa' hoy? Chequea el mapa, mira dónde está el ambiente y únete al grupo.",
    titleEn: 'The night is still young 🌃',
    bodyEn: "No plans yet? Check the map, see where the vibe is and join the group.",
  },
  // Semana B — Viernes 12:30
  {
    id: 'week-b-fri',
    dayOfWeek: 5, hour: 12, minute: 30,
    titleEs: 'El lineup del finde ya está 🚀',
    bodyEs: 'Únete a los chats de eventos de este fin de semana para ver quién va y cómo está el ambiente.',
    titleEn: 'The weekend lineup is live 🚀',
    bodyEn: "Join the event chats for this weekend to see who's going and what the vibe is like.",
  },
  // Semana B — Domingo 13:00
  {
    id: 'week-b-sun',
    dayOfWeek: 0, hour: 13, minute: 0,
    titleEs: 'Domingo de relax 😎',
    bodyEs: 'Para cerrar la semana con todo. Chequea los spots activos hoy.',
    titleEn: 'Sunday chill vibes 😎',
    bodyEn: 'To wind down or close the week on a high note. Check out the spots active today.',
  },
];

const FIRED_KEY = 'firedSchedules';

const _getFired = () => JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
const _markFired = (key) => {
  const fired = _getFired();
  fired[key] = new Date().toISOString();
  localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
};

// Limpia marcas de más de 7 días para que vuelvan a dispararse la semana siguiente
const _cleanOldFired = () => {
  const fired = _getFired();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cleaned = Object.fromEntries(
    Object.entries(fired).filter(([, v]) => new Date(v).getTime() > weekAgo)
  );
  localStorage.setItem(FIRED_KEY, JSON.stringify(cleaned));
};

const _checkFixedSchedules = () => {
  const now = new Date();
  const fired = _getFired();

  for (const schedule of FIXED_SCHEDULES) {
    if (
      now.getDay() === schedule.dayOfWeek &&
      now.getHours() === schedule.hour &&
      now.getMinutes() === schedule.minute
    ) {
      const fireKey = `${schedule.id}-${now.toDateString()}`;
      if (!fired[fireKey]) {
        _markFired(fireKey);
        console.log(`🔔 Disparando horario automático: ${schedule.id}`);
        sendNow(schedule).catch((e) =>
          console.error(`❌ Error en horario automático ${schedule.id}:`, e)
        );
      }
    }
  }
};

// Iniciar el scheduler — corre cada minuto
let _schedulerStarted = false;
export const startScheduler = () => {
  if (_schedulerStarted) return;
  _schedulerStarted = true;
  _cleanOldFired();
  _checkFixedSchedules(); // check inmediato al iniciar
  setInterval(() => {
    _cleanOldFired();
    _checkFixedSchedules();
  }, 60 * 1000);
  console.log('🕐 Scheduler de notificaciones iniciado');
};

export const getPendingJobs = () =>
  JSON.parse(localStorage.getItem('scheduledNotifications') || '[]').filter(
    (j) => new Date(j.scheduledFor) > new Date()
  );
