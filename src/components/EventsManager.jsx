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
  Filter,
  Upload,
  X
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { getAuthToken } from '../services/authService';
import { getCurrentUserId } from '../services/userService';
import { searchPlaces as searchPlacesAPI, getPlaceDetails, reverseGeocode } from '../services/placesService';

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
    resume: '',
    date_time: '',
    end_date_time: '',
    location: '',
    category: '',
    subcategory: '',
    status: 'upcoming',
    cover_image: null,
    price: 0,
    video_url: '',
    address: '',
    city: '',
    state: '',
    country: 'República Dominicana',
    online: false,
    faqs: []
  });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const { toast } = useToast();

  const categories = [
    'Música',
    'Comida & Bebida',
    'Deportes & Fitness',
    'Teatro',
    'Tecnología & Educación',
    'Familia',
    'Ferias & Mercados',
    'Naturaleza & Aire Libre',
    'Caridad & Comunidad',
    'Online',
    'After',
    'Casino'
  ];
  
  const subcategories = {
    'Música': [
      'Reguetón / Dembow',
      'Bachata',
      'Merengue',
      'Electrónica',
      'Salsa',
      'Trap / Hip-Hop',
      'Pop',
      'Rock / Alternativo',
      'Karaoke',
      'Otros'
    ],
    'Comida & Bebida': [
      'Brunch',
      'Comida rápida',
      'Dominicana',
      'Internacional',
      'Asiática',
      'Mexicana',
      'Mariscos',
      'Italiana',
      'Catas & Bebidas'
    ],
    'Deportes & Fitness': [
      'Béisbol',
      'Baloncesto',
      'Fútbol',
      'Boxeo',
      'Fitness',
      'Running / Maratones',
      'Baile'
    ],
    'Teatro': [
      'Obras de teatro',
      'Stand-up comedy',
      'Musicales',
      'Danza'
    ],
    'Tecnología & Educación': [
      'Conferencias',
      'Talleres / cursos',
      'Startups / Innovacion'
    ],
    'Familia': [
      'Eventos infantiles',
      'Aire libre',
      'Talleres para niños',
      'Shows familiares',
      'Actividades escolares'
    ],
    'Ferias & Mercados': [
      'Ferias de comida',
      'Mercados artesanales',
      'Moda & diseño',
      'Libros & cultura',
      'Ferias inmobiliarias / negocios',
      'Feria anime y cultura pop',
      'Videojuegos / eSports'
    ],
    'Naturaleza & Aire Libre': [
      'Excursiones',
      'Camping',
      'Ecoturismo',
      'Actividades acuáticas',
      'Aventuras extremas'
    ],
    'Caridad & Comunidad': [
      'Eventos benéficos',
      'Voluntariado',
      'Donaciones',
      'Campañas sociales'
    ],
    'Online': [
      'Webinars',
      'Talleres virtuales',
      'Networking online',
      'Streaming',
      'Cursos en línea'
    ],
    'Casino': [
      'Torneos'
    ]
  };

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
      resume: '',
      date_time: '',
      end_date_time: '',
      location: '',
      category: '',
      subcategory: '',
      status: 'upcoming',
      cover_image: null,
      price: 0,
      video_url: '',
      address: '',
      city: '',
      state: '',
      country: 'República Dominicana',
      online: false,
      faqs: []
    });
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setSelectedCoordinates(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, cover_image: file });
    }
  };

  const addFAQ = () => {
    setFormData({
      ...formData,
      faqs: [...formData.faqs, { id: Date.now(), question: '', answer: '' }]
    });
  };

  const removeFAQ = (id) => {
    setFormData({
      ...formData,
      faqs: formData.faqs.filter(faq => faq.id !== id)
    });
  };

  const updateFAQ = (id, field, value) => {
    setFormData({
      ...formData,
      faqs: formData.faqs.map(faq =>
        faq.id === id ? { ...faq, [field]: value } : faq
      )
    });
  };

  // Obtener ubicación actual del usuario
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedCoordinates({ lat: latitude, lng: longitude });
        
        // Usar geocoding inverso para obtener la dirección
        try {
          const result = await reverseGeocode(latitude, longitude);
          const addressComponents = result.address_components;
          
          // Extraer información de la dirección
          let address = '';
          let city = '';
          let state = '';
          let country = 'República Dominicana';
          
          addressComponents.forEach(component => {
            if (component.types.includes('street_number') || component.types.includes('route')) {
              address += component.long_name + ' ';
            }
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (component.types.includes('country')) {
              country = component.long_name;
            }
          });
          
          setFormData({
            ...formData,
            location: result.formatted_address,
            address: address.trim(),
            city: city || state,
            state: state,
            country: country
          });
          
          toast({
            title: "Ubicación obtenida",
            description: "Se ha obtenido tu ubicación actual",
          });
        } catch (error) {
          console.error('Error en geocoding inverso:', error);
          toast({
            title: "Ubicación obtenida",
            description: "Coordenadas obtenidas, pero no se pudo obtener la dirección completa",
          });
        }
      },
      (error) => {
        toast({
          title: "Error",
          description: "No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación o ingresa la dirección manualmente.",
          variant: "destructive"
        });
      }
    );
  };

  // Buscar lugares usando Google Places API a través del backend
  const searchPlaces = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const predictions = await searchPlacesAPI(query);
      
      if (predictions && predictions.length > 0) {
        setLocationSuggestions(predictions);
      setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Manejar selección de lugar y obtener detalles completos
  const handleLocationSelect = async (place) => {
    setFormData({ ...formData, location: place.description });
    setShowSuggestions(false);
    
    try {
      const result = await getPlaceDetails(place.place_id);
      
      // Extraer coordenadas
      if (result.geometry && result.geometry.location) {
        let lat, lng;
        // Manejar tanto funciones como valores directos
        if (typeof result.geometry.location.lat === 'function') {
          lat = result.geometry.location.lat();
          lng = result.geometry.location.lng();
        } else {
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
        }
        setSelectedCoordinates({ 
          lat: Number(lat) || 0, 
          lng: Number(lng) || 0 
        });
      }
      
      // Extraer información de la dirección
      if (result.address_components) {
        let address = '';
        let city = '';
        let state = '';
        let country = 'República Dominicana';
        
        result.address_components.forEach(component => {
          if (component.types.includes('street_number') || component.types.includes('route')) {
            address += component.long_name + ' ';
          }
          if (component.types.includes('locality') || component.types.includes('sublocality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });
        
        setFormData({
          ...formData,
          location: result.formatted_address || place.description,
          address: address.trim() || result.name || '',
          city: city || state || '',
          state: state || '',
          country: country
        });
      }
    } catch (error) {
      console.error('Error obteniendo detalles del lugar:', error);
      // Si falla, al menos establecer la descripción
      setFormData({ ...formData, location: place.description });
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });
    
    // Si el campo está vacío, ocultar sugerencias
    if (!value || value.trim().length === 0) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Buscar lugares después de escribir
    searchPlaces(value);
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

    try {
      const userId = getCurrentUserId();
      if (!userId) {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del usuario. Por favor inicia sesión nuevamente.",
          variant: "destructive"
        });
        return;
      }

      // Preparar datos del evento según el formato esperado por el backend
      const eventData = {
        title: formData.title,
        description: formData.description,
        resume: formData.resume || formData.description.substring(0, 200),
        organizer_id: userId,
        date_time: formData.date_time,
        end_date_time: formData.end_date_time || formData.date_time,
        location: formData.location,
        online: formData.online || false,
        category: formData.category,
        subcategory: formData.subcategory || '',
        price: formData.price || 0,
        video_url: formData.video_url || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        country: formData.country || 'República Dominicana',
        faqs: formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim()), // Solo enviar FAQs completas
        cover_image: formData.cover_image,
      };

      // Si hay coordenadas, agregarlas
      if (selectedCoordinates) {
        eventData.latitude = selectedCoordinates.lat;
        eventData.longitude = selectedCoordinates.lng;
        eventData.location = {
          type: "Point",
          coordinates: [selectedCoordinates.lng, selectedCoordinates.lat]
        };
      }

      const newEvent = await createEvent(eventData);
      
      // Recargar la lista completa de eventos desde el servidor para evitar duplicados
      try {
        const { getEvents } = await import('../services/eventService');
        const updatedEventsList = await getEvents();
        updateEvents(updatedEventsList);
      } catch (fetchError) {
        console.error('Error al recargar eventos:', fetchError);
        // Si falla la recarga, agregar solo el nuevo evento si no existe ya
        updateEvents(newEvent);
      }
    
    toast({
      title: "Evento creado",
      description: "El evento se ha creado exitosamente",
    });

    setIsCreateModalOpen(false);
    resetForm();
    } catch (error) {
      console.error('Error al crear evento:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el evento. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    
    // Preparar fecha para el input datetime-local
    const formatDateTimeLocal = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      title: event.title || '',
      description: event.description || '',
      resume: event.resume || '',
      date_time: formatDateTimeLocal(event.date_time),
      end_date_time: formatDateTimeLocal(event.end_date_time),
      location: typeof event.location === 'string' ? event.location : '',
      category: event.category || '',
      subcategory: event.subcategory || '',
      price: event.price || 0,
      video_url: event.video_url || event.videoUrl || '',
      address: event.address || '',
      city: event.city || '',
      state: event.state || '',
      country: event.country || '',
      online: event.online || false,
      status: event.status || 'upcoming',
      cover_image: null, // No pre-cargar imagen en edición
      faqs: event.faqs && Array.isArray(event.faqs) && event.faqs.length > 0
        ? event.faqs.map((faq, idx) => ({
            id: faq.id || Date.now() + idx,
            question: faq.question || '',
            answer: faq.answer || ''
          }))
        : []
    });

    // Si hay coordenadas en el evento, establecerlas
    if (event.location && typeof event.location === 'object' && event.location.coordinates) {
      setSelectedCoordinates({
        lat: event.location.coordinates[1],
        lng: event.location.coordinates[0]
      });
    } else if (event.latitude && event.longitude) {
      setSelectedCoordinates({
        lat: event.latitude,
        lng: event.longitude
      });
    }

    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un evento para editar",
        variant: "destructive"
      });
      return;
    }

    try {
      const eventId = selectedEvent.id || selectedEvent.event_id || selectedEvent.eventId;
      if (!eventId) {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del evento",
          variant: "destructive"
        });
        return;
      }

      // Preparar datos para actualizar
      const eventData = {
        id: eventId,
        event_id: eventId,
        title: formData.title,
        description: formData.description,
        resume: formData.resume || formData.description?.substring(0, 200) || '',
        date_time: formData.date_time,
        end_date_time: formData.end_date_time || formData.date_time,
        location: formData.location,
        online: formData.online || false,
        category: formData.category,
        subcategory: formData.subcategory || '',
        price: formData.price || 0,
        video_url: formData.video_url || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        country: formData.country || '',
        faqs: formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim()), // Solo enviar FAQs completas
      };

      // Si hay nueva imagen
      if (formData.cover_image) {
        eventData.cover_image = formData.cover_image;
      }

      // Si hay coordenadas actualizadas
      if (selectedCoordinates) {
        eventData.latitude = selectedCoordinates.lat;
        eventData.longitude = selectedCoordinates.lng;
        eventData.location = {
          type: "Point",
          coordinates: [selectedCoordinates.lng, selectedCoordinates.lat]
        };
      }

      const updatedEvent = await updateEvent(eventId, eventData);
      
      // Recargar la lista completa de eventos desde el servidor para evitar problemas de sincronización
      try {
        const { getEvents } = await import('../services/eventService');
        const updatedEventsList = await getEvents();
        updateEvents(updatedEventsList);
      } catch (fetchError) {
        console.error('Error al recargar eventos:', fetchError);
        // Si falla la recarga, actualizar solo el evento modificado
        updateEvents(updatedEvent);
      }
    
    toast({
      title: "Evento actualizado",
      description: "El evento se ha actualizado exitosamente",
    });

    setIsEditModalOpen(false);
    resetForm();
    setSelectedEvent(null);
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el evento. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (event) => {
    const eventId = event.id || event.event_id || event.eventId;
    
    if (!eventId) {
      toast({
        title: "Error",
        description: "No se pudo obtener el ID del evento",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteEvent(eventId);
      
      // Recargar la lista completa de eventos desde el servidor para evitar problemas de sincronización
      try {
        const { getEvents } = await import('../services/eventService');
        const updatedEventsList = await getEvents();
        updateEvents(updatedEventsList);
      } catch (fetchError) {
        console.error('Error al recargar eventos:', fetchError);
        // Si falla la recarga, actualizar la lista local eliminando el evento
        const updatedEvents = events.filter(e => 
          (e.id !== eventId && e.event_id !== eventId && e.eventId !== eventId)
        );
    updateEvents(updatedEvents);
      }
    
    toast({
      title: "Evento eliminado",
      description: "El evento se ha eliminado exitosamente",
    });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el evento. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestión de Eventos</h2>
          <p className="text-sm sm:text-base text-purple-300 mt-1">Administra todos los eventos de la plataforma</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <Plus className="h-4 w-4 mr-2" />
              Crear Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-white">Crear Nuevo Evento</DialogTitle>
              <DialogDescription className="text-purple-300">
                Completa la información para crear un nuevo evento
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
              <form onSubmit={handleCreate} className="space-y-4 pb-4">
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
                <Label htmlFor="resume" className="text-purple-200">Resumen</Label>
                <Textarea
                  id="resume"
                  name="resume"
                  value={formData.resume}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  rows={2}
                  placeholder="Breve descripción del evento..."
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

              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="date_time" className="text-purple-200">Fecha y Hora Inicio *</Label>
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
                  <Label htmlFor="end_date_time" className="text-purple-200">Fecha y Hora Fin</Label>
                  <Input
                    id="end_date_time"
                    name="end_date_time"
                    type="datetime-local"
                    value={formData.end_date_time}
                    onChange={handleInputChange}
                    className="bg-black/50 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-purple-200">Precio</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="online"
                    name="online"
                    checked={formData.online}
                    onChange={(e) => setFormData({ ...formData, online: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-black border-purple-500 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="online" className="text-purple-200 cursor-pointer">Evento Online</Label>
                </div>
              </div>

              {!formData.online && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-purple-200">Ciudad *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="bg-black/50 border-purple-500/30 text-white"
                        placeholder="Santo Domingo"
                        required={!formData.online}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-purple-200">Estado/Provincia *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="bg-black/50 border-purple-500/30 text-white"
                        placeholder="Distrito Nacional"
                        required={!formData.online}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-purple-200">Dirección</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="bg-black/50 border-purple-500/30 text-white"
                      placeholder="Calle, número, sector..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-purple-200">País *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="bg-black/50 border-purple-500/30 text-white"
                      required={!formData.online}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="cover_image" className="text-purple-200">Imagen de Portada</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cover_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="bg-black/50 border-purple-500/30 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded"
                  />
                  <Upload className="h-4 w-4 text-purple-400" />
                </div>
                {formData.cover_image && (
                  <p className="text-sm text-purple-300">Archivo: {formData.cover_image.name}</p>
                )}
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                <Label htmlFor="location" className="text-purple-200">Ubicación *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="text-xs text-purple-300 border-purple-500/30 hover:bg-purple-900/50"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Usar mi ubicación
                  </Button>
                </div>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleLocationInputChange}
                  onFocus={() => {
                    // Si hay texto y sugerencias, mostrar desplegable al hacer focus
                    if (formData.location && formData.location.length >= 3 && locationSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="bg-black/50 border-purple-500/30 text-white"
                  placeholder="Buscar ubicación o dirección..."
                  required
                  autoComplete="off"
                />
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-black border border-purple-500/30 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {locationSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.place_id}
                        className="px-3 py-2 hover:bg-purple-900/50 cursor-pointer text-white text-sm border-b border-purple-500/20 last:border-b-0"
                        onMouseDown={(e) => {
                          // Prevenir que el blur del input cierre el desplegable antes del click
                          e.preventDefault();
                        }}
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-purple-400 flex-shrink-0" />
                          <span className="truncate">{suggestion.description}</span>
                        </div>
                      </div>
                    ))}
                    <div className="px-3 py-2 border-t border-purple-500/30">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Cerrar</span>
                      </button>
                    </div>
                  </div>
                )}
                {selectedCoordinates && (
                  <p className="text-xs text-purple-400">
                    Coordenadas: {Number(selectedCoordinates.lat).toFixed(4)}, {Number(selectedCoordinates.lng).toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-purple-200">Categoría *</Label>
                <Select value={formData.category} onValueChange={(value) => {
                  handleSelectChange('category', value);
                  setFormData(prev => ({ ...prev, subcategory: '' }));
                }}>
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

              {formData.category && subcategories[formData.category] && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory" className="text-purple-200">Subcategoría</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => handleSelectChange('subcategory', value)}>
                    <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/30">
                      {subcategories[formData.category].map(subcategory => (
                        <SelectItem key={subcategory} value={subcategory} className="text-white hover:bg-purple-900/50">
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* FAQs Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-purple-200">Preguntas Frecuentes (FAQs)</Label>
                  <Button
                    type="button"
                    onClick={addFAQ}
                    size="sm"
                    variant="outline"
                    className="text-purple-300 border-purple-500/30 hover:bg-purple-900/50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar FAQ
                  </Button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {formData.faqs.map((faq, index) => (
                    <div key={faq.id} className="p-3 bg-black/30 border border-purple-500/20 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-400">FAQ #{index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => removeFAQ(faq.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-900/50 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Pregunta..."
                          value={faq.question}
                          onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                          className="bg-black/50 border-purple-500/30 text-white text-sm"
                        />
                        <Textarea
                          placeholder="Respuesta..."
                          value={faq.answer}
                          onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                          className="bg-black/50 border-purple-500/30 text-white text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  {formData.faqs.length === 0 && (
                    <p className="text-sm text-purple-400 text-center py-4">
                      No hay FAQs agregadas. Haz clic en "Agregar FAQ" para agregar una.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-purple-500/30">
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredEvents.map(event => (
          <Card key={event.id || event.event_id || event.eventId || `event-${event.title}`} className="bg-black/40 border-purple-500/30 overflow-hidden hover:border-purple-500/50 transition-colors">
            {/* Event Image - Full Width */}
            {event.cover_image && (
              <div className="w-full h-48 sm:h-56 md:h-52 lg:h-64 xl:h-72 relative overflow-hidden">
                <img 
                  src={event.cover_image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1.5 sm:gap-2">
                  <Badge className={`${getStatusColor(event.status)} text-xs sm:text-sm px-2 py-0.5`}>
                    {event.status === 'upcoming' ? 'Próximo' : 
                     event.status === 'ongoing' ? 'En curso' : 'Pasado'}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-200 text-xs sm:text-sm px-2 py-0.5">
                    {event.category}
                  </Badge>
                </div>
              </div>
            )}
            <CardHeader className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl mb-1 sm:mb-2 line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="text-purple-300 text-xs sm:text-sm md:text-base line-clamp-2">
                    {event.description}
                  </CardDescription>
                  {event.organizer && (
                    <div className="flex items-center space-x-2 mt-2">
                      <img 
                        src={event.organizer.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.display_name || event.organizer.username || 'User')}&background=7c3aed&color=fff&size=32`} 
                        alt={event.organizer.display_name || event.organizer.username}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.display_name || event.organizer.username || 'User')}&background=7c3aed&color=fff&size=32`;
                        }}
                      />
                      <p className="text-xs sm:text-sm text-purple-400 truncate">
                        Por: {event.organizer.display_name || event.organizer.username}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-purple-200 mt-2 sm:mt-3">
                    <div className="flex items-center space-x-1 min-w-0">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(event.date_time)}</span>
                    </div>
                    <div className="flex items-center space-x-1 min-w-0 flex-1 sm:flex-initial">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{typeof event.location === 'string' ? event.location : 'Ubicación no disponible'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-purple-200">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{event.attendees_count || 0} asistentes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{event.subscribers_count || 0} suscritos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{event.likes_count || 0} likes</span>
                  </div>
                </div>
                <div className="flex space-x-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-300 hover:bg-purple-900/50 h-8 w-8 p-0"
                    title="Ver evento"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(event)}
                    className="text-purple-300 hover:bg-purple-900/50 h-8 w-8 p-0"
                    title="Editar evento"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(event)}
                    className="text-red-400 hover:bg-red-900/50 h-8 w-8 p-0"
                    title="Eliminar evento"
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
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white">Editar Evento</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información del evento
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
          <form onSubmit={handleUpdate} className="space-y-4 pb-4">
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
              <Label htmlFor="edit-resume" className="text-purple-200">Resumen</Label>
              <Textarea
                id="edit-resume"
                name="resume"
                value={formData.resume}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={2}
                placeholder="Breve descripción del evento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="edit-date_time" className="text-purple-200">Fecha y Hora Inicio *</Label>
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
                <Label htmlFor="edit-end_date_time" className="text-purple-200">Fecha y Hora Fin</Label>
                <Input
                  id="edit-end_date_time"
                  name="end_date_time"
                  type="datetime-local"
                  value={formData.end_date_time}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price" className="text-purple-200">Precio</Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-online"
                  name="online"
                  checked={formData.online}
                  onChange={(e) => setFormData({ ...formData, online: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-black border-purple-500 rounded focus:ring-purple-500"
                />
                <Label htmlFor="edit-online" className="text-purple-200 cursor-pointer">Evento Online</Label>
              </div>
            </div>

            {formData.online && (
              <div className="space-y-2">
                <Label htmlFor="edit-video_url" className="text-purple-200">URL de Video/Reunión</Label>
                <Input
                  id="edit-video_url"
                  name="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            {!formData.online && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city" className="text-purple-200">Ciudad *</Label>
                    <Input
                      id="edit-city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-black/50 border-purple-500/30 text-white"
                      placeholder="Santo Domingo"
                      required={!formData.online}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state" className="text-purple-200">Estado/Provincia *</Label>
                    <Input
                      id="edit-state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="bg-black/50 border-purple-500/30 text-white"
                      placeholder="Distrito Nacional"
                      required={!formData.online}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address" className="text-purple-200">Dirección</Label>
                  <Input
                    id="edit-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-black/50 border-purple-500/30 text-white"
                    placeholder="Calle, número, sector..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-country" className="text-purple-200">País *</Label>
                  <Input
                    id="edit-country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="bg-black/50 border-purple-500/30 text-white"
                    required={!formData.online}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-cover_image" className="text-purple-200">Nueva Imagen de Portada (opcional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="edit-cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-black/50 border-purple-500/30 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded"
                />
                <Upload className="h-4 w-4 text-purple-400" />
              </div>
              {formData.cover_image && (
                <p className="text-sm text-purple-300">Archivo: {formData.cover_image.name}</p>
              )}
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

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-location" className="text-purple-200">Ubicación *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="text-xs text-purple-300 border-purple-500/30 hover:bg-purple-900/50"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Usar mi ubicación
                </Button>
              </div>
              <Input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleLocationInputChange}
                onFocus={() => {
                  // Si hay texto y sugerencias, mostrar desplegable al hacer focus
                  if (formData.location && formData.location.length >= 3 && locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="Buscar ubicación o dirección..."
                required
                autoComplete="off"
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-black border border-purple-500/30 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                  {locationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="px-3 py-2 hover:bg-purple-900/50 cursor-pointer text-white text-sm border-b border-purple-500/20 last:border-b-0"
                      onMouseDown={(e) => {
                        // Prevenir que el blur del input cierre el desplegable antes del click
                        e.preventDefault();
                      }}
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{suggestion.description}</span>
                      </div>
                    </div>
                  ))}
                  <div className="px-3 py-2 border-t border-purple-500/30">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowSuggestions(false)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Cerrar</span>
                    </button>
                  </div>
                </div>
              )}
              {selectedCoordinates && (
                <p className="text-xs text-purple-400">
                  Coordenadas: {Number(selectedCoordinates.lat).toFixed(4)}, {Number(selectedCoordinates.lng).toFixed(4)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cover_image" className="text-purple-200">Nueva Imagen de Portada (opcional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="edit-cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-black/50 border-purple-500/30 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded"
                />
                <Upload className="h-4 w-4 text-purple-400" />
              </div>
              {formData.cover_image && (
                <p className="text-sm text-purple-300">Archivo: {formData.cover_image.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-purple-200">Categoría *</Label>
              <Select value={formData.category} onValueChange={(value) => {
                handleSelectChange('category', value);
                setFormData(prev => ({ ...prev, subcategory: '' }));
              }}>
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

            {formData.category && subcategories[formData.category] && (
              <div className="space-y-2">
                <Label htmlFor="edit-subcategory" className="text-purple-200">Subcategoría</Label>
                <Select value={formData.subcategory} onValueChange={(value) => handleSelectChange('subcategory', value)}>
                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-500/30">
                    {subcategories[formData.category].map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory} className="text-white hover:bg-purple-900/50">
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* FAQs Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-purple-200">Preguntas Frecuentes (FAQs)</Label>
                <Button
                  type="button"
                  onClick={addFAQ}
                  size="sm"
                  variant="outline"
                  className="text-purple-300 border-purple-500/30 hover:bg-purple-900/50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar FAQ
                </Button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {formData.faqs.map((faq, index) => (
                  <div key={faq.id} className="p-3 bg-black/30 border border-purple-500/20 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-400">FAQ #{index + 1}</span>
                      <Button
                        type="button"
                        onClick={() => removeFAQ(faq.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-900/50 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Pregunta..."
                        value={faq.question}
                        onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                        className="bg-black/50 border-purple-500/30 text-white text-sm"
                      />
                      <Textarea
                        placeholder="Respuesta..."
                        value={faq.answer}
                        onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                        className="bg-black/50 border-purple-500/30 text-white text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                {formData.faqs.length === 0 && (
                  <p className="text-sm text-purple-400 text-center py-4">
                    No hay FAQs agregadas. Haz clic en "Agregar FAQ" para agregar una.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-purple-500/30">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsManager;