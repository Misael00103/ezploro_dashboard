import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus
} from '../services/offerService';
import { toast } from 'react-hot-toast';

const DEFAULT_CATEGORIES = ['Bebidas', 'Entradas', 'Comida', 'Experiencias', 'VIP'];

const PromotionsManager = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

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
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const offersList = await getOffers();
      
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
    } catch (error) {
      console.error('Error cargando promociones:', error);
      toast.error('Error al cargar las promociones');
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
    setFormData({
      title: 'Happy Hour 2x1 en Mojitos & Tragos',
      category: 'Bebidas',
      points_required: 300,
      offer_type: '2x1',
      discount_percentage: '50',
      discount_amount: '',
      original_price: '20',
      final_price: '10',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      max_uses: '100',
      promo_code: 'MOJITO2X1',
      terms_conditions: 'Válido de jueves a sábado hasta la medianoche.',
      description: 'Válido en Bares y Discotecas Afiliadas de la Ciudad.',
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
      is_active: true
    });
    setActiveTab('create');
  };

  const handleEditOpen = (offer) => {
    setSelectedOffer(offer);
    setSelectedImageFile(null);
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
      image_url: offer.image_url || '',
      is_active: offer.is_active !== undefined ? offer.is_active : true
    });
    setIsEditModalOpen(true);
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
      await createOffer(formData, selectedImageFile);
      toast.success('🎟️ Promoción creada con éxito');
      setActiveTab('catalog');
      await loadData();
    } catch (error) {
      console.error('Error al crear promoción:', error);
      toast.error('No se pudo guardar la promoción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      const id = selectedOffer.offer_id || selectedOffer.id || selectedOffer._id;
      await updateOffer(id, formData, selectedImageFile);
      toast.success('✨ Promoción actualizada correctamente');
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      toast.error('Error al actualizar la promoción');
    }
  };

  const handleToggleStatus = async (offer) => {
    const id = offer.offer_id || offer.id || offer._id;
    try {
      await toggleOfferStatus(id, !offer.is_active);
      toast.success('Estado de la promoción actualizado');
      loadData();
    } catch (error) {
      console.error('Error alternando estado:', error);
      toast.error('No se pudo cambiar el estado de la promoción');
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

        {/* Tab 4: Redemptions */}
        <TabsContent value="redemptions">
          <Card className="glass-panel border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">Historial de Canjes de Promociones</CardTitle>
              <CardDescription className="text-zinc-400">
                Registro de cupones y ofertas reclamadas por usuarios en la app.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Happy Hour 2x1 en Mojitos & Tragos</h4>
                      <p className="text-xs text-zinc-400">Usuario: Sofia Gomez • Código: EZP-MOJ-9921</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Canjeado</span>
                    <p className="text-[11px] text-zinc-500 mt-1">Hace 45 mins</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
