import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Heart,
  Calendar,
  MapPin,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const EventsManager = ({ events, updateEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    location: '',
    category: '',
    status: 'upcoming'
  });
  const { toast } = useToast();

  const categories = ['Tecnología', 'Negocios', 'Educación', 'Entretenimiento', 'Deportes', 'Cultura'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date_time: '',
      location: '',
      category: '',
      status: 'upcoming'
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.date_time || !formData.location || !formData.category) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const newEvent = {
      id: Math.max(...events.map(e => e.id)) + 1,
      ...formData,
      attendees_count: 0,
      subscribers_count: 0,
      likes_count: 0,
      created_by: {
        id: 1,
        name: "Admin User",
        email: "admin@scapeevents.com"
      },
      created_at: new Date().toISOString()
    };

    const updatedEvents = [...events, newEvent];
    updateEvents(updatedEvents);
    
    toast({
      title: "Evento creado",
      description: "El evento se ha creado exitosamente",
    });

    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date_time: event.date_time.slice(0, 16),
      location: event.location,
      category: event.category,
      status: event.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const updatedEvents = events.map(event =>
      event.id === selectedEvent.id
        ? { ...event, ...formData }
        : event
    );
    
    updateEvents(updatedEvents);
    
    toast({
      title: "Evento actualizado",
      description: "El evento se ha actualizado exitosamente",
    });

    setIsEditModalOpen(false);
    resetForm();
    setSelectedEvent(null);
  };

  const handleDelete = (eventId) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    updateEvents(updatedEvents);
    
    toast({
      title: "Evento eliminado",
      description: "El evento se ha eliminado exitosamente",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-900/50 text-green-200 border-green-600/30';
      case 'ongoing':
        return 'bg-blue-900/50 text-blue-200 border-blue-600/30';
      case 'past':
        return 'bg-gray-900/50 text-gray-200 border-gray-600/30';
      default:
        return 'bg-purple-900/50 text-purple-200 border-purple-600/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Eventos</h2>
          <p className="text-purple-300">Administra todos los eventos de la plataforma</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <Plus className="h-4 w-4 mr-2" />
              Crear Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Evento</DialogTitle>
              <DialogDescription className="text-purple-300">
                Completa la información para crear un nuevo evento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-purple-200">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-purple-200">Descripción *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_time" className="text-purple-200">Fecha y Hora *</Label>
                <Input
                  id="date_time"
                  name="date_time"
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-purple-200">Ubicación *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-purple-200">Categoría *</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-500/30">
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-purple-900/50">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-purple-300 hover:bg-purple-900/50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  Crear Evento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-purple-200">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-200">Categoría</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  <SelectItem value="all" className="text-white hover:bg-purple-900/50">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-purple-900/50">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-200">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  <SelectItem value="all" className="text-white hover:bg-purple-900/50">Todos</SelectItem>
                  <SelectItem value="upcoming" className="text-white hover:bg-purple-900/50">Próximos</SelectItem>
                  <SelectItem value="ongoing" className="text-white hover:bg-purple-900/50">En curso</SelectItem>
                  <SelectItem value="past" className="text-white hover:bg-purple-900/50">Pasados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid gap-6">
        {filteredEvents.map(event => (
          <Card key={event.id} className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-white">{event.title}</CardTitle>
                  <CardDescription className="text-purple-300">
                    {event.description}
                  </CardDescription>
                  <div className="flex items-center space-x-4 text-sm text-purple-200">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date_time)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  <Badge className={getStatusColor(event.status)}>
                    {event.status === 'upcoming' ? 'Próximo' : 
                     event.status === 'ongoing' ? 'En curso' : 'Pasado'}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                    {event.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex space-x-6 text-sm text-purple-200">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees_count} asistentes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{event.subscribers_count} suscritos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{event.likes_count} likes</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(event)}
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-400 hover:bg-red-900/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredEvents.length === 0 && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron eventos</h3>
                <p className="text-purple-300">No hay eventos que coincidan con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Evento</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información del evento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-purple-200">Título *</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-purple-200">Descripción *</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date_time" className="text-purple-200">Fecha y Hora *</Label>
              <Input
                id="edit-date_time"
                name="date_time"
                type="datetime-local"
                value={formData.date_time}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-purple-200">Ubicación *</Label>
              <Input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-purple-200">Categoría *</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-purple-900/50">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-purple-200">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  <SelectItem value="upcoming" className="text-white hover:bg-purple-900/50">Próximo</SelectItem>
                  <SelectItem value="ongoing" className="text-white hover:bg-purple-900/50">En curso</SelectItem>
                  <SelectItem value="past" className="text-white hover:bg-purple-900/50">Pasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Actualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsManager;