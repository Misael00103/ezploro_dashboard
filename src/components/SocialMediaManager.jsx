import React, { useState, useEffect } from 'react';
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
import {
  getAllSocialNetworks,
  createSocialNetwork,
  updateSocialNetwork,
  deleteSocialNetwork,
  toggleSocialNetwork,
  getTotalFollowers
} from '../services/socialMediaService';

const SocialMediaManager = ({ socialMedia = [], setSocialMedia }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localSocialMedia, setLocalSocialMedia] = useState([]);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [formData, setFormData] = useState({
    platform: '',
    name: '',
    url: '',
    icon: '',
    followers: ''
  });
  const { toast } = useToast();

  // Cargar redes sociales al montar el componente
  useEffect(() => {
    loadSocialNetworks();
  }, []);

  const loadSocialNetworks = async () => {
    try {
      setIsLoading(true);
      const networks = await getAllSocialNetworks();
      
      // Si no hay redes o el array está vacío, mantener estado vacío
      if (!networks || networks.length === 0) {
        setLocalSocialMedia([]);
        if (setSocialMedia) {
          setSocialMedia([]);
        }
        return;
      }

      // Mapear los datos del backend al formato del frontend
      const formattedNetworks = networks.map(network => ({
        id: network.id || network.social_network_id,
        platform: network.plataforma || network.platform,
        name: network.nombre_usuario || network.name,
        url: network.url,
        icon: network.icono || network.icon || getIconFromPlatform(network.plataforma || network.platform),
        followers: network.cantidad_seguidores || network.followers || 0,
        is_active: network.activa !== undefined ? network.activa : (network.is_active !== undefined ? network.is_active : true),
      }));
      
      setLocalSocialMedia(formattedNetworks);
      if (setSocialMedia) {
        setSocialMedia(formattedNetworks);
      }

      // Cargar total de seguidores
      try {
        const total = await getTotalFollowers();
        setTotalFollowers(total);
      } catch (error) {
        console.error('Error loading total followers:', error);
        // Si falla, calcular desde los datos locales
        const calculatedTotal = formattedNetworks.reduce((sum, s) => sum + (s.followers || 0), 0);
        setTotalFollowers(calculatedTotal);
      }
    } catch (error) {
      console.error('Error loading social networks:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar las redes sociales",
        variant: "destructive"
      });
      // Mantener el estado vacío si hay error
      setLocalSocialMedia([]);
      if (setSocialMedia) {
        setSocialMedia([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIconFromPlatform = (platform) => {
    const platformLower = (platform || '').toLowerCase();
    if (platformLower.includes('facebook')) return 'facebook';
    if (platformLower.includes('instagram')) return 'instagram';
    if (platformLower.includes('twitter') || platformLower.includes('x')) return 'twitter';
    if (platformLower.includes('linkedin')) return 'linkedin';
    if (platformLower.includes('youtube')) return 'youtube';
    if (platformLower.includes('tiktok')) return 'music';
    return 'globe';
  };

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
    { name: 'Telegram', value: 'telegram', icon: 'globe' },
    { name: 'WhatsApp', value: 'whatsapp', icon: 'globe' },
    { name: 'Pinterest', value: 'pinterest', icon: 'globe' },
    { name: 'Snapchat', value: 'snapchat', icon: 'globe' },
    { name: 'Spotify', value: 'spotify', icon: 'music' }
  ];

  const handleIconSelect = (iconValue) => {
    setFormData({
      ...formData,
      icon: iconValue
    });
  };

  const handlePlatformSelect = (platform) => {
    const icon = getIconFromPlatform(platform.value);
    setFormData({
      ...formData,
      platform: platform.name, // Usar el nombre para que coincida con el valor del select
      icon: icon
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'followers') {
      // Permitir campo vacío mientras el usuario escribe
      if (value === '') {
        setFormData({
          ...formData,
          followers: ''
        });
      } else {
        // Convertir a número solo si hay un valor válido
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          setFormData({
            ...formData,
            followers: numValue
          });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      name: '',
      url: '',
      icon: '',
      followers: ''
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

    try {
      setIsLoading(true);
      // Convertir nombre de plataforma a valor para el backend
      const selectedPlatform = availablePlatforms.find(p => p.name === formData.platform);
      const platformValue = selectedPlatform ? selectedPlatform.value : formData.platform.toLowerCase();
      const icon = formData.icon || getIconFromPlatform(platformValue);
      const followersValue = formData.followers === '' || formData.followers === undefined ? 0 : parseInt(formData.followers) || 0;
      const newNetwork = await createSocialNetwork({
        platform: platformValue,
        name: formData.name || platformValue,
        url: formData.url,
        icon: icon,
        followers: followersValue,
        active: true
      });

      // Recargar todas las redes sociales después de crear
      await loadSocialNetworks();
      
      toast({
        title: "Red social agregada",
        description: "La red social se ha agregado exitosamente",
      });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating social network:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la red social",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (social) => {
    setSelectedSocial(social);
    // Convertir el valor de plataforma al nombre para que coincida con el select
    const platformValue = social.platform || social.plataforma;
    const platformName = availablePlatforms.find(p => p.value === platformValue || p.name === platformValue)?.name || platformValue;
    
    setFormData({
      platform: platformName,
      name: social.name || social.nombre_usuario,
      url: social.url,
      icon: social.icon || social.icono,
      followers: social.followers || social.cantidad_seguidores || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedSocial) {
      toast({
        title: "Error",
        description: "No se ha seleccionado una red social",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const networkId = selectedSocial.id || selectedSocial.social_network_id;
      // Convertir nombre de plataforma a valor para el backend
      const selectedPlatform = availablePlatforms.find(p => p.name === formData.platform);
      const platformValue = selectedPlatform ? selectedPlatform.value : formData.platform.toLowerCase();
      const icon = formData.icon || getIconFromPlatform(platformValue);
      const followersValue = formData.followers === '' || formData.followers === undefined ? 0 : parseInt(formData.followers) || 0;
      
      await updateSocialNetwork(networkId, {
        platform: platformValue,
        name: formData.name,
        url: formData.url,
        icon: icon,
        followers: followersValue,
        active: selectedSocial.is_active !== undefined ? selectedSocial.is_active : (selectedSocial.activa !== undefined ? selectedSocial.activa : true)
      });

      // Recargar todas las redes sociales después de actualizar
      await loadSocialNetworks();
      
      toast({
        title: "Red social actualizada",
        description: "Los cambios se han guardado exitosamente",
      });

      setIsEditModalOpen(false);
      resetForm();
      setSelectedSocial(null);
    } catch (error) {
      console.error('Error updating social network:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la red social",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (socialId) => {
    try {
      setIsLoading(true);
      await toggleSocialNetwork(socialId);
      
      // Recargar todas las redes sociales después de cambiar estado
      await loadSocialNetworks();
      
      toast({
        title: "Estado actualizado",
        description: "El estado de la red social se ha actualizado",
      });
    } catch (error) {
      console.error('Error toggling social network status:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cambiar el estado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (socialId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta red social?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteSocialNetwork(socialId);
      
      // Recargar todas las redes sociales después de eliminar
      await loadSocialNetworks();
      
      toast({
        title: "Red social eliminada",
        description: "La red social se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting social network:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la red social",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  const socialMediaToShow = socialMedia.length > 0 ? socialMedia : localSocialMedia;
  const activeCount = socialMediaToShow.filter(s => s.is_active || s.activa).length;
  const calculatedTotalFollowers = socialMediaToShow.reduce((sum, s) => sum + (s.followers || s.cantidad_seguidores || 0), 0);
  const finalTotalFollowers = totalFollowers > 0 ? totalFollowers : calculatedTotalFollowers;

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
                <p className="text-xl font-bold text-white">{formatFollowers(finalTotalFollowers)}</p>
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
        {isLoading && socialMediaToShow.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-black/40 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-300">Cargando redes sociales...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : socialMediaToShow.length === 0 ? (
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
        ) : (
          socialMediaToShow.map(social => {
            const IconComponent = getIcon(social.icon || social.icono);
            const isActive = social.is_active !== undefined ? social.is_active : (social.activa !== undefined ? social.activa : true);
            
            return (
            <Card key={social.id || social.social_network_id} className="bg-black/40 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-900/50 rounded-lg">
                        <IconComponent className="h-6 w-6 text-purple-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{social.platform || social.plataforma}</h3>
                        <p className="text-sm text-purple-300">@{social.name || social.nombre_usuario}</p>
                      </div>
                    </div>
                    <Badge className={isActive
                      ? 'bg-green-900/50 text-green-200 border-green-600/30'
                      : 'bg-red-900/50 text-red-200 border-red-600/30'
                    }>
                      {isActive ? (
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
                  {(social.followers || social.cantidad_seguidores) && (
                    <div className="space-y-1">
                      <p className="text-xs text-purple-400">Seguidores</p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-purple-300" />
                        <p className="text-sm font-medium text-white">
                          {formatFollowers(social.followers || social.cantidad_seguidores || 0)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2 border-t border-purple-500/20">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(social.id || social.social_network_id)}
                      disabled={isLoading}
                      className={isActive
                        ? "text-red-400 hover:bg-red-900/50"
                        : "text-green-400 hover:bg-green-900/50"
                      }
                    >
                      {isActive ? (
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
                      disabled={isLoading}
                      className="text-purple-300 hover:bg-purple-900/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(social.id || social.social_network_id)}
                      disabled={isLoading}
                      className="text-red-400 hover:bg-red-900/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
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
                onChange={(e) => {
                  const selectedPlatform = availablePlatforms.find(p => p.name === e.target.value);
                  if (selectedPlatform) {
                    handlePlatformSelect(selectedPlatform);
                  } else {
                    handleInputChange(e);
                  }
                }}
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
              <Label className="text-purple-200">Icono</Label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-black/30 border border-purple-500/30 rounded-md">
                {Object.keys(platformIcons).map(iconKey => {
                  const IconComponent = platformIcons[iconKey];
                  const isSelected = formData.icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => handleIconSelect(iconKey)}
                      className={`p-2 rounded-md transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-black/50 border border-purple-500/30 hover:bg-purple-900/50'
                      }`}
                      title={iconKey}
                    >
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-purple-300'}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-purple-400">
                Icono seleccionado: <span className="text-white font-medium">{formData.icon || 'Ninguno'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="followers" className="text-purple-200">Seguidores</Label>
              <Input
                id="followers"
                name="followers"
                type="number"
                value={formData.followers === '' ? '' : formData.followers}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="0"
                min="0"
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
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? 'Agregando...' : 'Agregar'}
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
                onChange={(e) => {
                  const selectedPlatform = availablePlatforms.find(p => p.name === e.target.value);
                  if (selectedPlatform) {
                    handlePlatformSelect(selectedPlatform);
                  } else {
                    handleInputChange(e);
                  }
                }}
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
              <Label className="text-purple-200">Icono</Label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-black/30 border border-purple-500/30 rounded-md">
                {Object.keys(platformIcons).map(iconKey => {
                  const IconComponent = platformIcons[iconKey];
                  const isSelected = formData.icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => handleIconSelect(iconKey)}
                      className={`p-2 rounded-md transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-black/50 border border-purple-500/30 hover:bg-purple-900/50'
                      }`}
                      title={iconKey}
                    >
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-purple-300'}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-purple-400">
                Icono seleccionado: <span className="text-white font-medium">{formData.icon || 'Ninguno'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-followers" className="text-purple-200">Seguidores</Label>
              <Input
                id="edit-followers"
                name="followers"
                type="number"
                value={formData.followers === '' ? '' : formData.followers}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="0"
                min="0"
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
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialMediaManager;