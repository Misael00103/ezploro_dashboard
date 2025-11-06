import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  User,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonial
} from '../services/testimonialService';

const TestimonialsManager = ({ testimonials, updateTestimonials }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    testimonio: '',
    name_testimonio: '',
    cargo_testimonio: '',
    imagen_testimonio: '',
    is_active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.testimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.name_testimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.cargo_testimonio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && testimonial.is_active) ||
                         (filterStatus === 'inactive' && !testimonial.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const activeCount = testimonials.filter(t => t.is_active).length;
  const inactiveCount = testimonials.filter(t => !t.is_active).length;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSwitchChange = (checked) => {
    setFormData({
      ...formData,
      is_active: checked
    });
  };

  const resetForm = () => {
    setFormData({
      testimonio: '',
      name_testimonio: '',
      cargo_testimonio: '',
      imagen_testimonio: '',
      is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Limpiar URL si se selecciona un archivo
      setFormData({ ...formData, imagen_testimonio: '' });
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Limpiar URL si se selecciona un archivo
      setFormData({ ...formData, imagen_testimonio: '' });
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, imagen_testimonio: url });
    
    // Si hay URL válida, mostrar preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImagePreview(url);
      // Limpiar archivo si se ingresa URL
      setImageFile(null);
    } else if (!url) {
      setImagePreview(null);
    }
  };

  const handleEditUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, imagen_testimonio: url });
    
    // Si hay URL válida, mostrar preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setEditImagePreview(url);
      // Limpiar archivo si se ingresa URL
      setEditImageFile(null);
    }
  };

  const loadTestimonials = async () => {
    try {
      setIsLoading(true);
      // Usar getAllTestimonials para obtener todos los testimonios (activos e inactivos)
      const data = await getAllTestimonials({ 
        limit: 100, 
        offset: 0
      });
      updateTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast.error('Error al cargar los testimonios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (testimonials.length === 0) {
      loadTestimonials();
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.testimonio || !formData.name_testimonio || !formData.cargo_testimonio) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que tenga imagen (archivo o URL)
    if (!imageFile && !formData.imagen_testimonio) {
      toast.error('Debes proporcionar una imagen (archivo o URL)');
      return;
    }

    try {
      setIsLoading(true);
      const newTestimonial = await createTestimonial(formData, imageFile || null);
      
      toast.success('Testimonio creado exitosamente');
    setIsCreateModalOpen(false);
    resetForm();
      
      // Recargar testimonios
      await loadTestimonials();
    } catch (error) {
      console.error('Error creating testimonial:', error);
      toast.error(error.message || 'Error al crear el testimonio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      testimonio: testimonial.testimonio,
      name_testimonio: testimonial.name_testimonio,
      cargo_testimonio: testimonial.cargo_testimonio,
      imagen_testimonio: testimonial.imagen_testimonio,
      is_active: testimonial.is_active
    });
    setEditImagePreview(testimonial.imagen_testimonio);
    setEditImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedTestimonial) return;

    if (!formData.testimonio || !formData.name_testimonio || !formData.cargo_testimonio) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsLoading(true);
      const testimonialId = selectedTestimonial.testimonial_id || selectedTestimonial.id;
      await updateTestimonial(testimonialId, formData, editImageFile || null);
      
      toast.success('Testimonio actualizado exitosamente');
    setIsEditModalOpen(false);
    resetForm();
    setSelectedTestimonial(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      
      // Recargar testimonios
      await loadTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast.error(error.message || 'Error al actualizar el testimonio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (testimonialId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      return;
    }

    try {
      setIsLoading(true);
      const id = typeof testimonialId === 'object' 
        ? (testimonialId.testimonial_id || testimonialId.id)
        : testimonialId;
      
      await deleteTestimonial(id);
      toast.success('Testimonio eliminado exitosamente');
      
      // Recargar testimonios
      await loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error(error.message || 'Error al eliminar el testimonio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (testimonialId) => {
    try {
      setIsLoading(true);
      const id = typeof testimonialId === 'object' 
        ? (testimonialId.testimonial_id || testimonialId.id)
        : testimonialId;
      
      await toggleTestimonial(id);
      toast.success('Estado del testimonio actualizado');
      
      // Recargar testimonios
      await loadTestimonials();
    } catch (error) {
      console.error('Error toggling testimonial status:', error);
      toast.error(error.message || 'Error al cambiar el estado del testimonio');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestión de Testimonios</h2>
          <p className="text-sm sm:text-base text-purple-300">Administra los testimonios de clientes y usuarios</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Card className="bg-black/40 border-purple-500/30 px-3 sm:px-4 py-2 flex-1 sm:flex-initial">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              <div className="text-center min-w-0">
                <p className="text-xs sm:text-sm text-purple-200">Activos</p>
                <p className="text-lg sm:text-xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-black/40 border-purple-500/30 px-3 sm:px-4 py-2 flex-1 sm:flex-initial">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
              <div className="text-center min-w-0">
                <p className="text-xs sm:text-sm text-purple-200">Inactivos</p>
                <p className="text-lg sm:text-xl font-bold text-white">{inactiveCount}</p>
              </div>
            </div>
          </Card>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-xs sm:text-sm">Crear Testimonio</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-purple-200">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por testimonio, nombre o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-200">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  <SelectItem value="all" className="text-white hover:bg-purple-900/50">Todos</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-purple-900/50">Activos</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-purple-900/50">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Grid */}
      <div className="space-y-4 sm:space-y-6">
        {filteredTestimonials.map(testimonial => (
          <Card key={testimonial.testimonial_id || testimonial.id} className="bg-black/40 border-purple-500/30 overflow-hidden hover:border-purple-500/50 transition-colors">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 flex justify-center sm:justify-start">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarImage src={testimonial.imagen_testimonio} alt={testimonial.name_testimonio} className="object-cover" />
                    <AvatarFallback className="bg-purple-600 text-white text-xl sm:text-2xl">
                      {testimonial.name_testimonio?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base sm:text-lg truncate">{testimonial.name_testimonio}</h3>
                      <p className="text-xs sm:text-sm text-purple-300 truncate">{testimonial.cargo_testimonio}</p>
                      <p className="text-xs text-purple-400">
                        Creado: {testimonial.created_at ? formatDate(testimonial.created_at) : 'N/A'}
                      </p>
                    </div>
                    <Badge 
                      className={`${testimonial.is_active 
                        ? 'bg-green-900/50 text-green-200 border-green-600/30'
                        : 'bg-red-900/50 text-red-200 border-red-600/30'
                      } flex-shrink-0 w-fit`}
                    >
                      {testimonial.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactivo
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-purple-200 italic">
                      "{testimonial.testimonio && testimonial.testimonio.length > 150 
                        ? `${testimonial.testimonio.substring(0, 150)}...`
                        : testimonial.testimonio || 'Sin testimonio'}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-purple-500/20 sm:pl-4 sm:ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(testimonial.testimonial_id || testimonial.id)}
                    disabled={isLoading}
                    className={`${testimonial.is_active 
                      ? "text-red-400 hover:bg-red-900/50"
                      : "text-green-400 hover:bg-green-900/50"
                    } flex-shrink-0 p-2`}
                  >
                    {testimonial.is_active ? (
                      <>
                        <XCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Desactivar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Activar</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(testimonial)}
                    disabled={isLoading}
                    className="text-purple-300 hover:bg-purple-900/50 flex-shrink-0 p-2"
                  >
                    <Edit className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(testimonial.testimonial_id || testimonial.id)}
                    disabled={isLoading}
                    className="text-red-400 hover:bg-red-900/50 flex-shrink-0 p-2"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTestimonials.length === 0 && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Star className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron testimonios</h3>
                <p className="text-purple-300">No hay testimonios que coincidan con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nuevo Testimonio</DialogTitle>
            <DialogDescription className="text-purple-300">
              Completa la información para crear un nuevo testimonio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_testimonio" className="text-purple-200">Nombre *</Label>
                <Input
                  id="name_testimonio"
                  name="name_testimonio"
                  value={formData.name_testimonio}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo_testimonio" className="text-purple-200">Cargo *</Label>
                <Input
                  id="cargo_testimonio"
                  name="cargo_testimonio"
                  value={formData.cargo_testimonio}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-purple-200">Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="bg-black/50 border-purple-500/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-purple-400 mt-1">Selecciona una imagen desde tu dispositivo</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen_testimonio" className="text-purple-200">O desde URL</Label>
              <Input
                id="imagen_testimonio"
                name="imagen_testimonio"
                type="url"
                value={formData.imagen_testimonio}
                onChange={handleUrlChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="https://example.com/imagen.jpg"
              />
              <p className="text-xs text-purple-400">Pega la URL de una imagen (http:// o https://)</p>
            </div>
            
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                <strong>Nota:</strong> Debes proporcionar una imagen usando <strong>archivo</strong> o <strong>URL</strong>. 
                Si proporcionas ambos, se usará el archivo.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testimonio" className="text-purple-200">Testimonio *</Label>
              <Textarea
                id="testimonio"
                name="testimonio"
                value={formData.testimonio}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active" className="text-purple-200">
                Activo (visible públicamente)
              </Label>
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
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Testimonio'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Testimonio</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información del testimonio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name_testimonio" className="text-purple-200">Nombre *</Label>
                <Input
                  id="edit-name_testimonio"
                  name="name_testimonio"
                  value={formData.name_testimonio}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cargo_testimonio" className="text-purple-200">Cargo *</Label>
                <Input
                  id="edit-cargo_testimonio"
                  name="cargo_testimonio"
                  value={formData.cargo_testimonio}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image" className="text-purple-200">Nueva Imagen desde Archivo</Label>
              <div className="flex items-center space-x-4">
                {editImagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30">
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="bg-black/50 border-purple-500/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-purple-400 mt-1">Deja vacío para mantener la imagen actual</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-imagen_testimonio" className="text-purple-200">O desde URL</Label>
              <Input
                id="edit-imagen_testimonio"
                name="imagen_testimonio"
                type="url"
                value={formData.imagen_testimonio}
                onChange={handleEditUrlChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="https://example.com/imagen.jpg"
              />
              <p className="text-xs text-purple-400">Pega la URL de una imagen para reemplazar la actual</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-testimonio" className="text-purple-200">Testimonio *</Label>
              <Textarea
                id="edit-testimonio"
                name="testimonio"
                value={formData.testimonio}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="edit-is_active" className="text-purple-200">
                Activo (visible públicamente)
              </Label>
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
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsManager;