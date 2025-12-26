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
} from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import EventsManager from './EventsManager';
import ContactsManager from './ContactsManager';
import TestimonialsManager from './TestimonialsManager';
import PostsManager from './PostsManager';
import LandingPageManager from './LandingPageManager';
import SocialMediaManager from './SocialMediaManager';
import GamificationManager from './GamificationManager';
import UserManagementManager from './UserManagementManager';
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
import { getLandingPageContent } from '../services/landingPageService';
import { getStats } from '../services/statsService';
import { getUserProfile } from '../services/userService';
import { debugAuthState, validateAuth, clearAuthData } from '../services/authUtils';

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [posts, setPosts] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [landingContent, setLandingContent] = useState({});
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appDownloads, setAppDownloads] = useState(0); // Contador de descargas de app

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
        const [
          eventsData,
          contactsData,
          testimonialsData,
          postsData,
          socialMediaData,
          landingData,
          statsData,
        ] = await Promise.allSettled([
          getEvents(),
          getContacts(),
          getTestimonials(),
          getPosts(),
          getSocialMedia(),
          getLandingPageContent(),
          getStats(),
        ]).then(results => results.map(result => 
          result.status === 'fulfilled' ? result.value : []
        ));

        setEvents(eventsData);
        setContacts(contactsData);
        setTestimonials(testimonialsData);
        setPosts(postsData);
        setSocialMedia(socialMediaData);
        setLandingContent(landingData);
        setStats(statsData);
        
        // Cargar descargas de app desde stats o usar valor por defecto
        if (statsData && statsData.appDownloads !== undefined) {
          setAppDownloads(statsData.appDownloads);
        } else {
          setAppDownloads(0);
        }
        
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

  const handleUpdateContacts = async (contactId, status) => {
    try {
      const updatedContact = await updateContactStatus(contactId, status);
      setContacts((prev) =>
        prev.map((contact) =>
          contact.contact_id === contactId ? { ...contact, status } : contact
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
        <Card className="bg-black/40 border-purple-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 py-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg flex items-center justify-center flex-shrink-0">
                <img 
                  src={require('../img/logoezploro.png')} 
                  alt="Ezploro Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">Ezploro</h1>
                <p className="text-xs sm:text-sm text-purple-300 hidden sm:block">Panel de Administración</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage 
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=32`} 
                  alt={user?.name}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=32`;
                  }}
                />
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium hidden md:block text-sm lg:text-base truncate max-w-[120px] lg:max-w-none">
                {user?.display_name || user?.name}
              </span>
              <Badge variant={user?.online_status ? 'default' : 'secondary'} className="ml-2 hidden sm:inline-flex text-xs">
                {user?.online_status ? 'En línea' : 'Desconectado'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-purple-300 hover:text-white hover:bg-purple-900/50 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-2 sm:gap-2.5 bg-black/40 border border-purple-500/30 rounded-lg p-3 sm:p-4 md:p-5 [&>*]:w-full" style={{ display: 'grid', height: '100%' }}>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Resumen</span>
              <span className="sm:hidden">Res.</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Eventos</span>
              <span className="sm:hidden">Ev.</span>
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Contactos</span>
              <span className="sm:hidden">Cont.</span>
            </TabsTrigger>
            <TabsTrigger
              value="testimonials"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Testimonios</span>
              <span className="md:hidden">Test.</span>
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Posts</span>
              <span className="sm:hidden">P.</span>
            </TabsTrigger>
            <TabsTrigger
              value="landing"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Landing</span>
              <span className="md:hidden">Land.</span>
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Social</span>
              <span className="md:hidden">Soc.</span>
            </TabsTrigger>
            <TabsTrigger
              value="gamification"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Gamificación</span>
              <span className="lg:hidden">Gam.</span>
            </TabsTrigger>
            <TabsTrigger
              value="user-management"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-300 hover:text-white hover:bg-purple-900/50 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md transition-all font-medium w-full"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Usuario</span>
              <span className="md:hidden">Usu.</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
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
                      {contacts.filter(c => c.status === 'active').length} activos
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
                  <div className="space-y-2">
                    <p className="text-lg">Descargas totales de la aplicación</p>
                    <p className="text-sm text-purple-300">
                      Usuarios que han instalado la app móvil
                    </p>
                  </div>
                }
              />
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
                    {socialMedia.filter(s => s.is_active).map((social, index) => (
                      <div key={social.id || index} className="flex items-center justify-between">
                        <span className="text-purple-200">
                          {typeof social.platform === 'string' ? social.platform : 'Red Social'}
                        </span>
                        <Badge className="bg-green-900/50 text-green-200 border-green-600/30">
                          {social.followers ? `${(social.followers / 1000).toFixed(1)}k` : 'Activa'}
                        </Badge>
                      </div>
                    ))}
                    {socialMedia.filter(s => !s.is_active).slice(0, 2).map((social, index) => (
                      <div key={social.id || `inactive-${index}`} className="flex items-center justify-between">
                        <span className="text-purple-200 opacity-60">
                          {typeof social.platform === 'string' ? social.platform : 'Red Social'}
                        </span>
                        <Badge className="bg-red-900/50 text-red-200 border-red-600/30">
                          Inactiva
                        </Badge>
                      </div>
                    ))}
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

          <TabsContent value="landing">
            <LandingPageManager landingContent={landingContent} setLandingContent={setLandingContent} />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManager socialMedia={socialMedia} setSocialMedia={setSocialMedia} />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationManager />
          </TabsContent>

          <TabsContent value="user-management">
            <UserManagementManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;