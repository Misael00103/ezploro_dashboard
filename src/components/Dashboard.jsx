import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LogOut,
  Calendar,
  Users,
  MessageCircle,
  Star,
  BarChart3,
  FileText,
  Monitor,
  Globe,
  Trophy,
  User,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  Menu,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import EventsManager from './EventsManager';
import ContactsManager from './ContactsManager';
import TestimonialsManager from './TestimonialsManager';
import PostsManager from './PostsManager';
import SocialMediaManager from './SocialMediaManager';
import GamificationManager from './GamificationManager';
import UserManagementManager from './UserManagementManager';
import BroadcastNotificationButton from './BroadcastNotificationButton';
import {
  getEvents,
  updateEvents,
} from '../services/eventService';
import {
  getContacts,
  updateContactStatus,
} from '../services/contactService';
import {
  getTestimonials,
  updateTestimonial,
} from '../services/testimonialService';
import { getAllPosts as getPosts } from '../services/postService';
import { getSocialMedia } from '../services/socialMediaService';
import { getStats } from '../services/statsService';
import { getUserProfile, getAllUsers } from '../services/userService';
import { debugAuthState, validateAuth, clearAuthData } from '../services/authUtils';
import { startScheduler } from '../services/notificationService';
import { getRankingEventosMasSuscritos, getRankingEventosMasLikes } from '../services/rankingService';
import { BASE_URL_IMAGE, formatImageUrl } from '../services/config';

// Helper to safely format profile picture URLs
const getProfilePictureUrl = (profilePicture) => {
  return formatImageUrl(profilePicture) || undefined;
};

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [posts, setPosts] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appDownloads, setAppDownloads] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [topEventsBySubs, setTopEventsBySubs] = useState([]);
  const [topEventsByLikes, setTopEventsByLikes] = useState([]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'contacts', label: 'Contactos', icon: MessageCircle, badge: contacts.filter(c => c.status !== 'responded' && c.status !== 'resolved').length },
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'testimonials', label: 'Testimonios', icon: Star },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'social', label: 'Redes Sociales', icon: Globe },
    ...(user?.role === 'admin' || user?.role === 'moderator' ? [
      { id: 'gamification', label: 'Gamificación', icon: Trophy },
      { id: 'user-management', label: 'Usuarios', icon: User },
      { id: 'ezploro-info', label: 'Info Ezploro', icon: Info }
    ] : [])
  ];

  // Agrupar eventos por mes usando fechas reales
  const getEventsByMonth = () => {
    if (!Array.isArray(events) || events.length === 0) return [];
    const counts = {};
    events.forEach((e) => {
      const d = new Date(e.created_at || e.date_time || e.date);
      if (isNaN(d)) return;
      const key = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([mes, eventos]) => ({ mes, eventos }))
      .slice(-8);
  };

  // Función helper para transformar datos de redes sociales del backend al formato del frontend
  const transformSocialMediaData = (networks) => {
    if (!Array.isArray(networks) || networks.length === 0) {
      return [];
    }

    return networks.map(network => ({
      id: network.id || network.social_network_id,
      platform: network.plataforma || network.platform,
      name: network.nombre_usuario || network.name,
      url: network.url,
      icon: network.icono || network.icon,
      followers: network.cantidad_seguidores || network.followers || 0,
      is_active: network.activa !== undefined ? network.activa : (network.is_active !== undefined ? network.is_active : true),
    }));
  };


  useEffect(() => {
    startScheduler();
  }, []);

  // Listen for user data changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Debug authentication state
        debugAuthState();
        
        // Validate authentication before proceeding
        const authValidation = validateAuth();
        if (!authValidation.valid) {
          throw new Error(`Autenticación inválida: ${authValidation.reason}`);
        }

        // Try to get user from localStorage first
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('✅ Dashboard - Usuario cargado desde cache:', parsedUser);
          } catch (error) {
            console.error('❌ Error parsing cached user:', error);
          }
        }
        
        // Try to fetch fresh user profile, but don't fail if it errors
        try {
          console.log('🔵 Dashboard - Intentando obtener perfil de usuario...');
          const userData = await getUserProfile();
          
          // Preserve online_status from cache if it exists
          const finalUserData = cachedUser ? {
            ...userData,
            online_status: JSON.parse(cachedUser).online_status ?? userData.online_status
          } : userData;
          
          setUser(finalUserData);
          localStorage.setItem('user', JSON.stringify(finalUserData));
          
          if (finalUserData.user_id) {
            localStorage.setItem('userId', finalUserData.user_id.toString());
          }
          
          console.log('✅ Dashboard - Perfil de usuario actualizado:', finalUserData);
        } catch (userError) {
          console.error('⚠️ Dashboard - Error al obtener perfil (usando cache):', userError);
          
          // Si hay un error 500, es probable que sea un problema del backend
          // Continuar con el usuario en cache si existe
          if (!cachedUser) {
            throw new Error('No se pudo cargar el perfil de usuario y no hay datos en cache');
          }
          
          toast.error('No se pudo actualizar el perfil. Usando datos guardados.', {
            duration: 3000,
          });
        }

        // Fetch dashboard data with error handling
        console.log('🔵 Dashboard - Cargando datos del dashboard...');
        const results = await Promise.allSettled([
          getEvents().catch(err => {
            console.warn('⚠️ Error cargando eventos:', err.message);
            return [];
          }),
          getContacts().catch(err => {
            console.warn('⚠️ Error cargando contactos:', err.message);
            return [];
          }),
          getTestimonials().catch(err => {
            console.warn('⚠️ Error cargando testimonios:', err.message);
            return [];
          }),
          getPosts().catch(err => {
            console.warn('⚠️ Error cargando posts:', err.message);
            return [];
          }),
          getSocialMedia().catch(err => {
            console.warn('⚠️ Error cargando redes sociales:', err.message);
            return [];
          }),
          getStats().catch(err => {
            console.warn('⚠️ Error cargando estadísticas:', err.message);
            return {};
          }),
          getAllUsers().catch(err => {
            console.warn('⚠️ Error cargando todos los usuarios:', err.message);
            return [];
          }),
        ]);

        console.log('🔵 Dashboard - Resultados de Promise.allSettled:', results);

        const [
          eventsData,
          contactsData,
          testimonialsData,
          postsData,
          socialMediaData,
          statsData,
          usersData,
        ] = results.map((result, index) => {
          const labels = ['eventos', 'contactos', 'testimonios', 'posts', 'socialMedia', 'stats', 'users'];
          if (result.status === 'fulfilled') {
            console.log(`✅ ${labels[index]} cargado:`, result.value);
            return result.value;
          } else {
            console.error(`❌ Error en ${labels[index]}:`, result.reason);
            return index === 5 ? {} : []; // stats es objeto, los demás son arrays
          }
        });

        console.log('🔵 Dashboard - socialMediaData extraído:', socialMediaData);
        console.log('🔵 Dashboard - Tipo de socialMediaData:', typeof socialMediaData, Array.isArray(socialMediaData));

        // Transformar datos de redes sociales al formato correcto
        const transformedSocialMedia = transformSocialMediaData(socialMediaData);
        console.log('🔵 Dashboard - socialMedia transformado:', transformedSocialMedia);

        setEvents(eventsData);
        setContacts(contactsData);
        setTestimonials(testimonialsData);
        setPosts(postsData);
        setSocialMedia(transformedSocialMedia);
        setStats(statsData);
        setUsersList(usersData || []);

        if (usersData && usersData.length > 0) {
          setAppDownloads(usersData.length);
        } else if (statsData?.appDownloads !== undefined) {
          setAppDownloads(statsData.appDownloads);
        }

        // Top eventos por likes (campo real disponible en el backend)
        const byLikes = [...eventsData]
          .filter((e) => e.title)
          .sort((a, b) => Number(b.likes || b.likes_count || 0) - Number(a.likes || a.likes_count || 0))
          .slice(0, 8);
        setTopEventsBySubs(byLikes.map((e) => ({
          nombre: (e.title || 'Evento').slice(0, 22),
          likes: Number(e.likes || e.likes_count || 0),
          interesados: Number(e.interested_count || 0),
          asistentes: Number(e.attendees_count || 0),
        })));

        // Eventos por categoría (datos reales siempre disponibles)
        const catCounts = {};
        eventsData.forEach((e) => {
          const cat = e.category || 'Sin categoría';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        setTopEventsByLikes(
          Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([categoria, total]) => ({ categoria, total }))
        );
        
        console.log('✅ Dashboard - Datos cargados exitosamente');
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setError(error.message || 'Error al cargar los datos del panel');
        
        if (
          error.message.includes('No autorizado') ||
          error.message.includes('No hay sesión activa') ||
          error.message.includes('ID de usuario inválido') ||
          error.message.includes('Autenticación inválida') ||
          error.message.includes('no hay datos en cache')
        ) {
          toast.error('Sesión expirada o inválida. Por favor, inicia sesión nuevamente.');
          clearAuthData();
          onLogout();
          navigate('/');
        } else {
          toast.error(error.message || 'Error al cargar los datos del panel');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate, onLogout]);

  const handleLogout = () => {
    clearAuthData();
    onLogout();
    navigate('/');
  };

  const handleUpdateEvents = async (newEvents) => {
    try {
      // Si es un array, significa que es una actualización de lista completa (después de crear/eliminar)
      if (Array.isArray(newEvents)) {
        setEvents(newEvents);
        return;
      }
      
      // Si es un objeto, es una actualización de un evento individual
      if (newEvents && (newEvents.id || newEvents.event_id)) {
        // Verificar si el evento ya existe en la lista para evitar duplicados
        const eventId = newEvents.id || newEvents.event_id;
        const existingEvent = events.find(e => 
          (e.id === eventId || e.event_id === eventId)
        );
        
        if (existingEvent) {
          // Si existe, actualizarlo
      const updatedEvent = await updateEvents(newEvents);
      setEvents((prev) =>
        prev.map((event) =>
              (event.id === eventId || event.event_id === eventId) 
                ? updatedEvent 
                : event
        )
      );
      toast.success('Evento actualizado correctamente');
        } else {
          // Si no existe, agregarlo solo si tiene un ID válido
          if (eventId && eventId !== 'undefined' && eventId !== 'null') {
            setEvents((prev) => {
              // Verificar nuevamente antes de agregar para evitar duplicados
              const alreadyExists = prev.some(e => 
                (e.id === eventId || e.event_id === eventId)
              );
              if (alreadyExists) {
                return prev;
              }
              return [...prev, newEvents];
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating events:', error);
      // Solo mostrar error si realmente había un error (no si es solo actualización de estado)
      if (newEvents && (newEvents.id || newEvents.event_id)) {
      toast.error(error.message || 'Error al actualizar el evento');
      }
    }
  };

  const handleUpdateContacts = async (contactIdOrContacts, status) => {
    if (Array.isArray(contactIdOrContacts)) {
      setContacts(contactIdOrContacts);
      return;
    }

    try {
      await updateContactStatus(contactIdOrContacts, status);
      setContacts((prev) =>
        prev.map((contact) =>
          contact.contact_us_id === contactIdOrContacts || contact.contact_id === contactIdOrContacts || contact.id === contactIdOrContacts
            ? { ...contact, status }
            : contact
        )
      );
      toast.success('Contacto actualizado correctamente');
    } catch (error) {
      console.error('Error updating contacts:', error);
      toast.error(error.message || 'Error al actualizar el contacto');
    }
  };

  const handleUpdateTestimonials = (newTestimonials) => {
    // Si es un array, reemplazar toda la lista
    if (Array.isArray(newTestimonials)) {
      setTestimonials(newTestimonials);
      return;
    }
    
    // Si es un objeto, es una actualización de un testimonio individual
    if (newTestimonials && (newTestimonials.id || newTestimonials.testimonial_id)) {
      const testimonialId = newTestimonials.id || newTestimonials.testimonial_id;
      setTestimonials((prev) =>
        prev.map((testimonial) =>
          (testimonial.id === testimonialId || testimonial.testimonial_id === testimonialId)
            ? newTestimonials
            : testimonial
        )
      );
      toast.success('Testimonio actualizado correctamente');
    } else {
      // Si no es ni array ni objeto válido, recargar desde el backend
      loadDashboardData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b]">
        <div className="relative flex flex-col items-center">
          {/* Glowing background */}
          <div className="absolute w-24 h-24 bg-violet-600/20 rounded-full blur-2xl animate-pulse" />
          
          {/* Logo container */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-950 border border-zinc-800/80 shadow-2xl relative z-10 animate-bounce duration-[2000ms] ease-in-out">
            <img 
              src={require('../img/logoezploro.png')} 
              alt="Ezploro Logo" 
              className="w-10 h-10 object-contain animate-pulse"
            />
          </div>
          
          <div className="mt-6 flex flex-col items-center z-10">
            <p className="text-sm font-bold text-white tracking-widest uppercase">EZPLORO</p>
            <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
              Cargando panel de administración...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#09090b]">
        <Card className="w-96 glass-panel border-zinc-800/50 text-white text-center p-8 shadow-2xl animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Error de Carga</h2>
          <p className="text-zinc-400 text-sm mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all duration-200"
          >
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-zinc-950 border-r border-zinc-800/60 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 z-30`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/60 gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-violet-600/10 border border-violet-500/20">
            <img 
              src={require('../img/logoezploro.png')} 
              alt="Ezploro Logo" 
              className="w-6 h-6 object-contain"
            />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white tracking-wide">EZPLORO</span>
              <span className="text-xs text-zinc-500 truncate">Administración</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-violet-400' : 'text-zinc-400 group-hover:text-zinc-300'}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 border border-zinc-950 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800/60 z-50 flex flex-col transition-transform duration-300 transform md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/60 gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-violet-600/10 border border-violet-500/20">
              <img 
                src={require('../img/logoezploro.png')} 
                alt="Ezploro Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">EZPLORO</span>
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                Administración
                <Badge variant={user?.online_status ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  {user?.online_status ? 'ON' : 'OFF'}
                </Badge>
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative z-10">
        {/* Top Header */}
        <header className="bg-zinc-950/40 backdrop-blur-md border-b border-zinc-800/50 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Sidebar toggle button (desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex text-zinc-400 hover:text-white"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold text-white capitalize hidden sm:block">
              {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-zinc-900/40 border border-zinc-800/50 rounded-full px-3 py-1.5">
              <Avatar className="h-7 w-7 border border-violet-500/30">
                <AvatarImage 
                  src={getProfilePictureUrl(user?.profile_picture)} 
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7c3aed&color=fff&size=32`;
                  }}
                />
                <AvatarFallback className="bg-violet-900/50 text-violet-200 text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-zinc-200 max-w-[120px] truncate hidden md:block">
                {user?.name || 'Administrador'}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-rose-400 hover:bg-rose-950/10 rounded-full p-2"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in flex-1">
          <Tabs value={activeTab} className="space-y-6">

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="flex justify-end">
              <BroadcastNotificationButton />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              <AnimatedCounter
                title="Total Eventos"
                value={events.length}
                description="Eventos disponibles"
                icon={Calendar}
                color="purple"
                modalContent={
                  <div className="space-y-4">
                    <p className="text-lg font-semibold">Eventos activos en el sistema</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-purple-900/20 rounded-lg">
                        <p className="text-xl font-bold text-purple-300">
                          {events.filter(e => e.status === 'upcoming').length}
                        </p>
                        <p className="text-sm text-purple-400">Próximos</p>
                      </div>
                      <div className="p-4 bg-purple-900/20 rounded-lg">
                        <p className="text-xl font-bold text-purple-300">
                          {events.filter(e => e.status === 'past').length}
                        </p>
                        <p className="text-sm text-purple-400">Pasados</p>
                      </div>
                    </div>
                  </div>
                }
              />

              <AnimatedCounter
                title="Total Contactos"
                value={contacts.length}
                description="Contactos registrados"
                icon={MessageCircle}
                color="blue"
                modalContent={
                  <div className="space-y-2">
                    <p className="text-lg">Contactos en la base de datos</p>
                    <p className="text-sm text-purple-300">
                      {contacts.filter(c => c.status !== 'responded' && c.status !== 'resolved').length} pendientes de respuesta
                    </p>
                  </div>
                }
              />

              <AnimatedCounter
                title="Testimonios"
                value={testimonials.length}
                description="Testimonios activos"
                icon={Star}
                color="orange"
                modalContent={
                  <div className="space-y-2">
                    <p className="text-lg">Testimonios de usuarios</p>
                    <p className="text-sm text-purple-300">
                      Calificaciones promedio en el sistema
                    </p>
                  </div>
                }
              />

              <AnimatedCounter
                title="Total Posts"
                value={posts.length}
                description="Contenido de usuarios"
                icon={FileText}
                color="green"
                modalContent={
                  <div className="space-y-2">
                    <p className="text-lg">Posts creados por usuarios</p>
                    <p className="text-sm text-purple-300">
                      Contenido generado en la plataforma
                    </p>
                  </div>
                }
              />

              <AnimatedCounter
                title="Descargas App"
                value={appDownloads}
                description="Usuarios que descargaron la app"
                icon={Download}
                color="pink"
                modalContent={
                  <div className="space-y-4">
                    <p className="text-lg font-semibold text-white">Usuarios registrados en el sistema</p>
                    {usersList.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {usersList.map((u) => (
                          <div key={u.id || u.user_id} className="flex items-center space-x-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/40 hover:bg-zinc-900 transition-colors">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={getProfilePictureUrl(u.profile_picture || u.avatar_url)} />
                              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-semibold">
                                {((u.name || u.email || 'U').substring(0, 2)).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{u.name || u.username || 'Usuario'}</p>
                              <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">No hay usuarios registrados.</p>
                    )}
                  </div>
                }
              />
            </div>

            {/* Gráficas con datos reales */}
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              {/* Eventos creados por mes — LineChart */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    Eventos creados por mes
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Actividad real de los últimos meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getEventsByMonth().length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={getEventsByMonth()}>
                        <defs>
                          <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="mes" 
                          stroke="#a1a1aa" 
                          dy={8} 
                          tickLine={false} 
                          style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} 
                        />
                        <YAxis 
                          stroke="#a1a1aa" 
                          dx={-8} 
                          tickLine={false} 
                          style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} 
                          allowDecimals={false} 
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5' }} />
                        <Area type="monotone" dataKey="eventos" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEventos)" name="Eventos" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-purple-400 text-sm">Sin datos suficientes</div>
                  )}
                  <p className="text-xs text-purple-400 mt-2">Total: {events.length} eventos registrados</p>
                </CardContent>
              </Card>

              {/* Top eventos por categoría — BarChart horizontal */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    Eventos por categoría
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Distribución real de eventos por categoría
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topEventsByLikes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topEventsByLikes} layout="vertical" margin={{ left: 8, right: 24, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" stroke="#a1a1aa" dy={8} tickLine={false} style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} allowDecimals={false} />
                        <YAxis 
                          type="category" 
                          dataKey="categoria" 
                          stroke="#a1a1aa" 
                          tickLine={false} 
                          style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} 
                          width={130} 
                          tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val} 
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5' }} />
                        <Bar dataKey="total" name="Eventos" radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {topEventsByLikes.map((_, i) => (
                            <Cell key={i} fill={`hsl(${260 + i * 15}, 70%, ${55 + i * 2}%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-purple-400 text-sm">Sin datos de categorías</div>
                  )}
                  <p className="text-xs text-purple-400 mt-2">{topEventsByLikes.length} categorías activas</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Resumen de Contenido</CardTitle>
                  <CardDescription className="text-purple-300">
                    Contenido disponible en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Eventos</span>
                      <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                        {events.length} total
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Posts</span>
                      <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                        {posts.length} total
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Testimonios</span>
                      <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                        {testimonials.length} total
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Redes Sociales Activas</CardTitle>
                  <CardDescription className="text-purple-300">
                    Estado de las redes sociales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(socialMedia) && socialMedia.length > 0 ? (
                      <>
                        {socialMedia.filter(s => s.is_active).map((social, index) => (
                          <div key={social.id || index} className="flex items-center justify-between">
                            <span className="text-purple-200">
                              {social.platform || 'Red Social'}
                            </span>
                            <Badge className="bg-green-900/50 text-green-200 border-green-600/30">
                              {social.followers ? `${(social.followers / 1000).toFixed(1)}k` : 'Activa'}
                            </Badge>
                          </div>
                        ))}
                        {socialMedia.filter(s => !s.is_active).slice(0, 2).map((social, index) => (
                          <div key={social.id || `inactive-${index}`} className="flex items-center justify-between">
                            <span className="text-purple-200 opacity-60">
                              {social.platform || 'Red Social'}
                            </span>
                            <Badge className="bg-red-900/50 text-red-200 border-red-600/30">
                              Inactiva
                            </Badge>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4 text-purple-300">
                        <p>No hay redes sociales configuradas</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <EventsManager events={events} updateEvents={handleUpdateEvents} />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager contacts={contacts} updateContacts={handleUpdateContacts} />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialsManager testimonials={testimonials} updateTestimonials={handleUpdateTestimonials} />
          </TabsContent>

          <TabsContent value="posts">
            <PostsManager posts={posts} setPosts={setPosts} />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManager socialMedia={socialMedia} setSocialMedia={setSocialMedia} />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationManager />
          </TabsContent>

          <TabsContent value="user-management">
            <UserManagementManager initialTab="profile" />
          </TabsContent>

          <TabsContent value="ezploro-info">
            <UserManagementManager initialTab="ezploro-info" />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;