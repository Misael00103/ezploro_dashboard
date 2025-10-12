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
} from 'lucide-react';
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
  updateTestimonials,
} from '../services/testimonialService';
import { getPosts } from '../services/postService';
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
          } catch (error) {
            console.error('Error parsing cached user:', error);
          }
        }
        
        // Fetch fresh user profile
        const userData = await getUserProfile();
        // Preserve online_status from cache if it exists
        const finalUserData = cachedUser ? {
          ...userData,
          online_status: JSON.parse(cachedUser).online_status ?? userData.online_status
        } : userData;
        setUser(finalUserData);
        localStorage.setItem('user', JSON.stringify(finalUserData));
        localStorage.setItem('userId', finalUserData.user_id);

        // Fetch dashboard data with error handling
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
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error.message || 'Error al cargar los datos del panel');
        if (
          error.message.includes('No autorizado') ||
          error.message.includes('No hay sesión activa') ||
          error.message.includes('ID de usuario inválido') ||
          error.message.includes('Autenticación inválida')
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
      const updatedEvent = await updateEvents(newEvents);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      toast.success('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error updating events:', error);
      toast.error(error.message || 'Error al actualizar el evento');
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

  const handleUpdateTestimonials = async (newTestimonials) => {
    try {
      const updatedTestimonial = await updateTestimonials(newTestimonials);
      setTestimonials((prev) =>
        prev.map((testimonial) =>
          testimonial.id === updatedTestimonial.id ? updatedTestimonial : testimonial
        )
      );
      toast.success('Testimonio actualizado correctamente');
    } catch (error) {
      console.error('Error updating testimonials:', error);
      toast.error(error.message || 'Error al actualizar el testimonio');
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-24 h-24 rounded-lg flex items-center justify-center">
                <img 
                  src={require('../img/logoezploro.png')} 
                  alt="Ezploro Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ezploro</h1>
                <p className="text-sm text-purple-300">Panel de Administración</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=32`} 
                  alt={user?.name}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=32`;
                  }}
                />
                <AvatarFallback className="bg-purple-600 text-white">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium hidden sm:block">{user?.display_name || user?.name}</span>
              <Badge variant={user?.online_status ? 'default' : 'secondary'} className="ml-2">
                {user?.online_status ? 'En línea' : 'Desconectado'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-purple-300 hover:text-white hover:bg-purple-900/50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 bg-black/30 border border-purple-500/30">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactos
            </TabsTrigger>
            <TabsTrigger
              value="testimonials"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <Star className="h-4 w-4 mr-2" />
              Testimonios
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="landing"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Landing
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <Globe className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger
              value="gamification"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Gamificación
            </TabsTrigger>
            <TabsTrigger
              value="user-management"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
            >
              <User className="h-4 w-4 mr-2" />
              Usuario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Total Eventos
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{events.length}</div>
                  <p className="text-xs text-purple-300">
                    Eventos disponibles
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Total Contactos
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {contacts.length}
                  </div>
                  <p className="text-xs text-purple-300">
                    Contactos registrados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Testimonios
                  </CardTitle>
                  <Star className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{testimonials.length}</div>
                  <p className="text-xs text-purple-300">
                    Testimonios activos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Total Posts
                  </CardTitle>
                  <FileText className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{posts.length}</div>
                  <p className="text-xs text-purple-300">
                    Contenido de usuarios
                  </p>
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