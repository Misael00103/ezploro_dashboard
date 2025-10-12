import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Trophy,
  Users,
  Heart,
  MessageCircle,
  Calendar,
  Star,
  Crown,
  Medal,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getRankingUsuariosMasSuscritos,
  getRankingUsuariosMasPuntos,
  getRankingUsuariosMasLikesDados,
  getRankingUsuariosMasComentarios,
  getRankingUsuariosMasEventosCreados,
  getRankingEventosMasSuscritos,
  getRankingEventosMasLikes
} from '../services/rankingService';

const RankingsManager = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [limit, setLimit] = useState(10);
  const [rankings, setRankings] = useState({
    usuariosMasSuscritos: [],
    usuariosMasPuntos: [],
    usuariosMasLikesDados: [],
    usuariosMasComentarios: [],
    usuariosMasEventosCreados: [],
    eventosMasSuscritos: [],
    eventosMasLikes: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadRankings = async () => {
    try {
      setIsLoading(true);
      const [
        usuariosMasSuscritos,
        usuariosMasPuntos,
        usuariosMasLikesDados,
        usuariosMasComentarios,
        usuariosMasEventosCreados,
        eventosMasSuscritos,
        eventosMasLikes
      ] = await Promise.allSettled([
        getRankingUsuariosMasSuscritos(limit),
        getRankingUsuariosMasPuntos(limit),
        getRankingUsuariosMasLikesDados(limit),
        getRankingUsuariosMasComentarios(limit),
        getRankingUsuariosMasEventosCreados(limit),
        getRankingEventosMasSuscritos(limit),
        getRankingEventosMasLikes(limit)
      ]);

      setRankings({
        usuariosMasSuscritos: usuariosMasSuscritos.status === 'fulfilled' ? usuariosMasSuscritos.value : [],
        usuariosMasPuntos: usuariosMasPuntos.status === 'fulfilled' ? usuariosMasPuntos.value : [],
        usuariosMasLikesDados: usuariosMasLikesDados.status === 'fulfilled' ? usuariosMasLikesDados.value : [],
        usuariosMasComentarios: usuariosMasComentarios.status === 'fulfilled' ? usuariosMasComentarios.value : [],
        usuariosMasEventosCreados: usuariosMasEventosCreados.status === 'fulfilled' ? usuariosMasEventosCreados.value : [],
        eventosMasSuscritos: eventosMasSuscritos.status === 'fulfilled' ? eventosMasSuscritos.value : [],
        eventosMasLikes: eventosMasLikes.status === 'fulfilled' ? eventosMasLikes.value : []
      });
    } catch (error) {
      console.error('Error loading rankings:', error);
      toast.error('Error al cargar los rankings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [limit]);

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-purple-400" />;
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1:
        return 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30';
      case 2:
        return 'bg-gray-900/50 text-gray-200 border-gray-600/30';
      case 3:
        return 'bg-amber-900/50 text-amber-200 border-amber-600/30';
      default:
        return 'bg-purple-900/50 text-purple-200 border-purple-600/30';
    }
  };

  const UserRankingCard = ({ users, title, icon, countLabel }) => (
    <Card className="bg-black/40 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user, index) => (
            <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
              <div className="flex items-center gap-3">
                <Badge className={getRankColor(index + 1)}>
                  {getRankIcon(index + 1)}
                  #{index + 1}
                </Badge>
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=7c3aed&color=fff&size=40`} 
                    alt={user.display_name || user.username}
                  />
                  <AvatarFallback className="bg-purple-600 text-white">
                    {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{user.display_name || user.username}</p>
                  <p className="text-sm text-purple-300">@{user.username}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                {user.count} {countLabel}
              </Badge>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-8 text-purple-300">
              No hay datos disponibles
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EventRankingCard = ({ events, title, icon, countLabel }) => (
    <Card className="bg-black/40 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={event.event_id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
              <div className="flex items-center gap-3">
                <Badge className={getRankColor(index + 1)}>
                  {getRankIcon(index + 1)}
                  #{index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium text-white">{event.title}</p>
                  {event.organizer && (
                    <p className="text-sm text-purple-300">
                      Por: {event.organizer.display_name || event.organizer.username}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                {event.count} {countLabel}
              </Badge>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-8 text-purple-300">
              No hay datos disponibles
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Rankings y Estadísticas</h2>
          <p className="text-purple-300">Descubre los usuarios y eventos más destacados</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-32 bg-black/50 border-purple-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-500/30">
              <SelectItem value="5" className="text-white hover:bg-purple-900/50">Top 5</SelectItem>
              <SelectItem value="10" className="text-white hover:bg-purple-900/50">Top 10</SelectItem>
              <SelectItem value="20" className="text-white hover:bg-purple-900/50">Top 20</SelectItem>
              <SelectItem value="50" className="text-white hover:bg-purple-900/50">Top 50</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={loadRankings} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Rankings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-black/30 border border-purple-500/30">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Users className="h-4 w-4 mr-2" />
            Rankings de Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Rankings de Eventos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UserRankingCard
              users={rankings.usuariosMasSuscritos}
              title="Usuarios Más Seguidos"
              icon={<Users className="h-5 w-5 text-purple-400" />}
              countLabel="seguidores"
            />
            <UserRankingCard
              users={rankings.usuariosMasPuntos}
              title="Usuarios con Más Puntos"
              icon={<Star className="h-5 w-5 text-purple-400" />}
              countLabel="puntos"
            />
            <UserRankingCard
              users={rankings.usuariosMasLikesDados}
              title="Usuarios Más Activos (Likes)"
              icon={<Heart className="h-5 w-5 text-purple-400" />}
              countLabel="likes dados"
            />
            <UserRankingCard
              users={rankings.usuariosMasComentarios}
              title="Usuarios Más Comentaristas"
              icon={<MessageCircle className="h-5 w-5 text-purple-400" />}
              countLabel="comentarios"
            />
            <UserRankingCard
              users={rankings.usuariosMasEventosCreados}
              title="Organizadores Más Activos"
              icon={<Calendar className="h-5 w-5 text-purple-400" />}
              countLabel="eventos creados"
            />
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <EventRankingCard
              events={rankings.eventosMasSuscritos}
              title="Eventos Más Populares"
              icon={<Users className="h-5 w-5 text-purple-400" />}
              countLabel="suscriptores"
            />
            <EventRankingCard
              events={rankings.eventosMasLikes}
              title="Eventos Más Queridos"
              icon={<Heart className="h-5 w-5 text-purple-400" />}
              countLabel="likes"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingsManager;