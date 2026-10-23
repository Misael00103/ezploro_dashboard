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
  X,
  ExternalLink,
  Lock,
  Unlock,
  Ticket,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Share2,
  UserPlus,
  UserCheck,
  Loader2
} from 'lucide-react';
import { Switch } from './ui/switch';
import EventGuestManagerModal from './EventGuestManagerModal';
import AttendanceAuditModal from './AttendanceAuditModal';
import { useToast } from '../hooks/use-toast';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  deleteAllEvents,
  searchUsersToInvite,
  inviteUsersToEvent,
  getEventInvitedUsers
} from '../services/eventService';
import { getAuthToken } from '../services/authService';
import { getCurrentUserId, getAllUsers } from '../services/userService';
import { searchPlaces as searchPlacesAPI, getPlaceDetails, reverseGeocode } from '../services/placesService';

const EventsManager = ({ events, updateEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'grid'
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestModalEvent, setGuestModalEvent] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditModalEvent, setAuditModalEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Estados para búsqueda y selección de invitados a eventos privados
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestSearchResults, setGuestSearchResults] = useState([]);
  const [isSearchingGuests, setIsSearchingGuests] = useState(false);
  const [cachedUsersList, setCachedUsersList] = useState([]);

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
    ticket_url: '',
    is_private: false,
    allowed_users: [],
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
    website_url: '',
    address: '',
    city: '',
    state: '',
    country: 'República Dominicana',
    online: false,
    faqs: [],
    isRecurring: false,
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: null
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

  // Funciones para buscar y seleccionar usuarios invitados a eventos privados
  const handleSearchGuests = async (query) => {
    setGuestSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setGuestSearchResults([]);
      return;
    }

    try {
      setIsSearchingGuests(true);
      let results = [];
      try {
        results = await searchUsersToInvite(query);
      } catch (e) {
        console.warn('searchUsersToInvite error, using cached fallback:', e);
      }

      if (!results || results.length === 0) {
        let all = cachedUsersList;
        if (!all || all.length === 0) {
          try {
            all = await getAllUsers();
            setCachedUsersList(all || []);
          } catch (allErr) {
            console.warn('getAllUsers error:', allErr);
          }
        }
        const q = query.toLowerCase();
        results = (all || []).filter(u => {
          const name = (u.display_name || u.name || '').toLowerCase();
          const username = (u.username || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return name.includes(q) || username.includes(q) || email.includes(q);
        });
      }

      // Filtrar usuarios que ya estén en formData.allowed_users
      const currentIds = new Set((formData.allowed_users || []).map(u => String(u.id || u.user_id)));
      const filtered = (results || []).filter(u => !currentIds.has(String(u.id || u.user_id)));
      setGuestSearchResults(filtered.slice(0, 8));
    } catch (err) {
      console.error('Error buscando invitados:', err);
    } finally {
      setIsSearchingGuests(false);
    }
  };

  const handleAddGuest = (user) => {
    const userId = String(user.id || user.user_id);
    const exists = (formData.allowed_users || []).some(
      u => String(u.id || u.user_id) === userId
    );
    if (!exists) {
      setFormData(prev => ({
        ...prev,
        allowed_users: [...(prev.allowed_users || []), user]
      }));
    }
    setGuestSearchQuery('');
    setGuestSearchResults([]);
  };

  const handleRemoveGuest = (userId) => {
    const idStr = String(userId);
    setFormData(prev => ({
      ...prev,
      allowed_users: (prev.allowed_users || []).filter(
        u => String(u.id || u.user_id) !== idStr
      )
    }));
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
      ticket_url: '',
      is_private: false,
      allowed_users: [],
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      tiktok_url: '',
      website_url: '',
      address: '',
      city: '',
      state: '',
      country: 'República Dominicana',
      online: false,
      faqs: [],
      isRecurring: false,
      recurrenceType: 'daily',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
      recurrenceCount: null
    });
    setGuestSearchQuery('');
    setGuestSearchResults([]);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setSelectedCoordinates(null);
  };

  const handleOpenGuestModal = (event) => {
    setGuestModalEvent(event);
    setIsGuestModalOpen(true);
  };

  const handleOpenAuditModal = (event) => {
    setAuditModalEvent(event);
    setIsAuditModalOpen(true);
  };

  const handleGuestsUpdated = (updatedGuests) => {
    if (!guestModalEvent) return;
    const targetId = guestModalEvent.id || guestModalEvent.event_id;
    const updatedIds = updatedGuests.map(u => String(u.id || u.user_id));
    
    // Actualizar evento en estado local
    setGuestModalEvent(prev => prev ? { ...prev, allowed_user_ids: updatedIds } : prev);
    
    if (events && updateEvents) {
      const updatedList = events.map(ev => {
        if ((ev.id || ev.event_id) === targetId) {
          return {
            ...ev,
            allowed_user_ids: updatedIds
          };
        }
        return ev;
      });
      updateEvents(updatedList);
    }
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
    
    // Validación diferente para eventos online vs presenciales
    const requiredFields = ['title', 'description', 'date_time', 'category'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (formData.online) {
      // Para eventos online, requerir video_url
      if (!formData.video_url) {
        toast({
          title: "Error",
          description: "Por favor ingresa el link del evento online",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Para eventos presenciales, requerir location
      if (!formData.location) {
        toast({
          title: "Error",
          description: "Por favor ingresa la ubicación del evento",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (missingFields.length > 0) {
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
        location: formData.online ? 'Evento Online' : formData.location,
        online: formData.online || false,
        category: formData.category,
        subcategory: formData.subcategory || '',
        price: formData.price || 0,
        video_url: formData.online ? formData.video_url : (formData.video_url || ''),
        ticket_url: formData.ticket_url || '',
        is_private: Boolean(formData.is_private),
        allowed_user_ids: formData.is_private && Array.isArray(formData.allowed_users)
          ? formData.allowed_users.map(u => String(u.id || u.user_id))
          : [],
        allowed_users: formData.is_private ? (formData.allowed_users || []) : [],
        facebook_url: formData.facebook_url || '',
        instagram_url: formData.instagram_url || '',
        twitter_url: formData.twitter_url || '',
        tiktok_url: formData.tiktok_url || '',
        website_url: formData.website_url || '',
        social_links: {
          facebook: formData.facebook_url || '',
          instagram: formData.instagram_url || '',
          twitter: formData.twitter_url || '',
          tiktok: formData.tiktok_url || '',
          website: formData.website_url || '',
        },
        address: formData.online ? '' : (formData.address || ''),
        city: formData.online ? '' : (formData.city || ''),
        state: formData.online ? '' : (formData.state || ''),
        country: formData.online ? '' : (formData.country || 'República Dominicana'),
        faqs: formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim()), // Solo enviar FAQs completas
        cover_image: formData.cover_image,
        // Campos de eventos recurrentes
        isRecurring: formData.isRecurring || false,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null,
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null,
        recurrenceCount: formData.isRecurring && formData.recurrenceCount ? formData.recurrenceCount : null,
      };

      // Si hay coordenadas (solo para eventos presenciales), agregarlas
      if (!formData.online && selectedCoordinates) {
        eventData.latitude = selectedCoordinates.lat;
        eventData.longitude = selectedCoordinates.lng;
        eventData.location = {
          type: "Point",
          coordinates: [selectedCoordinates.lng, selectedCoordinates.lat]
        };
      }

      const newEvent = await createEvent(eventData);
      
      console.log('🔵 Evento creado:', newEvent);
      console.log('🔵 Es recurrente:', formData.isRecurring);

      // Si es un evento privado y se seleccionaron usuarios, asegurar que queden invitados
      const newEventId = newEvent?.id || newEvent?.event_id || newEvent?.eventId || newEvent?._id;
      const guestIds = formData.is_private && Array.isArray(formData.allowed_users)
        ? formData.allowed_users.map(u => String(u.id || u.user_id))
        : [];
      if (formData.is_private && guestIds.length > 0 && newEventId) {
        try {
          await inviteUsersToEvent(newEventId, guestIds);
          console.log(`✅ ${guestIds.length} invitados autorizados en el nuevo evento privado`);
        } catch (inviteErr) {
          console.warn('Aviso: invitaciones posteriores a la creación:', inviteErr);
        }
      }
      
      // Recargar la lista completa de eventos desde el servidor
      try {
        const { getEvents } = await import('../services/eventService');
        const updatedEventsList = await getEvents();
        console.log('✅ Lista de eventos recargada, total:', updatedEventsList.length);
        updateEvents(updatedEventsList);
      } catch (fetchError) {
        console.error('❌ Error al recargar eventos:', fetchError);
        // Si falla la recarga, recargar desde el componente padre
        toast({
          title: "Advertencia",
          description: "Evento creado pero necesitas recargar la página para verlo",
          variant: "default"
        });
      }
    
    toast({
      title: "Evento creado",
      description: formData.isRecurring 
        ? "El evento recurrente y sus instancias se han creado exitosamente" 
        : "El evento se ha creado exitosamente",
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
    console.log('🔵 handleEdit - Evento recibido:', event);
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

    // Extraer ubicación correctamente
    let locationText = '';
    let coordinates = null;
    
    if (typeof event.location === 'string') {
      // Si location es un string, usarlo directamente
      locationText = event.location;
    } else if (event.location && typeof event.location === 'object') {
      // Si location es un objeto con coordenadas
      if (event.location.coordinates && Array.isArray(event.location.coordinates)) {
        coordinates = {
          lat: event.location.coordinates[1],
          lng: event.location.coordinates[0]
        };
      }
      // Intentar obtener el texto de la ubicación de otros campos
      locationText = event.address || event.city || event.state || '';
    }
    
    // Si no hay locationText pero hay address, usar address
    if (!locationText && event.address) {
      locationText = event.address;
      if (event.city) locationText += `, ${event.city}`;
      if (event.state) locationText += `, ${event.state}`;
      if (event.country) locationText += `, ${event.country}`;
    }
    
    console.log('🔵 handleEdit - Location extraída:', locationText);
    console.log('🔵 handleEdit - Coordinates:', coordinates);

    setFormData({
      title: event.title || '',
      description: event.description || '',
      resume: event.resume || '',
      date_time: formatDateTimeLocal(event.date_time),
      end_date_time: formatDateTimeLocal(event.end_date_time),
      location: locationText,
      category: event.category || '',
      subcategory: event.subcategory || '',
      price: event.price || 0,
      video_url: event.video_url || event.videoUrl || '',
      ticket_url: event.ticket_url || '',
      is_private: event.is_private !== undefined ? Boolean(event.is_private) : false,
      allowed_users: Array.isArray(event.allowed_users) && event.allowed_users.length > 0
        ? event.allowed_users
        : Array.isArray(event.allowed_user_ids) && event.allowed_user_ids.length > 0
        ? event.allowed_user_ids.map(id => ({
            id: String(id),
            user_id: String(id),
            display_name: `Usuario #${id}`,
            username: `user_${id}`
          }))
        : [],
      facebook_url: event.facebook_url || event.social_links?.facebook || '',
      instagram_url: event.instagram_url || event.social_links?.instagram || '',
      twitter_url: event.twitter_url || event.social_links?.twitter || '',
      tiktok_url: event.tiktok_url || event.social_links?.tiktok || '',
      website_url: event.website_url || event.website || event.social_links?.website || '',
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

    // Si es un evento privado, sincronizar invitados completos desde el backend
    const eventIdForGuests = event.id || event.event_id || event.eventId;
    if (event.is_private && eventIdForGuests) {
      getEventInvitedUsers(eventIdForGuests).then(users => {
        if (Array.isArray(users) && users.length > 0) {
          setFormData(prev => ({
            ...prev,
            allowed_users: users
          }));
        }
      }).catch(() => {});
    }

    // Establecer coordenadas si existen
    if (coordinates) {
      setSelectedCoordinates(coordinates);
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
      // Obtener el ID del evento de múltiples posibles campos
      const eventId = selectedEvent.event_id || selectedEvent.id || selectedEvent.eventId || selectedEvent._id;
      
      console.log('🔵 handleUpdate - selectedEvent:', selectedEvent);
      console.log('🔵 handleUpdate - eventId extraído:', eventId);
      
      if (!eventId) {
        console.error('🔴 handleUpdate - No se encontró ID en el evento:', {
          event_id: selectedEvent.event_id,
          id: selectedEvent.id,
          eventId: selectedEvent.eventId,
          _id: selectedEvent._id,
          keys: Object.keys(selectedEvent)
        });
        
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del evento. Verifica la consola para más detalles.",
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
        ticket_url: formData.ticket_url || '',
        is_private: Boolean(formData.is_private),
        allowed_user_ids: formData.is_private && Array.isArray(formData.allowed_users)
          ? formData.allowed_users.map(u => String(u.id || u.user_id))
          : [],
        allowed_users: formData.is_private ? (formData.allowed_users || []) : [],
        facebook_url: formData.facebook_url || '',
        instagram_url: formData.instagram_url || '',
        twitter_url: formData.twitter_url || '',
        tiktok_url: formData.tiktok_url || '',
        website_url: formData.website_url || '',
        social_links: {
          facebook: formData.facebook_url || '',
          instagram: formData.instagram_url || '',
          twitter: formData.twitter_url || '',
          tiktok: formData.tiktok_url || '',
          website: formData.website_url || '',
        },
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

      console.log('🔵 handleUpdate - Llamando a updateEvent con eventData:', eventData);
      const updatedEvent = await updateEvent(eventData);

      // Si es un evento privado y se seleccionaron invitados, sincronizar invitaciones
      const guestIds = formData.is_private && Array.isArray(formData.allowed_users)
        ? formData.allowed_users.map(u => String(u.id || u.user_id))
        : [];
      if (formData.is_private && guestIds.length > 0 && eventId) {
        try {
          await inviteUsersToEvent(eventId, guestIds);
        } catch (inviteErr) {
          console.warn('Aviso al sincronizar invitados:', inviteErr);
        }
      }
      
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

  const handleDeleteAll = async () => {
    if (!events || events.length === 0) {
      toast({
        title: "No hay eventos",
        description: "No hay eventos para eliminar",
        variant: "destructive"
      });
      return;
    }

    // Primera confirmación
    if (!window.confirm(`¿Estás seguro de que deseas eliminar TODOS los eventos (${events.length} eventos)? Esta acción no se puede deshacer.`)) {
      return;
    }

    // Segunda confirmación
    if (!window.confirm('⚠️ ÚLTIMA ADVERTENCIA: Esto eliminará permanentemente todos los eventos. ¿Continuar?')) {
      return;
    }

    try {
      // Intentar eliminar todos de una vez
      await deleteAllEvents();
      
      // Recargar la lista completa de eventos desde el servidor
      try {
        const { getEvents } = await import('../services/eventService');
        const updatedEventsList = await getEvents();
        updateEvents(updatedEventsList);
      } catch (fetchError) {
        console.error('Error al recargar eventos:', fetchError);
        // Si falla la recarga, limpiar la lista local
        updateEvents([]);
      }
    
      toast({
        title: "Eventos eliminados",
        description: "Todos los eventos se han eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error al eliminar todos los eventos:', error);
      
      // Si falla la eliminación masiva por cualquier razón, intentar eliminar uno por uno
      toast({
        title: "Eliminando eventos...",
        description: "Eliminando eventos uno por uno. Esto puede tomar un momento.",
      });
      
      await deleteEventsOneByOne();
    }
  };

  const deleteEventsOneByOne = async () => {
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const event of events) {
      try {
        const eventId = event.id || event.event_id || event.eventId;
        if (eventId) {
          await deleteEvent(eventId);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error al eliminar evento ${event.id}:`, error);
        failedCount++;
      }
    }
    
    // Recargar la lista
    try {
      const { getEvents } = await import('../services/eventService');
      const updatedEventsList = await getEvents();
      updateEvents(updatedEventsList);
    } catch (fetchError) {
      console.error('Error al recargar eventos:', fetchError);
      updateEvents([]);
    }
    
    if (failedCount === 0) {
      toast({
        title: "Eventos eliminados",
        description: `Se eliminaron ${deletedCount} eventos exitosamente`,
      });
    } else {
      toast({
        title: "Eliminación parcial",
        description: `Se eliminaron ${deletedCount} eventos. ${failedCount} eventos no pudieron ser eliminados.`,
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleDeleteAll}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            disabled={!events || events.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Todos
          </Button>
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

              {formData.online ? (
                <div className="space-y-2">
                  <Label htmlFor="video_url" className="text-purple-200">Link del Evento Online *</Label>
                  <Input
                    id="video_url"
                    name="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    className="bg-black/50 border-purple-500/30 text-white"
                    placeholder="https://zoom.us/j/123456789 o https://meet.google.com/..."
                    required={formData.online}
                  />
                  <p className="text-xs text-purple-400">
                    Ingresa el enlace de Zoom, Google Meet, Teams u otra plataforma
                  </p>
                </div>
              ) : (
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
                        if (formData.location && formData.location.length >= 3 && locationSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="bg-black/50 border-purple-500/30 text-white"
                      placeholder="Buscar ubicación o dirección..."
                      required={!formData.online}
                      autoComplete="off"
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-black border border-purple-500/30 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                        {locationSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="px-3 py-2 hover:bg-purple-900/50 cursor-pointer text-white text-sm border-b border-purple-500/20 last:border-b-0"
                            onMouseDown={(e) => {
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

              {/* Recurring Events Section */}
              <div className="space-y-3 pt-4 border-t border-purple-500/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-black border-purple-500 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="isRecurring" className="text-purple-200 cursor-pointer">Evento Recurrente</Label>
                </div>

                {formData.isRecurring && (
                  <div className="space-y-4 pl-6 border-l-2 border-purple-500/30">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceType" className="text-purple-200">Tipo de Recurrencia *</Label>
                      <Select 
                        value={formData.recurrenceType} 
                        onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}
                      >
                        <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                          <SelectValue placeholder="Selecciona frecuencia" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/30">
                          <SelectItem value="daily" className="text-white hover:bg-purple-900/50">Diario</SelectItem>
                          <SelectItem value="weekly" className="text-white hover:bg-purple-900/50">Semanal</SelectItem>
                          <SelectItem value="monthly" className="text-white hover:bg-purple-900/50">Mensual</SelectItem>
                          <SelectItem value="yearly" className="text-white hover:bg-purple-900/50">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrenceInterval" className="text-purple-200">
                        Intervalo (cada cuántos {formData.recurrenceType === 'daily' ? 'días' : formData.recurrenceType === 'weekly' ? 'semanas' : formData.recurrenceType === 'monthly' ? 'meses' : 'años'}) *
                      </Label>
                      <Input
                        id="recurrenceInterval"
                        name="recurrenceInterval"
                        type="number"
                        min="1"
                        value={formData.recurrenceInterval}
                        onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                        className="bg-black/50 border-purple-500/30 text-white"
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-200">Finalización</Label>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="recurrenceEndDate" className="text-purple-300 text-sm">Fecha de Fin</Label>
                          <Input
                            id="recurrenceEndDate"
                            name="recurrenceEndDate"
                            type="date"
                            value={formData.recurrenceEndDate}
                            onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value, recurrenceCount: null })}
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-300 text-sm">o</span>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurrenceCount" className="text-purple-300 text-sm">Número de Ocurrencias</Label>
                          <Input
                            id="recurrenceCount"
                            name="recurrenceCount"
                            type="number"
                            min="1"
                            value={formData.recurrenceCount || ''}
                            onChange={(e) => setFormData({ ...formData, recurrenceCount: e.target.value ? parseInt(e.target.value) : null, recurrenceEndDate: '' })}
                            className="bg-black/50 border-purple-500/30 text-white"
                            placeholder="Ej: 10 eventos"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-purple-400 mt-2">
                        Especifica una fecha de fin o un número de ocurrencias (no ambos)
                      </p>
                    </div>
                  </div>
                )}

                {/* Visibilidad y Boletos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-500/20">
                  <div className="space-y-2">
                    <Label htmlFor="create_ticket_url" className="text-purple-200 text-xs">
                      URL de Boletería / Entradas
                    </Label>
                    <Input
                      id="create_ticket_url"
                      name="ticket_url"
                      value={formData.ticket_url || ''}
                      onChange={handleInputChange}
                      placeholder="https://tuboleta.com/evento/..."
                      className="bg-black/50 border-purple-500/30 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col justify-end space-y-1">
                    <div className="flex items-center justify-between p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl">
                      <div>
                        <Label htmlFor="create_is_private" className="text-purple-200 text-xs font-semibold cursor-pointer block">
                          🔒 Evento Privado
                        </Label>
                        <span className="text-[10px] text-purple-400">
                          Solo invitados autorizados
                        </span>
                      </div>
                      <Switch
                        id="create_is_private"
                        checked={Boolean(formData.is_private)}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Panel de Selección de Invitados para Evento Privado (Crear) */}
                {Boolean(formData.is_private) && (
                  <div className="p-3.5 bg-gradient-to-b from-purple-950/60 to-black/80 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <Label className="text-purple-200 text-xs font-semibold block leading-tight">
                            Invitados Autorizados (Acceso Exclusivo)
                          </Label>
                          <span className="text-[10px] text-purple-400">
                            Solo estos usuarios podrán ver y asistir al evento
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-purple-900/60 text-purple-200 border border-purple-500/30 text-[10px]">
                        {formData.allowed_users?.length || 0} agregados
                      </Badge>
                    </div>

                    {/* Buscador interactivo de usuarios */}
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 text-purple-400" />
                        <Input
                          id="create_guest_search"
                          type="text"
                          value={guestSearchQuery}
                          onChange={(e) => handleSearchGuests(e.target.value)}
                          placeholder="Buscar usuario por nombre, @username o correo..."
                          className="pl-8 pr-8 py-1 h-8 text-xs bg-black/60 border-purple-500/40 text-white placeholder:text-zinc-500 focus:border-purple-400"
                        />
                        {isSearchingGuests && (
                          <Loader2 className="w-3.5 h-3.5 absolute right-2.5 text-purple-400 animate-spin" />
                        )}
                        {!isSearchingGuests && guestSearchQuery && (
                          <button
                            type="button"
                            onClick={() => { setGuestSearchQuery(''); setGuestSearchResults([]); }}
                            className="absolute right-2.5 text-purple-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown flotante con resultados de búsqueda */}
                      {guestSearchResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-purple-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-purple-500/20 custom-scrollbar">
                          {guestSearchResults.map((user) => {
                            const uid = user.id || user.user_id;
                            const displayName = user.display_name || user.name || user.username || 'Usuario';
                            const username = user.username ? `@${user.username}` : user.email || '';
                            const avatar = user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&size=32`;

                            return (
                              <div
                                key={uid}
                                className="flex items-center justify-between p-2 hover:bg-purple-900/40 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={avatar}
                                    alt={displayName}
                                    className="w-6 h-6 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&size=32`;
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate leading-tight">{displayName}</p>
                                    <p className="text-[10px] text-purple-300 truncate">{username}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleAddGuest(user)}
                                  className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-md flex items-center gap-1"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Agregar
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Lista de usuarios seleccionados */}
                    <div className="space-y-1.5">
                      {(!formData.allowed_users || formData.allowed_users.length === 0) ? (
                        <div className="text-center py-2.5 px-3 bg-black/30 border border-dashed border-purple-500/20 rounded-lg">
                          <p className="text-[11px] text-purple-300">
                            No has agregado invitados aún.
                          </p>
                          <p className="text-[10px] text-purple-400">
                            Escribe en el buscador arriba para añadir usuarios autorizados.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                          {formData.allowed_users.map((guest) => {
                            const gid = guest.id || guest.user_id;
                            const gName = guest.display_name || guest.name || guest.username || `Usuario #${gid}`;
                            const gUsername = guest.username ? `@${guest.username}` : (guest.email || '');
                            const gAvatar = guest.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=7c3aed&color=fff&size=32`;

                            return (
                              <div
                                key={gid}
                                className="flex items-center justify-between px-2.5 py-1.5 bg-black/40 border border-purple-500/20 rounded-lg group hover:border-purple-500/40 transition-all"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={gAvatar}
                                    alt={gName}
                                    className="w-5 h-5 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=7c3aed&color=fff&size=32`;
                                    }}
                                  />
                                  <span className="text-xs text-white font-medium truncate">{gName}</span>
                                  {gUsername && (
                                    <span className="text-[10px] text-purple-400 truncate">({gUsername})</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGuest(gid)}
                                  className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Quitar invitado"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Redes Sociales y Enlaces Web */}
                <div className="space-y-3 pt-3 border-t border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-purple-200 text-xs font-semibold flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                      Redes Sociales y Enlaces del Evento
                    </Label>
                    <span className="text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">Opcional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Instagram */}
                    <div className="space-y-1">
                      <Label htmlFor="create_instagram_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        Instagram
                      </Label>
                      <Input
                        id="create_instagram_url"
                        name="instagram_url"
                        value={formData.instagram_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/cuenta"
                        className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="space-y-1">
                      <Label htmlFor="create_facebook_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                        <Facebook className="w-3 h-3 text-blue-400" />
                        Facebook
                      </Label>
                      <Input
                        id="create_facebook_url"
                        name="facebook_url"
                        value={formData.facebook_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/evento"
                        className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                      />
                    </div>

                    {/* Twitter / X */}
                    <div className="space-y-1">
                      <Label htmlFor="create_twitter_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                        <Twitter className="w-3 h-3 text-sky-400" />
                        Twitter / X
                      </Label>
                      <Input
                        id="create_twitter_url"
                        name="twitter_url"
                        value={formData.twitter_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://x.com/usuario"
                        className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="space-y-1">
                      <Label htmlFor="create_tiktok_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                        <span className="font-black text-[10px] text-cyan-400 font-mono">TT</span>
                        TikTok
                      </Label>
                      <Input
                        id="create_tiktok_url"
                        name="tiktok_url"
                        value={formData.tiktok_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://tiktok.com/@cuenta"
                        className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                      />
                    </div>

                    {/* Sitio Web Oficial */}
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="create_website_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        Sitio Web Oficial / Landing Page
                      </Label>
                      <Input
                        id="create_website_url"
                        name="website_url"
                        value={formData.website_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://mievento.com"
                        className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                      />
                    </div>
                  </div>
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

      {/* View Switcher and Events Count Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-bold text-white">Eventos Registrados</h3>
          <Badge className="bg-purple-900/50 text-purple-200 border-purple-500/30 text-xs font-semibold">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
          </Badge>
        </div>
        <div className="flex items-center bg-black/60 border border-purple-500/30 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabla General
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cuadrícula
          </button>
        </div>
      </div>

      {/* 1. TABLA GENERAL DE EVENTOS (/admin/events) */}
      {viewMode === 'table' && (
        <Card className="bg-black/50 border-purple-500/30 overflow-hidden shadow-2xl">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-purple-950/40 text-purple-200 font-semibold uppercase tracking-wider text-[11px] border-b border-purple-500/30">
                <tr>
                  <th className="py-3.5 px-4 min-w-[220px]">Evento</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Fecha</th>
                  <th className="py-3.5 px-4">Tipo de Visibilidad</th>
                  <th className="py-3.5 px-4">Boletos / Entradas</th>
                  <th className="py-3.5 px-4">Gestión de Invitados</th>
                  <th className="py-3.5 px-4">Asistencias Reales</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-purple-300">
                      <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No se encontraron eventos</p>
                      <p className="text-xs text-purple-400 mt-1">No hay eventos que coincidan con los filtros aplicados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const eventId = event.id || event.event_id || event.eventId;
                    const isPrivate = Boolean(event.is_private);

                    return (
                      <tr key={eventId || `event-${event.title}`} className="hover:bg-purple-900/20 transition-colors">
                        {/* Evento: Imagen + Título + Ubicación */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-purple-950/50 border border-purple-500/30 flex-shrink-0">
                              {event.cover_image ? (
                                <img
                                  src={event.cover_image}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-purple-400">
                                  <Calendar className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <span className="font-bold text-white text-sm block truncate" title={event.title}>
                                {event.title}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-purple-300 truncate mt-0.5">
                                <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.address || 'Ubicación no especificada')}</span>
                              </div>
                              {event.organizer && (
                                <span className="text-[10px] text-purple-400 block truncate">
                                  Por: {event.organizer.display_name || event.organizer.username}
                                </span>
                              )}
                              {/* Redes sociales del evento */}
                              {(() => {
                                const ig = event.instagram_url || event.social_links?.instagram;
                                const fb = event.facebook_url || event.social_links?.facebook;
                                const tw = event.twitter_url || event.social_links?.twitter;
                                const tt = event.tiktok_url || event.social_links?.tiktok;
                                const ws = event.website_url || event.social_links?.website || event.website;
                                if (!ig && !fb && !tw && !tt && !ws) return null;
                                return (
                                  <div className="flex items-center gap-1.5 mt-1.5 pt-1 border-t border-purple-500/10">
                                    {ig && (
                                      <a href={ig} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-colors" title={`Instagram: ${ig}`}>
                                        <Instagram className="w-3 h-3" />
                                      </a>
                                    )}
                                    {fb && (
                                      <a href={fb} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" title={`Facebook: ${fb}`}>
                                        <Facebook className="w-3 h-3" />
                                      </a>
                                    )}
                                    {tw && (
                                      <a href={tw} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors" title={`Twitter/X: ${tw}`}>
                                        <Twitter className="w-3 h-3" />
                                      </a>
                                    )}
                                    {tt && (
                                      <a href={tt} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors text-[9px] font-bold font-mono" title={`TikTok: ${tt}`}>
                                        TT
                                      </a>
                                    )}
                                    {ws && (
                                      <a href={ws} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors" title={`Sitio Web: ${ws}`}>
                                        <Globe className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant="secondary" className="bg-purple-900/50 text-purple-200 text-xs">
                              {event.category}
                            </Badge>
                            <Badge className={`${getStatusColor(event.status)} text-[10px] px-1.5 py-0`}>
                              {event.status === 'upcoming' ? 'Próximo' : 
                               event.status === 'ongoing' ? 'En curso' : 'Pasado'}
                            </Badge>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-4 text-purple-200 text-xs">
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span>{formatDate(event.date_time)}</span>
                          </div>
                        </td>

                        {/* 1.1 Columna 1: Tipo de Visibilidad */}
                        <td className="py-3 px-4">
                          {!isPrivate ? (
                            <span className="px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold inline-flex items-center gap-1">
                              Público
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold inline-flex items-center gap-1">
                              🔒 Privado
                            </span>
                          )}
                        </td>

                        {/* 1.1 Columna 2: Boletos / Entradas */}
                        <td className="py-3 px-4">
                          {event.ticket_url ? (
                            <a
                              href={event.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                              title="Abrir boletería en pestaña nueva para probar disponibilidad"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              Boletos
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">
                              Sin boletería
                            </span>
                          )}
                        </td>

                        {/* 1.1 Columna 3: Gestión de Invitados */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenGuestModal(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white transition-all shadow-sm"
                            title="Gestionar lista de invitados autorizados"
                          >
                            👥 {event.allowed_user_ids?.length || 0} Invitados
                          </button>
                        </td>

                        {/* 1.1 Columna 4: Asistencias Reales */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono"
                              title="Contador incrementado atómicamente por la regla presencial"
                            >
                              <Users className="w-3 h-3 mr-1 text-amber-400" />
                              {event.attendees_count || 0}
                            </span>
                            <button
                              onClick={() => handleOpenAuditModal(event)}
                              title="Auditoría GPS de Asistencias Presenciales"
                              className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAuditModal(event)}
                              className="text-emerald-400 hover:bg-emerald-950/40 h-8 w-8 p-0"
                              title="Auditoría GPS de Asistencias"
                            >
                              <ShieldCheck className="h-4 w-4" />
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 2. VISTA DE CUADRÍCULA (Cards Grid) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredEvents.map(event => {
            const isPrivate = Boolean(event.is_private);

            return (
              <Card key={event.id || event.event_id || event.eventId || `event-${event.title}`} className="bg-black/40 border-purple-500/30 overflow-hidden hover:border-purple-500/50 transition-colors">
                {/* Event Image - Full Width */}
                {event.cover_image && (
                  <div className="w-full h-48 sm:h-56 md:h-52 lg:h-64 xl:h-72 relative overflow-hidden">
                    <img 
                      src={event.cover_image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80';
                      }}
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
                      {/* Tipo de Visibilidad Badge en Card */}
                      {!isPrivate ? (
                        <span className="px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                          Público
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                          🔒 Privado
                        </span>
                      )}
                      {event.isRecurring && (
                        <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 text-xs sm:text-sm px-2 py-0.5">
                          🔄 Recurrente
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <CardHeader className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                        <CardTitle className="text-white text-base sm:text-lg md:text-xl line-clamp-2">{event.title}</CardTitle>
                        {/* Enlace Boletería si existe */}
                        {event.ticket_url && (
                          <a
                            href={event.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                            title="Probar boletería en pestaña nueva"
                          >
                            <Ticket className="w-3 h-3" /> Boletos <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
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
                      {/* Redes sociales del evento en tarjeta */}
                      {(() => {
                        const ig = event.instagram_url || event.social_links?.instagram;
                        const fb = event.facebook_url || event.social_links?.facebook;
                        const tw = event.twitter_url || event.social_links?.twitter;
                        const tt = event.tiktok_url || event.social_links?.tiktok;
                        const ws = event.website_url || event.social_links?.website || event.website;
                        if (!ig && !fb && !tw && !tt && !ws) return null;
                        return (
                          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-purple-500/10">
                            <span className="text-[10px] text-purple-400">Enlaces:</span>
                            {ig && (
                              <a href={ig} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors" title={`Instagram: ${ig}`}>
                                <Instagram className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {fb && (
                              <a href={fb} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title={`Facebook: ${fb}`}>
                                <Facebook className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {tw && (
                              <a href={tw} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors" title={`Twitter/X: ${tw}`}>
                                <Twitter className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {tt && (
                              <a href={tt} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-[10px] font-bold font-mono" title={`TikTok: ${tt}`}>
                                TT
                              </a>
                            )}
                            {ws && (
                              <a href={ws} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title={`Sitio Web: ${ws}`}>
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })()}
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
                    {/* Botón Gestión de Invitados */}
                    <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                      <button
                        onClick={() => handleOpenGuestModal(event)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white transition-all shadow-sm"
                        title="Gestionar lista de invitados autorizados"
                      >
                        👥 {event.allowed_user_ids?.length || 0} Invitados
                      </button>
                      
                      <button
                        onClick={() => handleOpenAuditModal(event)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        title="Auditoría GPS de Asistencias"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Auditoría GPS
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-purple-200">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-amber-400" />
                        <span className="font-bold text-amber-300">{event.attendees_count || 0} asistentes reales</span>
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
                        onClick={() => handleOpenAuditModal(event)}
                        className="text-emerald-400 hover:bg-emerald-950/40 h-8 w-8 p-0"
                        title="Auditoría de Asistencias"
                      >
                        <ShieldCheck className="h-4 w-4" />
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
            );
          })}

          {filteredEvents.length === 0 && (
            <Card className="bg-black/40 border-purple-500/30 col-span-full">
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
      )}

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

            {/* Visibilidad y Boletos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-500/20">
              <div className="space-y-2">
                <Label htmlFor="edit_ticket_url" className="text-purple-200 text-xs">
                  URL de Boletería / Entradas
                </Label>
                <Input
                  id="edit_ticket_url"
                  name="ticket_url"
                  value={formData.ticket_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://tuboleta.com/evento/..."
                  className="bg-black/50 border-purple-500/30 text-white text-xs"
                />
              </div>
              <div className="flex flex-col justify-end space-y-1">
                <div className="flex items-center justify-between p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl">
                  <div>
                    <Label htmlFor="edit_is_private" className="text-purple-200 text-xs font-semibold cursor-pointer block">
                      🔒 Evento Privado
                    </Label>
                    <span className="text-[10px] text-purple-400">
                      Solo invitados autorizados
                    </span>
                  </div>
                  <Switch
                    id="edit_is_private"
                    checked={Boolean(formData.is_private)}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Panel de Selección de Invitados para Evento Privado (Editar) */}
            {Boolean(formData.is_private) && (
              <div className="p-3.5 bg-gradient-to-b from-purple-950/60 to-black/80 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <Label className="text-purple-200 text-xs font-semibold block leading-tight">
                        Invitados Autorizados (Acceso Exclusivo)
                      </Label>
                      <span className="text-[10px] text-purple-400">
                        Solo estos usuarios podrán ver y asistir al evento
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-purple-900/60 text-purple-200 border-purple-500/30 text-[10px]">
                    {formData.allowed_users?.length || 0} agregados
                  </Badge>
                </div>

                {/* Buscador interactivo de usuarios */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-purple-400" />
                    <Input
                      id="edit_guest_search"
                      type="text"
                      value={guestSearchQuery}
                      onChange={(e) => handleSearchGuests(e.target.value)}
                      placeholder="Buscar usuario por nombre, @username o correo..."
                      className="pl-8 pr-8 py-1 h-8 text-xs bg-black/60 border-purple-500/40 text-white placeholder:text-zinc-500 focus:border-purple-400"
                    />
                    {isSearchingGuests && (
                      <Loader2 className="w-3.5 h-3.5 absolute right-2.5 text-purple-400 animate-spin" />
                    )}
                    {!isSearchingGuests && guestSearchQuery && (
                      <button
                        type="button"
                        onClick={() => { setGuestSearchQuery(''); setGuestSearchResults([]); }}
                        className="absolute right-2.5 text-purple-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante con resultados de búsqueda */}
                  {guestSearchResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-purple-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-purple-500/20 custom-scrollbar">
                      {guestSearchResults.map((user) => {
                        const uid = user.id || user.user_id;
                        const displayName = user.display_name || user.name || user.username || 'Usuario';
                        const username = user.username ? `@${user.username}` : user.email || '';
                        const avatar = user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&size=32`;

                        return (
                          <div
                            key={uid}
                            className="flex items-center justify-between p-2 hover:bg-purple-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-6 h-6 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&size=32`;
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate leading-tight">{displayName}</p>
                                <p className="text-[10px] text-purple-300 truncate">{username}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddGuest(user)}
                              className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-md flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              Agregar
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Lista de usuarios seleccionados */}
                <div className="space-y-1.5">
                  {(!formData.allowed_users || formData.allowed_users.length === 0) ? (
                    <div className="text-center py-2.5 px-3 bg-black/30 border border-dashed border-purple-500/20 rounded-lg">
                      <p className="text-[11px] text-purple-300">
                        No has agregado invitados aún.
                      </p>
                      <p className="text-[10px] text-purple-400">
                        Escribe en el buscador arriba para añadir usuarios autorizados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {formData.allowed_users.map((guest) => {
                        const gid = guest.id || guest.user_id;
                        const gName = guest.display_name || guest.name || guest.username || `Usuario #${gid}`;
                        const gUsername = guest.username ? `@${guest.username}` : (guest.email || '');
                        const gAvatar = guest.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=7c3aed&color=fff&size=32`;

                        return (
                          <div
                            key={gid}
                            className="flex items-center justify-between px-2.5 py-1.5 bg-black/40 border border-purple-500/20 rounded-lg group hover:border-purple-500/40 transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={gAvatar}
                                alt={gName}
                                className="w-5 h-5 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=7c3aed&color=fff&size=32`;
                                }}
                              />
                              <span className="text-xs text-white font-medium truncate">{gName}</span>
                              {gUsername && (
                                <span className="text-[10px] text-purple-400 truncate">({gUsername})</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGuest(gid)}
                              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Quitar invitado"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Redes Sociales y Enlaces Web */}
            <div className="space-y-3 pt-3 border-t border-purple-500/20">
              <div className="flex items-center justify-between">
                <Label className="text-purple-200 text-xs font-semibold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  Redes Sociales y Enlaces del Evento
                </Label>
                <span className="text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instagram */}
                <div className="space-y-1">
                  <Label htmlFor="edit_instagram_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-400" />
                    Instagram
                  </Label>
                  <Input
                    id="edit_instagram_url"
                    name="instagram_url"
                    value={formData.instagram_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/cuenta"
                    className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <Label htmlFor="edit_facebook_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                    <Facebook className="w-3 h-3 text-blue-400" />
                    Facebook
                  </Label>
                  <Input
                    id="edit_facebook_url"
                    name="facebook_url"
                    value={formData.facebook_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/evento"
                    className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                  />
                </div>

                {/* Twitter / X */}
                <div className="space-y-1">
                  <Label htmlFor="edit_twitter_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                    <Twitter className="w-3 h-3 text-sky-400" />
                    Twitter / X
                  </Label>
                  <Input
                    id="edit_twitter_url"
                    name="twitter_url"
                    value={formData.twitter_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://x.com/usuario"
                    className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-1">
                  <Label htmlFor="edit_tiktok_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                    <span className="font-black text-[10px] text-cyan-400 font-mono">TT</span>
                    TikTok
                  </Label>
                  <Input
                    id="edit_tiktok_url"
                    name="tiktok_url"
                    value={formData.tiktok_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://tiktok.com/@cuenta"
                    className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                  />
                </div>

                {/* Sitio Web Oficial */}
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="edit_website_url" className="text-purple-300 text-[11px] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    Sitio Web Oficial / Landing Page
                  </Label>
                  <Input
                    id="edit_website_url"
                    name="website_url"
                    value={formData.website_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://mievento.com"
                    className="bg-black/50 border-purple-500/30 text-white text-xs h-8"
                  />
                </div>
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

      {/* Modal 2: Gestión de Invitados a Eventos Privados */}
      <EventGuestManagerModal
        eventId={guestModalEvent?.id || guestModalEvent?.event_id || guestModalEvent?.eventId}
        eventTitle={guestModalEvent?.title}
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onGuestsUpdated={handleGuestsUpdated}
      />

      {/* Modal 4: Auditoría de Asistencias Presenciales (GPS) */}
      <AttendanceAuditModal
        event={auditModalEvent}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};

export default EventsManager;