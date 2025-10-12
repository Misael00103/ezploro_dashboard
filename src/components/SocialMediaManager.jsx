import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  Users,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { mockSocialMedia } from '../mock';

const SocialMediaManager = () => {
  const [socialMedia, setSocialMedia] = useState(mockSocialMedia);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    name: '',
    url: '',
    icon: '',
    followers: 0
  });
  const { toast } = useToast();

  const platformIcons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    music: Music, // TikTok
    globe: Globe
  };

  const availablePlatforms = [
    { name: 'Facebook', value: 'facebook', icon: 'facebook' },
    { name: 'Instagram', value: 'instagram', icon: 'instagram' },
    { name: 'Twitter / X', value: 'twitter', icon: 'twitter' },
    { name: 'LinkedIn', value: 'linkedin', icon: 'linkedin' },
    { name: 'YouTube', value: 'youtube', icon: 'youtube' },
    { name: 'TikTok', value: 'tiktok', icon: 'music' },
    { name: 'Discord', value: 'discord', icon: 'globe' },
    { name: 'Telegram', value: 'telegram', icon: 'globe' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'followers' ? parseInt(value) || 0 : value
    });
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      name: '',
      url: '',
      icon: '',
      followers: 0
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.url) {
      toast({
        title: "Error",
        description: "Por favor completa plataforma y URL",
        variant: "destructive"
      });
      return;
    }

    const newSocial = {
      id: Math.max(...socialMedia.map(s => s.id)) + 1,
      ...formData,
      name: formData.name || formData.platform.toLowerCase(),
      is_active: true
    };

    const updatedSocial = [...socialMedia, newSocial];
    setSocialMedia(updatedSocial);
    
    toast({
      title: "Red social agregada",
      description: "La red social se ha agregado exitosamente",
    });

    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = (social) => {
    setSelectedSocial(social);
    setFormData({
      platform: social.platform,
      name: social.name,
      url: social.url,
      icon: social.icon,
      followers: social.followers || 0
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const updatedSocial = socialMedia.map(social =>
      social.id === selectedSocial.id
        ? { ...social, ...formData }
        : social
    );
    
    setSocialMedia(updatedSocial);
    
    toast({
      title: "Red social actualizada",
      description: "Los cambios se han guardado exitosamente",
    });

    setIsEditModalOpen(false);
    resetForm();
    setSelectedSocial(null);
  };

  const handleToggleStatus = (socialId) => {
    const updatedSocial = socialMedia.map(social =>
      social.id === socialId
        ? { ...social, is_active: !social.is_active }
        : social
    );
    
    setSocialMedia(updatedSocial);
    
    toast({
      title: "Estado actualizado",
      description: "El estado de la red social se ha actualizado",
    });
  };

  const handleDelete = (socialId) => {
    const updatedSocial = socialMedia.filter(social => social.id !== socialId);
    setSocialMedia(updatedSocial);
    
    toast({
      title: "Red social eliminada",
      description: "La red social se ha eliminado exitosamente",
    });
  };

  const getIcon = (iconName) => {
    const IconComponent = platformIcons[iconName] || Globe;
    return IconComponent;
  };

  const formatFollowers = (followers) => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}k`;
    }
    return followers.toString();
  };

  const activeCount = socialMedia.filter(s => s.is_active).length;
  const totalFollowers = socialMedia.reduce((sum, s) => sum + (s.followers || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Redes Sociales</h2>
          <p className="text-purple-300">Administra los enlaces y perfiles de redes sociales</p>
        </div>
        <div className="flex space-x-4">
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Activas</p>
                <p className="text-xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Seguidores</p>
                <p className="text-xl font-bold text-white">{formatFollowers(totalFollowers)}</p>
              </div>
            </div>
          </Card>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Red Social
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Social Media Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {socialMedia.map(social => {
          const IconComponent = getIcon(social.icon);
          
          return (
            <Card key={social.id} className="bg-black/40 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-900/50 rounded-lg">
                        <IconComponent className="h-6 w-6 text-purple-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{social.platform}</h3>
                        <p className="text-sm text-purple-300">@{social.name}</p>
                      </div>
                    </div>
                    <Badge className={social.is_active 
                      ? 'bg-green-900/50 text-green-200 border-green-600/30'
                      : 'bg-red-900/50 text-red-200 border-red-600/30'
                    }>
                      {social.is_active ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Activa</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" />Inactiva</>
                      )}
                    </Badge>
                  </div>

                  {/* URL */}
                  <div className="space-y-1">
                    <p className="text-xs text-purple-400">URL</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-purple-200 truncate flex-1">
                        {social.url}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-purple-300 hover:bg-purple-900/50 p-1"
                        onClick={() => window.open(social.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Followers */}
                  {social.followers && (
                    <div className="space-y-1">
                      <p className="text-xs text-purple-400">Seguidores</p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-purple-300" />
                        <p className="text-sm font-medium text-white">
                          {formatFollowers(social.followers)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2 border-t border-purple-500/20">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(social.id)}
                      className={social.is_active 
                        ? "text-red-400 hover:bg-red-900/50"
                        : "text-green-400 hover:bg-green-900/50"
                      }
                    >
                      {social.is_active ? (
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
                      onClick={() => handleEdit(social)}
                      className="text-purple-300 hover:bg-purple-900/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(social.id)}
                      className="text-red-400 hover:bg-red-900/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {socialMedia.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-black/40 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Globe className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No hay redes sociales</h3>
                  <p className="text-purple-300">Agrega tus primeras redes sociales para comenzar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Agregar Red Social</DialogTitle>
            <DialogDescription className="text-purple-300">
              Completa la información de la nueva red social
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-purple-200">Plataforma *</Label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full p-2 bg-black/50 border border-purple-500/30 rounded-md text-white"
                required
              >
                <option value="">Seleccionar plataforma</option>
                {availablePlatforms.map(platform => (
                  <option key={platform.value} value={platform.name}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-purple-200">Nombre de usuario</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="scapeevents"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-purple-200">URL *</Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={formData.url}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="https://facebook.com/scapeevents"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon" className="text-purple-200">Icono</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="facebook, instagram, twitter..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followers" className="text-purple-200">Seguidores</Label>
              <Input
                id="followers"
                name="followers"
                type="number"
                value={formData.followers}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="0"
              />
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
                Agregar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Red Social</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información de la red social
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-purple-200">Plataforma *</Label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full p-2 bg-black/50 border border-purple-500/30 rounded-md text-white"
                required
              >
                <option value="">Seleccionar plataforma</option>
                {availablePlatforms.map(platform => (
                  <option key={platform.value} value={platform.name}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-purple-200">Nombre de usuario</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-url" className="text-purple-200">URL *</Label>
              <Input
                id="edit-url"
                name="url"
                type="url"
                value={formData.url}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-icon" className="text-purple-200">Icono</Label>
              <Input
                id="edit-icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-followers" className="text-purple-200">Seguidores</Label>
              <Input
                id="edit-followers"
                name="followers"
                type="number"
                value={formData.followers}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
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

export default SocialMediaManager;