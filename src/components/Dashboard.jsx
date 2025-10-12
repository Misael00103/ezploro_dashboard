import React, { useState, useEffect } from 'react';
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
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  Monitor,
  Globe,
  Trophy,
  User
} from 'lucide-react';
import { mockEvents, mockContacts, mockTestimonials, mockStats, mockPosts, mockSocialMedia, mockLandingPageContent } from '../mock';
import EventsManager from './EventsManager';
import ContactsManager from './ContactsManager';
import TestimonialsManager from './TestimonialsManager';
import PostsManager from './PostsManager';
import LandingPageManager from './LandingPageManager';
import SocialMediaManager from './SocialMediaManager';
import GamificationManager from './GamificationManager';
import UserManagementManager from './UserManagementManager';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState(mockEvents);
  const [contacts, setContacts] = useState(mockContacts);
  const [testimonials, setTestimonials] = useState(mockTestimonials);
  const [posts, setPosts] = useState(mockPosts);
  const [socialMedia, setSocialMedia] = useState(mockSocialMedia);
  const [landingContent, setLandingContent] = useState(mockLandingPageContent);
  const [stats, setStats] = useState(mockStats);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const updateEvents = (newEvents) => {
    setEvents(newEvents);
  };

  const updateContacts = (newContacts) => {
    setContacts(newContacts);
  };

  const updateTestimonials = (newTestimonials) => {
    setTestimonials(newTestimonials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Scape Events</h1>
                <p className="text-sm text-purple-300">Panel de Administración</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium hidden sm:block">{user?.name}</span>
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
                  <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
                  <p className="text-xs text-purple-300">
                    +12% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Total Asistentes
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalAttendees.toLocaleString()}</div>
                  <p className="text-xs text-purple-300">
                    +8% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">
                    Usuarios Activos
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
                  <p className="text-xs text-purple-300">
                    de {stats.totalUsers} total
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
                  <CardTitle className="text-white">Categorías Más Populares</CardTitle>
                  <CardDescription className="text-purple-300">
                    Eventos por categoría este mes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-purple-200">{category.name}</span>
                        <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                          {category.count} eventos
                        </Badge>
                      </div>
                    ))}
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
                    {socialMedia.filter(s => s.is_active).map((social) => (
                      <div key={social.id} className="flex items-center justify-between">
                        <span className="text-purple-200">{social.platform}</span>
                        <Badge className="bg-green-900/50 text-green-200 border-green-600/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {social.followers ? `${(social.followers / 1000).toFixed(1)}k` : 'Activa'}
                        </Badge>
                      </div>
                    ))}
                    {socialMedia.filter(s => !s.is_active).slice(0, 2).map((social) => (
                      <div key={social.id} className="flex items-center justify-between">
                        <span className="text-purple-200 opacity-60">{social.platform}</span>
                        <Badge className="bg-red-900/50 text-red-200 border-red-600/30">
                          <Clock className="h-3 w-3 mr-1" />
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
            <EventsManager events={events} updateEvents={updateEvents} />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager contacts={contacts} updateContacts={updateContacts} />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialsManager testimonials={testimonials} updateTestimonials={updateTestimonials} />
          </TabsContent>

          <TabsContent value="posts">
            <PostsManager />
          </TabsContent>

          <TabsContent value="landing">
            <LandingPageManager />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManager />
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