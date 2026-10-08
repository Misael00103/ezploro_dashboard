import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Tag,
  Gift,
  Search,
  CheckCircle2,
  Loader2,
  Clock,
  Coins,
  History,
  Upload,
  Image as ImageIcon,
  Building,
  ShieldCheck,
  QrCode,
  RefreshCw,
  MapPin,
  X
} from 'lucide-react';

import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getOfferRedemptions
} from '../services/offerService';
import {
  searchPlaces as searchPlacesAPI,
  getPlaceDetails,
  reverseGeocode
} from '../services/placesService';
import { toast } from 'react-hot-toast';

const DEFAULT_CATEGORIES = ['Bebidas', 'Entradas', 'Comida', 'Experiencias', 'VIP'];

const PromotionsManager = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [offers, setOffers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [redemptionSearch, setRedemptionSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedRedemptionModal, setSelectedRedemptionModal] = useState(null);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Bebidas',
    points_required: 300,
    offer_type: 'percentage',
    discount_percentage: '',
    discount_amount: '',
    original_price: '',
    final_price: '',
    start_date: '',
    end_date: '',
    max_uses: '',
    promo_code: '',
    terms_conditions: '',
    description: '',
    image_url: '',
    merchant_name: '',
    merchant_code: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: 'República Dominicana',
    latitude: '',
    longitude: '',
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);


  const loadData = async () => {
    try {
      setIsLoading(true);
      const [offersList, redemptionsList] = await Promise.all([
        getOffers(),
        getOfferRedemptions()
      ]);
      
      // Filtrar cualquier duplicado existente por título o ID
      const uniqueOffers = [];
      (offersList || []).forEach(item => {
        const itemTitle = (item.title || item.name || '').trim().toLowerCase();
        const itemId = item.offer_id || item.id;
        const exists = uniqueOffers.some(u => 
          ((u.offer_id || u.id) && itemId && (u.offer_id || u.id) === itemId) || 
          (itemTitle && (u.title || u.name || '').trim().toLowerCase() === itemTitle)
        );
        if (!exists) {
          uniqueOffers.push(item);
        }
      });

      setOffers(uniqueOffers);
      setRedemptions(redemptionsList || []);
    } catch (error) {
      console.error('Error al cargar ofertas en PromotionsManager:', error);
      toast.error('No se pudieron cargar las promociones del backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe pesar menos de 5MB');
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result
        }));
        toast.success('🖼️ Imagen local seleccionada');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) {
      toast.error('Ingresa un nombre de categoría');
      return;
    }
    if (categories.includes(newCategoryInput.trim())) {
      toast.error('Esa categoría ya existe');
      return;
    }
    setCategories((prev) => [...prev, newCategoryInput.trim()]);
    setNewCategoryInput('');
    toast.success('✨ Categoría agregada correctamente');
  };

  const handleDeleteCategory = (catToDelete) => {
    setCategories((prev) => prev.filter((c) => c !== catToDelete));
    toast.success('Categoría eliminada');
  };

  const handleCreateOpen = () => {
    setSelectedImageFile(null);
    setSelectedCoordinates(null);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setFormData({
      title: 'Happy Hour 2x1 en Mojitos & Tragos',
      category: 'Bebidas',
      points_required: 300,
      offer_type: 'percentage',
      discount_percentage: '50',
      discount_amount: '',
      original_price: '20',
      final_price: '10',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      max_uses: '100',
      promo_code: `MOJITO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      terms_conditions: 'Válido de jueves a sábado hasta la medianoche.',
      description: 'Válido en Bares y Discotecas Afiliadas de la Ciudad.',
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
      merchant_name: 'Bar La Pasión',
      merchant_code: 'PASION123',
      location: '',
      address: '',
      city: '',
      state: '',
      country: 'República Dominicana',
      latitude: '',
      longitude: '',
      is_active: true
    });
    setActiveTab('create');
  };

  const handleEditOpen = (offer) => {
    setSelectedOffer(offer);
    setSelectedImageFile(null);
    setLocationSuggestions([]);
    setShowSuggestions(false);

    let lat = offer.latitude || offer.lat || '';
    let lng = offer.longitude || offer.lng || '';
    if (!lat && offer.location && typeof offer.location === 'object' && Array.isArray(offer.location.coordinates)) {
      lng = offer.location.coordinates[0];
      lat = offer.location.coordinates[1];
    }
    if (lat && lng) {
      setSelectedCoordinates({ lat: Number(lat), lng: Number(lng) });
    } else {
      setSelectedCoordinates(null);
    }

    // Resolver la dirección más precisa disponible
    const rawAddress = (offer.address || '').trim();
    let rawLocation = '';
    if (typeof offer.location === 'string') {
      rawLocation = offer.location.trim();
    } else if (offer.location && typeof offer.location === 'object') {
      rawLocation = (offer.location.formatted_address || offer.location.address || offer.location.name || '').trim();
    }

    const offerCountry = (offer.country || '').trim();
    const offerCity = (offer.city || '').trim();

    // Determinar la ubicación principal evitando cadenas desactualizadas
    let bestLocation = '';
    if (rawAddress && offerCountry && !offerCountry.toLowerCase().includes('dominicana') && rawLocation.toLowerCase().includes('dominicana')) {
      bestLocation = rawAddress;
    } else if (rawAddress && (!rawLocation || rawLocation.length < rawAddress.length || !rawLocation.includes(','))) {
      bestLocation = rawAddress;
    } else if (rawLocation) {
      bestLocation = rawLocation;
    } else if (rawAddress) {
      bestLocation = rawAddress;
    } else if (offerCity) {
      bestLocation = [offerCity, offer.state, offerCountry].filter(Boolean).join(', ');
    }

    const finalAddress = rawAddress || bestLocation;
    const finalLocation = bestLocation || finalAddress;

    setFormData({
      title: offer.title || offer.name || '',
      category: offer.category || 'Bebidas',
      points_required: offer.points_required || offer.cost || 300,
      offer_type: offer.offer_type || 'percentage',
      discount_percentage: offer.discount_percentage || '',
      discount_amount: offer.discount_amount || '',
      original_price: offer.original_price || '',
      final_price: offer.final_price || '',
      start_date: offer.start_date ? new Date(offer.start_date).toISOString().slice(0, 16) : '',
      end_date: offer.end_date ? new Date(offer.end_date).toISOString().slice(0, 16) : '',
      max_uses: offer.max_uses || '',
      promo_code: offer.promo_code || '',
      terms_conditions: offer.terms_conditions || '',
      description: offer.description || '',
      image_url: offer.image_url || offer.image || '',
      merchant_name: offer.merchant_name || offer.merchantName || '',
      merchant_code: offer.merchant_code || offer.merchantCode || offer.merchant_pin || '',
      location: finalLocation,
      address: finalAddress,
      city: offerCity,
      state: offer.state || '',
      country: offerCountry || (finalAddress.toLowerCase().includes('canad') ? 'Canadá' : 'República Dominicana'),
      latitude: lat ? String(lat) : '',
      longitude: lng ? String(lng) : '',
      is_active: offer.is_active !== undefined ? offer.is_active : true
    });
    setIsEditModalOpen(true);
  };

  const searchTimeoutRef = useRef(null);

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      location: value,
      // Si address estaba vacío o sincronizado con la ubicación previa, mantenerlo sincronizado
      address: (!prev.address || prev.address === prev.location) ? value : prev.address
    }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value || value.trim().length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const predictions = await searchPlacesAPI(value);
        setLocationSuggestions(predictions || []);
        setShowSuggestions((predictions || []).length > 0);
      } catch (err) {
        console.warn('Error buscando sugerencias en Google Places:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);
  };

  const handleLocationSelect = async (place) => {
    setShowSuggestions(false);
    const selectedDescription = place.description || place.formatted_address || '';
    setFormData((prev) => ({
      ...prev,
      location: selectedDescription,
      address: selectedDescription
    }));

    try {
      const result = await getPlaceDetails(place.place_id);
      let lat = '';
      let lng = '';

      if (result.geometry && result.geometry.location) {
        if (typeof result.geometry.location.lat === 'function') {
          lat = result.geometry.location.lat();
          lng = result.geometry.location.lng();
        } else {
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
        }
      }

      let address = '';
      let city = '';
      let state = '';
      let country = '';

      if (result.address_components) {
        result.address_components.forEach((component) => {
          if (component.types.includes('street_number') || component.types.includes('route')) {
            address += component.long_name + ' ';
          }
          if (
            component.types.includes('locality') ||
            component.types.includes('sublocality') ||
            component.types.includes('postal_town')
          ) {
            if (!city) city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });
      }

      const fullFormatted = result.formatted_address || selectedDescription;
      const finalAddress = address.trim() || fullFormatted;

      if (lat && lng) {
        setSelectedCoordinates({ lat: Number(lat), lng: Number(lng) });
      }

      setFormData((prev) => ({
        ...prev,
        location: fullFormatted,
        address: finalAddress,
        city: city || state || '',
        state: state || '',
        country: country || (fullFormatted.toLowerCase().includes('canad') ? 'Canadá' : (fullFormatted.toLowerCase().includes('dominicana') ? 'República Dominicana' : '')),
        latitude: lat ? String(lat) : '',
        longitude: lng ? String(lng) : ''
      }));

      toast.success('📍 Ubicación y coordenadas integradas desde Google Maps');
    } catch (err) {
      console.error('Error obteniendo detalles del lugar en Google Places:', err);
      setFormData((prev) => ({ ...prev, location: selectedDescription, address: selectedDescription }));
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no es soportada por este navegador');
      return;
    }

    toast.loading('Obteniendo ubicación GPS...', { id: 'gps-loc' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedCoordinates({ lat: latitude, lng: longitude });

        try {
          const rev = await reverseGeocode(latitude, longitude);
          if (rev && rev.formatted_address) {
            let address = '';
            let city = '';
            let state = '';
            let country = '';

            if (Array.isArray(rev.address_components)) {
              rev.address_components.forEach((component) => {
                if (component.types.includes('street_number') || component.types.includes('route')) {
                  address += component.long_name + ' ';
                }
                if (
                  component.types.includes('locality') ||
                  component.types.includes('sublocality') ||
                  component.types.includes('postal_town') ||
                  component.types.includes('administrative_area_level_2')
                ) {
                  if (!city) city = component.long_name;
                }
                if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                }
                if (component.types.includes('country')) {
                  country = component.long_name;
                }
              });
            }

            const fullFormatted = rev.formatted_address;
            const finalAddress = address.trim() || fullFormatted;

            setFormData((prev) => ({
              ...prev,
              location: fullFormatted,
              address: finalAddress,
              city: city || state || '',
              state: state || '',
              country: country || (fullFormatted.toLowerCase().includes('canad') ? 'Canadá' : (fullFormatted.toLowerCase().includes('dominicana') ? 'República Dominicana' : '')),
              latitude: String(latitude),
              longitude: String(longitude)
            }));
            toast.success('📍 Ubicación GPS actual detectada', { id: 'gps-loc' });
            return;
          }
        } catch (e) {
          console.warn('Error en reverse geocoding:', e);
        }

        setFormData((prev) => ({
          ...prev,
          location: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
          address: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
          latitude: String(latitude),
          longitude: String(longitude)
        }));
        toast.success('📍 Coordenadas actuales agregadas', { id: 'gps-loc' });
      },
      (error) => {
        console.warn('Error al obtener geolocalización:', error);
        toast.error('No se pudo acceder a tu ubicación GPS', { id: 'gps-loc' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };


  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      if (!formData.title) {
        toast.error('El título de la promoción es requerido');
        return;
      }
      setIsSubmitting(true);

      // Reconciliar location y address antes de enviar
      const submissionLocation = formData.location || formData.address || '';
      const submissionAddress = formData.address || formData.location || '';
      const submissionData = {
        ...formData,
        location: submissionLocation,
        address: submissionAddress
      };

      await createOffer(submissionData, selectedImageFile);
      toast.success('🎟️ Promoción creada con éxito');
      setActiveTab('catalog');
      await loadData();
    } catch (error) {
      console.error('Error al crear promoción:', error);
      toast.error(error.message || 'No se pudo guardar la promoción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      const id = selectedOffer.offer_id || selectedOffer.id || selectedOffer._id;

      // Reconciliar location y address asegurando que no se mande una cadena desactualizada
      const resolvedAddress = (formData.address || '').trim();
      let resolvedLoc = (formData.location || '').trim();
      const countryStr = (formData.country || '').trim();

      if (resolvedAddress && countryStr && !countryStr.toLowerCase().includes('dominicana') && resolvedLoc.toLowerCase().includes('dominicana')) {
        resolvedLoc = resolvedAddress;
      } else if (!resolvedLoc && resolvedAddress) {
        resolvedLoc = resolvedAddress;
      } else if (!resolvedAddress && resolvedLoc) {
        // usar resolvedLoc
      }

      const submissionData = {
        ...formData,
        location: resolvedLoc || resolvedAddress,
        address: resolvedAddress || resolvedLoc
      };

      const updated = await updateOffer(id, submissionData, selectedImageFile);
      toast.success('✨ Promoción actualizada correctamente');
      setIsEditModalOpen(false);
      setOffers((prevOffers) =>
        prevOffers.map((o) =>
          String(o.offer_id || o.id || o._id) === String(id)
            ? { ...o, ...submissionData, ...updated }
            : o
        )
      );
      await loadData();
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      toast.error(error.message || 'Error al actualizar la promoción');
    }
  };

  const handleToggleStatus = async (offer) => {
    const id = offer.offer_id || offer.id || offer._id;
    if (!id) return;
    const newActiveState = !offer.is_active;

    // Actualización optimista de interfaz
    setOffers((prevOffers) =>
      prevOffers.map((o) =>
        String(o.offer_id || o.id || o._id) === String(id)
          ? { ...o, is_active: newActiveState, status: newActiveState ? 'Activa' : 'Inactiva' }
          : o
      )
    );

    try {
      await toggleOfferStatus(offer, newActiveState);
      toast.success(newActiveState ? '✨ Promoción activada' : '🚫 Promoción desactivada');
      await loadData();
    } catch (error) {
      console.error('Error alternando estado:', error);
      toast.error('No se pudo cambiar el estado de la promoción');
      await loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta promoción?')) {
      try {
        await deleteOffer(id);
        toast.success('Promoción eliminada');
        loadData();
      } catch (error) {
        console.error('Error al eliminar promoción:', error);
        toast.error('No se pudo eliminar la promoción');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOffers = offers.filter((o) => {
    const matchesSearch = o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-blue-950/40 via-zinc-900 to-indigo-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Ticket className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Catálogo de Promociones</h1>
          </div>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Gestiona el catálogo de ofertas canjeables por Ezploro Coins (Mojitos 2x1, Entradas VIP, Descuentos). Todo lo editado se refleja de inmediato en la app React Native.
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Promoción
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-zinc-800/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar promoción por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-white w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Todas las Categorías" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-panel border-zinc-800/50 bg-zinc-950/80 p-1">
          <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-zinc-400">
            <Ticket className="h-4 w-4 mr-2" />
            Catálogo ({filteredOffers.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-zinc-400">
            <Plus className="h-4 w-4 mr-2" />
            Crear Promoción
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-zinc-400">
            <Tag className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-zinc-400">
            <History className="h-4 w-4 mr-2" />
            Canjes Realizados
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Catalog Grid */}
        <TabsContent value="catalog">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <Card className="glass-panel border-zinc-800/50 text-center p-12">
              <p className="text-zinc-500">No se encontraron promociones en el catálogo.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const id = offer.offer_id || offer.id || offer._id;
                return (
                  <Card key={id} className="glass-panel border-zinc-800/80 bg-zinc-900/50 hover:border-blue-500/40 transition-all flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Image header */}
                      <div className="h-44 w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                        {offer.image_url ? (
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-zinc-700" />
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <Badge className={offer.is_active ? 'bg-emerald-500/90 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'}>
                            {offer.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 text-blue-300 border border-blue-500/30 backdrop-blur-md uppercase tracking-wider">
                            {offer.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-white line-clamp-1">{offer.title || offer.name}</h3>
                        </div>

                        <p className="text-zinc-400 text-xs line-clamp-2">{offer.description}</p>

                        {(offer.address || offer.location || offer.city) && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-950/30 px-2.5 py-1.5 rounded-lg border border-blue-800/30">
                            <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">
                              {offer.address ||
                               (typeof offer.location === 'string' ? offer.location : '') ||
                               (offer.location?.formatted_address || offer.location?.address) ||
                               (offer.city ? `${offer.city}${offer.country ? ', ' + offer.country : ''}` : 'Ubicación registrada')}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {offer.discount_percentage && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                              {offer.discount_percentage}% OFF
                            </Badge>
                          )}
                          {offer.discount_amount && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                              ${offer.discount_amount} OFF
                            </Badge>
                          )}
                          {offer.promo_code && (
                            <Badge className="bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                              {offer.promo_code}
                            </Badge>
                          )}
                          {offer.final_price && (
                            <span className="text-xs text-emerald-400 font-bold ml-auto">
                              ${offer.final_price} {offer.original_price && <span className="line-through text-zinc-500 text-[10px] font-normal">${offer.original_price}</span>}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-950/70 rounded-lg text-xs border border-zinc-800/60 mt-2">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Coins className="h-4 w-4 text-amber-400" />
                            <span>Costo de canje:</span>
                          </div>
                          <strong className="text-amber-400 text-sm">{offer.points_required || offer.cost || 300} Coins</strong>
                        </div>
                      </CardContent>
                    </div>

                    <div className="flex items-center justify-between p-4 border-t border-zinc-800/60 bg-zinc-950/40 text-xs">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!offer.is_active}
                          onCheckedChange={() => handleToggleStatus(offer)}
                        />
                        <span className="text-zinc-400">{offer.is_active ? 'Visible' : 'Oculto'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditOpen(offer)}
                          className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(id)}
                          className="h-8 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Create Form */}
        <TabsContent value="create">
          <Card className="glass-panel border-zinc-800/50 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Crear Nueva Promoción / Recompensa</CardTitle>
              <CardDescription className="text-zinc-400">
                Añade ofertas completas para restaurantes, bares, discotecas y entradas VIP de eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* 1. Título & Categoría & Tipo */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 font-semibold">Título de la Promoción *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Happy Hour 2x1 en Mojitos & Tragos"
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Categoría</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo de Oferta</Label>
                    <Select value={formData.offer_type} onValueChange={(val) => setFormData({ ...formData, offer_type: val })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="percentage">Porcentaje (% Descuento)</SelectItem>
                        <SelectItem value="amount">Monto Fijo ($ OFF)</SelectItem>
                        <SelectItem value="2x1">Promoción 2x1</SelectItem>
                        <SelectItem value="freebie">Entrada / Regalo Gratis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Costo (Ezploro Coins) *</Label>
                    <Input
                      type="number"
                      value={formData.points_required}
                      onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                      placeholder="300"
                      className="bg-zinc-900 border-zinc-800 text-white font-bold text-amber-400"
                    />
                  </div>
                </div>

                {/* 2. Precios y Descuentos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">% Descuento</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      placeholder="20"
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">$ Monto Descuento</Label>
                    <Input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      placeholder="10"
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Precio Original ($)</Label>
                    <Input
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      placeholder="50"
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Precio Final ($)</Label>
                    <Input
                      type="number"
                      value={formData.final_price}
                      onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
                      placeholder="40"
                      className="bg-zinc-900 border-zinc-800 text-white text-xs font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* 3. Fechas y Límites */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Fecha de Inicio</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Fecha de Vencimiento</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs">Stock / Límite de Usos</Label>
                    <Input
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="Sin límite"
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                </div>

                {/* 4. Cupón y Términos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Código Promocional / Cupón</Label>
                    <Input
                      value={formData.promo_code}
                      onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                      placeholder="Ej: MOJITO2X1"
                      className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Términos y Condiciones</Label>
                    <Input
                      value={formData.terms_conditions}
                      onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                      placeholder="Ej: Válido de jueves a sábado..."
                      className="bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                </div>

                {/* 4b. Datos del Negocio y Código PIN de Validación */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-400" />
                    <Label className="text-purple-300 font-bold text-xs uppercase tracking-wider">Negocio y PIN de Validación (Escáner QR)</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs">Nombre del Negocio / Establecimiento</Label>
                      <Input
                        value={formData.merchant_name}
                        onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                        placeholder="Ej: Bar La Pasión / Disco Club"
                        className="bg-zinc-900 border-zinc-800 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs">Código / PIN Personalizado del Negocio</Label>
                      <Input
                        value={formData.merchant_code}
                        onChange={(e) => setFormData({ ...formData, merchant_code: e.target.value.toUpperCase() })}
                        placeholder="Ej: PASION123 o 7788"
                        className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono font-bold uppercase text-emerald-400"
                      />
                      <p className="text-[10px] text-zinc-400">Este PIN lo ingresa el encargado del local para desbloquear el escáner y validar el premio.</p>
                    </div>
                  </div>
                </div>

                {/* 4c. Ubicación del Establecimiento (Integración Google Maps) */}
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <Label className="text-blue-300 font-bold text-xs uppercase tracking-wider">
                        Ubicación del Establecimiento (Google Maps)
                      </Label>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGetCurrentLocation}
                      className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-950/50 h-7 px-2.5"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Usar mi ubicación
                    </Button>
                  </div>

                  <div className="space-y-1.5 relative">
                    <Label className="text-zinc-300 text-xs">
                      Buscar Dirección o Local en Google Maps
                    </Label>
                    <div className="relative">
                      <Input
                        value={formData.location}
                        onChange={handleLocationInputChange}
                        onFocus={() => {
                          if (formData.location && formData.location.length >= 3 && locationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        placeholder="Escribe el nombre del negocio o dirección (ej: Hard Rock Cafe, Av. Churchill...)"
                        className="bg-zinc-900 border-zinc-800 text-white text-xs pl-8 focus:border-blue-500"
                        autoComplete="off"
                      />
                      <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      {isSearchingLocation && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-blue-400 animate-spin" />
                      )}
                    </div>

                    {/* Dropdown de Sugerencias de Google Places */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-zinc-950 border border-blue-500/40 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {locationSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="px-3.5 py-2.5 hover:bg-blue-900/30 cursor-pointer text-white text-xs border-b border-zinc-800/60 last:border-b-0 flex items-center justify-between gap-2"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">{suggestion.description}</span>
                            </div>
                          </div>
                        ))}
                        <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowSuggestions(false)}
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cerrar lista
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coordenadas e Información Geográfica */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-zinc-400 text-[11px]">Dirección Detallada</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            address: val,
                            location: (!prev.location || prev.location === prev.address) ? val : prev.location
                          }));
                        }}
                        placeholder="Calle, número..."
                        className="bg-zinc-900 border-zinc-800 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-400 text-[11px]">Ciudad / Municipio</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Santo Domingo"
                        className="bg-zinc-900 border-zinc-800 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-400 text-[11px]">País</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="República Dominicana"
                        className="bg-zinc-900 border-zinc-800 text-white text-xs"
                      />
                    </div>
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Coordenadas GPS: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* 5. Imagen */}

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center justify-between">
                    <span>Imagen de la Promoción</span>
                    <span className="text-xs text-blue-400 font-normal">Selección Local / Archivo</span>
                  </Label>

                  {formData.image_url ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg">
                          <Upload className="h-4 w-4" />
                          Cambiar Imagen Local
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLocalImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <Upload className="h-8 w-8 text-blue-400 mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-white mb-1">Haz clic para seleccionar imagen local</p>
                        <p className="text-[11px] text-zinc-500">Formato JPG, PNG o WEBP de tu equipo (Máx 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="O pega una URL directa de imagen (opcional)"
                    className="bg-zinc-900 border-zinc-800 text-white text-xs mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Válido en Bares y Discotecas Afiliadas de la Ciudad"
                    rows={3}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('catalog')} className="border-zinc-700 text-zinc-300">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Guardar Promoción
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Categories */}
        <TabsContent value="categories">
          <Card className="glass-panel border-zinc-800/50 max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-400" />
                Categorías de Promociones
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Clasifica las ofertas (Bebidas, Entradas, Comida, Experiencias, VIP).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-2">
                <Input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Ej: Coctelería, Reservas, VIP..."
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
                <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-bold text-white">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Categoría Activa</Badge>
                      {categories.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(cat)}
                          className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Redemptions & Confirmations */}
        <TabsContent value="redemptions">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader className="border-b border-zinc-800/60 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    Confirmaciones de Canje (Escáner QR & Portal Comercio)
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Registro en tiempo real de cupones escaneados, validados y entregados en locales comerciales.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      value={redemptionSearch}
                      onChange={(e) => setRedemptionSearch(e.target.value)}
                      placeholder="Buscar por RDM, usuario o negocio..."
                      className="pl-9 bg-zinc-900 border-zinc-800 text-white text-xs"
                    />
                  </div>
                  <Button
                    onClick={() => loadData()}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (() => {
                const filteredRedemptions = redemptions.filter(item => {
                  if (!redemptionSearch.trim()) return true;
                  const term = redemptionSearch.toLowerCase();
                  const code = (item.redemptionCode || item.code || '').toLowerCase();
                  const userName = (item.user?.name || item.user_name || '').toLowerCase();
                  const merchantName = (item.offer?.merchantName || item.merchant_name || '').toLowerCase();
                  const title = (item.offer?.title || item.title || '').toLowerCase();
                  return code.includes(term) || userName.includes(term) || merchantName.includes(term) || title.includes(term);
                });

                if (filteredRedemptions.length === 0) {
                  return (
                    <div className="text-center p-12 text-zinc-500">
                      No hay confirmaciones de canje registradas {redemptionSearch ? 'con ese filtro.' : 'aún.'}
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredRedemptions.map((item, idx) => {
                      const isUsed = item.status === 'used' || item.status === 'completed';
                      return (
                        <div
                          key={item.redemptionId || item.id || idx}
                          onClick={() => setSelectedRedemptionModal(item)}
                          className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`p-3 rounded-xl ${isUsed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {isUsed ? <CheckCircle2 className="h-6 w-6" /> : <QrCode className="h-6 w-6" />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                                  {item.redemptionCode || item.code || 'RDM-CONFIRM'}
                                </span>
                                <Badge className={isUsed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}>
                                  {isUsed ? '🟢 VALIDADO Y USADO' : '🟡 PENDIENTE'}
                                </Badge>
                              </div>
                              <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                                {item.offer?.title || item.title || 'Promoción Especial'}
                              </h4>
                              <p className="text-xs text-zinc-400">
                                👤 Usuario: <strong className="text-white">{item.user?.name || item.user_name || 'Cliente Ezploro'}</strong> ({item.user?.email || 'email@ezploro.com'}) • 🏬 Negocio: <strong className="text-purple-300">{item.offer?.merchantName || item.merchant_name || 'Local Afiliado'}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end justify-center">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                              <Coins className="h-3.5 w-3.5" /> {item.pointsSpent || item.points_required || 300} Coins
                            </span>
                            <span className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              {item.usedAt ? new Date(item.usedAt).toLocaleString() : (item.redeemedAt ? new Date(item.redeemedAt).toLocaleString() : 'Reciente')}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 mt-1.5 line-clamp-1 max-w-[200px]">
                                📝 {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Digital Proof Dialog */}
      <Dialog open={!!selectedRedemptionModal} onOpenChange={() => setSelectedRedemptionModal(null)}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-6 w-6" /> Comprobante Digital de Confirmación
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Detalles de la verificación y entrega autorizada en el comercio.
            </DialogDescription>
          </DialogHeader>

          {selectedRedemptionModal && (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Código de Canje (QR):</span>
                  <span className="text-amber-400 font-bold">{selectedRedemptionModal.redemptionCode || selectedRedemptionModal.code}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Estado de Validación:</span>
                  <span className="text-emerald-400 font-bold">🟢 VALIDADO Y USADO</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Usuario Cliente:</span>
                  <span className="text-white font-bold">{selectedRedemptionModal.user?.name || selectedRedemptionModal.user_name || 'Cliente Ezploro'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Email:</span>
                  <span className="text-zinc-300">{selectedRedemptionModal.user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Establecimiento / Comercio:</span>
                  <span className="text-purple-300 font-bold">{selectedRedemptionModal.offer?.merchantName || selectedRedemptionModal.merchant_name || 'Local Afiliado'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">PIN Autorización Comercio:</span>
                  <span className="text-emerald-400 font-bold">{selectedRedemptionModal.offer?.merchantCode || 'PIN VALIDADO'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Ezploro Coins Descontados:</span>
                  <span className="text-amber-400 font-bold">{selectedRedemptionModal.pointsSpent || 300} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Fecha y Hora de Entrega:</span>
                  <span className="text-zinc-300">{selectedRedemptionModal.usedAt ? new Date(selectedRedemptionModal.usedAt).toLocaleString() : 'Reciente'}</span>
                </div>
              </div>

              {selectedRedemptionModal.notes && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300">
                  <span className="font-bold block mb-1">Notas del Cajero / Encargado:</span>
                  <p className="text-zinc-300 italic">&quot;{selectedRedemptionModal.notes}&quot;</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setSelectedRedemptionModal(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Cerrar Comprobante
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Promoción / Recompensa</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifica los detalles de precios, fechas, tipo de oferta o imagen de la promoción.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-zinc-300 font-semibold">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Categoría</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Tipo de Oferta</Label>
                <Select value={formData.offer_type} onValueChange={(val) => setFormData({ ...formData, offer_type: val })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="percentage">Porcentaje (% Descuento)</SelectItem>
                    <SelectItem value="amount">Monto Fijo ($ OFF)</SelectItem>
                    <SelectItem value="2x1">Promoción 2x1</SelectItem>
                    <SelectItem value="freebie">Entrada / Regalo Gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Costo (Ezploro Coins) *</Label>
                <Input
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white font-bold text-amber-400"
                />
              </div>
            </div>

            {/* Precios y Descuentos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">% Descuento</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">$ Descuento</Label>
                <Input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">Precio Orig. ($)</Label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">Precio Final ($)</Label>
                <Input
                  type="number"
                  value={formData.final_price}
                  onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-bold text-emerald-400"
                />
              </div>
            </div>

            {/* Fechas y Usos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-xs">Fecha Inicio</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-xs">Fecha Vencimiento</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-xs">Usos Máximos</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
            </div>

            {/* Código & Términos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-xs">Código Promocional / Cupón</Label>
                <Input
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-xs">Términos y Condiciones</Label>
                <Input
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs"
                />
              </div>
            </div>

            {/* Negocio y PIN de Validación (Escáner QR) */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-purple-400" />
                <Label className="text-purple-300 font-bold text-xs uppercase tracking-wider">Negocio y PIN de Validación (Escáner QR)</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-xs">Nombre del Negocio</Label>
                  <Input
                    value={formData.merchant_name}
                    onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                    placeholder="Ej: Bar La Pasión"
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-xs">Código PIN Secreto Negocio</Label>
                  <Input
                    value={formData.merchant_code}
                    onChange={(e) => setFormData({ ...formData, merchant_code: e.target.value.toUpperCase() })}
                    placeholder="Ej: PASION123"
                    className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono font-bold uppercase text-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación del Establecimiento (Integración Google Maps) */}
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  <Label className="text-blue-300 font-bold text-xs uppercase tracking-wider">
                    Ubicación del Establecimiento (Google Maps)
                  </Label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-950/50 h-6 px-2 text-[11px]"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Mi ubicación
                </Button>
              </div>

              <div className="space-y-1.5 relative">
                <div className="relative">
                  <Input
                    value={formData.location}
                    onChange={handleLocationInputChange}
                    onFocus={() => {
                      if (formData.location && formData.location.length >= 3 && locationSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Buscar dirección o local en Google Maps..."
                    className="bg-zinc-900 border-zinc-800 text-white text-xs pl-8 focus:border-blue-500"
                    autoComplete="off"
                  />
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  {isSearchingLocation && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-blue-400 animate-spin" />
                  )}
                </div>

                {/* Dropdown de Sugerencias de Google Places */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-zinc-950 border border-blue-500/40 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                    {locationSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.place_id}
                        className="px-3 py-2 hover:bg-blue-900/30 cursor-pointer text-white text-xs border-b border-zinc-800/60 last:border-b-0 flex items-center justify-between gap-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                          <span className="truncate">{suggestion.description}</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-1.5 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowSuggestions(false)}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <X className="h-2.5 w-2.5" />
                        Cerrar lista
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Coordenadas e Información Geográfica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px]">Dirección Detallada</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        address: val,
                        location: (!prev.location || prev.location === prev.address) ? val : prev.location
                      }));
                    }}
                    placeholder="Calle, número..."
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px]">Ciudad</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Santo Domingo"
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px]">País</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="República Dominicana"
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> GPS: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center justify-between">
                <span>Imagen de la Promoción</span>
                <span className="text-xs text-blue-400 font-normal">Selección Local / Archivo</span>
              </Label>

              {formData.image_url ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                      <Upload className="h-3.5 w-3.5" />
                      Cambiar Imagen Local
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-blue-400 mb-1 animate-bounce" />
                    <p className="text-xs font-bold text-white mb-0.5">Seleccionar imagen local</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageChange}
                    className="hidden"
                  />
                </label>
              )}
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="O URL directa (opcional)"
                className="bg-zinc-900 border-zinc-800 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-zinc-700 text-zinc-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsManager;
