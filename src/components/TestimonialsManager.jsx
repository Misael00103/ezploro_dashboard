import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const TestimonialsManager = ({ testimonials, updateTestimonials }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    testimonio: '',
    name_testimonio: '',
    cargo_testimonio: '',
    imagen_testimonio: '',
    is_active: true
  });
  const { toast } = useToast();

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.testimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.name_testimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.cargo_testimonio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && testimonial.is_active) ||
                         (filterStatus === 'inactive' && !testimonial.is_active);
    
    return matchesSearch && matchesStatus;
  });

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
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.testimonio || !formData.name_testimonio || !formData.cargo_testimonio) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const newTestimonial = {
      id: Math.max(...testimonials.map(t => t.id)) + 1,
      ...formData,
      imagen_testimonio: formData.imagen_testimonio || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
      created_at: new Date().toISOString()
    };

    const updatedTestimonials = [...testimonials, newTestimonial];
    updateTestimonials(updatedTestimonials);
    
    toast({
      title: "Testimonio creado",
      description: "El testimonio se ha creado exitosamente",
    });

    setIsCreateModalOpen(false);
    resetForm();
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
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const updatedTestimonials = testimonials.map(testimonial =>
      testimonial.id === selectedTestimonial.id
        ? { ...testimonial, ...formData }
        : testimonial
    );
    
    updateTestimonials(updatedTestimonials);
    
    toast({
      title: "Testimonio actualizado",
      description: "El testimonio se ha actualizado exitosamente",
    });

    setIsEditModalOpen(false);
    resetForm();
    setSelectedTestimonial(null);
  };

  const handleDelete = (testimonialId) => {
    const updatedTestimonials = testimonials.filter(testimonial => testimonial.id !== testimonialId);
    updateTestimonials(updatedTestimonials);
    
    toast({
      title: "Testimonio eliminado",
      description: "El testimonio se ha eliminado exitosamente",
    });
  };

  const handleToggleStatus = (testimonialId) => {
    const updatedTestimonials = testimonials.map(testimonial =>
      testimonial.id === testimonialId
        ? { ...testimonial, is_active: !testimonial.is_active }
        : testimonial
    );
    
    updateTestimonials(updatedTestimonials);
    
    toast({
      title: "Estado actualizado",
      description: "El estado del testimonio se ha actualizado",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const activeCount = testimonials.filter(t => t.is_active).length;
  const inactiveCount = testimonials.filter(t => !t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Testimonios</h2>
          <p className="text-purple-300">Administra los testimonios de clientes y usuarios</p>
        </div>
        <div className="flex space-x-4">
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Activos</p>
                <p className="text-xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Inactivos</p>
                <p className="text-xl font-bold text-white">{inactiveCount}</p>
              </div>
            </div>
          </Card>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                <Plus className="h-4 w-4 mr-2" />
                Crear Testimonio
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
      <div className="grid gap-6">
        {filteredTestimonials.map(testimonial => (
          <Card key={testimonial.id} className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={testimonial.imagen_testimonio} alt={testimonial.name_testimonio} />
                    <AvatarFallback className="bg-purple-600 text-white text-xl">
                      {testimonial.name_testimonio.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white">{testimonial.name_testimonio}</h3>
                      <p className="text-sm text-purple-300">{testimonial.cargo_testimonio}</p>
                      <p className="text-xs text-purple-400">
                        Creado: {formatDate(testimonial.created_at)}
                      </p>
                    </div>
                    <Badge 
                      className={testimonial.is_active 
                        ? 'bg-green-900/50 text-green-200 border-green-600/30'
                        : 'bg-red-900/50 text-red-200 border-red-600/30'
                      }
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
                      "{testimonial.testimonio.length > 150 
                        ? `${testimonial.testimonio.substring(0, 150)}...`
                        : testimonial.testimonio}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(testimonial.id)}
                    className={testimonial.is_active 
                      ? "text-red-400 hover:bg-red-900/50"
                      : "text-green-400 hover:bg-green-900/50"
                    }
                  >
                    {testimonial.is_active ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(testimonial)}
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-red-400 hover:bg-red-900/50"
                  >
                    <Trash2 className="h-4 w-4" />
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
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="imagen_testimonio" className="text-purple-200">URL de Imagen</Label>
              <Input
                id="imagen_testimonio"
                name="imagen_testimonio"
                value={formData.imagen_testimonio}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="https://example.com/imagen.jpg (opcional)"
              />
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Crear Testimonio
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
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="edit-imagen_testimonio" className="text-purple-200">URL de Imagen</Label>
              <Input
                id="edit-imagen_testimonio"
                name="imagen_testimonio"
                value={formData.imagen_testimonio}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
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

export default TestimonialsManager;