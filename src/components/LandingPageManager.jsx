import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Save,
  Eye,
  Monitor,
  Image as ImageIcon,
  Type,
  Layout,
  Settings,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { mockLandingPageContent } from '../mock';

const LandingPageManager = () => {
  const [content, setContent] = useState(mockLandingPageContent);
  const [activeTab, setActiveTab] = useState('hero');
  const { toast } = useToast();

  const handleHeroChange = (field, value) => {
    setContent({
      ...content,
      hero: {
        ...content.hero,
        [field]: value
      }
    });
  };

  const handleFeaturesChange = (field, value) => {
    setContent({
      ...content,
      features: {
        ...content.features,
        [field]: value
      }
    });
  };

  const handleFeatureItemChange = (featureId, field, value) => {
    const updatedFeatures = content.features.features_list.map(feature =>
      feature.id === featureId ? { ...feature, [field]: value } : feature
    );
    
    setContent({
      ...content,
      features: {
        ...content.features,
        features_list: updatedFeatures
      }
    });
  };

  const handleAboutChange = (field, value) => {
    setContent({
      ...content,
      about: {
        ...content.about,
        [field]: value
      }
    });
  };

  const handleCtaChange = (field, value) => {
    setContent({
      ...content,
      cta: {
        ...content.cta,
        [field]: value
      }
    });
  };

  const handleSave = () => {
    toast({
      title: "Contenido guardado",
      description: "Los cambios en la landing page se han guardado exitosamente",
    });
  };

  const handlePreview = () => {
    toast({
      title: "Vista previa",
      description: "Abriendo vista previa de la landing page...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Landing Page Manager</h2>
          <p className="text-purple-300">Edita el contenido y configuración de la página principal</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-500/30">
          <TabsTrigger 
            value="hero" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger 
            value="features" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Layout className="h-4 w-4 mr-2" />
            Características
          </TabsTrigger>
          <TabsTrigger 
            value="about" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Type className="h-4 w-4 mr-2" />
            Acerca de
          </TabsTrigger>
          <TabsTrigger 
            value="cta" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            Call to Action
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Sección Hero</CardTitle>
                  <CardDescription className="text-purple-300">
                    Configura el contenido principal de la página de inicio
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={content.hero.is_active}
                    onCheckedChange={(checked) => handleHeroChange('is_active', checked)}
                  />
                  <Label className="text-purple-200">
                    {content.hero.is_active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-purple-200">Título Principal</Label>
                <Input
                  value={content.hero.title}
                  onChange={(e) => handleHeroChange('title', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Subtítulo</Label>
                <Input
                  value={content.hero.subtitle}
                  onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Descripción</Label>
                <Textarea
                  value={content.hero.description}
                  onChange={(e) => handleHeroChange('description', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Texto del Botón</Label>
                <Input
                  value={content.hero.cta_text}
                  onChange={(e) => handleHeroChange('cta_text', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Imagen de Fondo</Label>
                <Input
                  value={content.hero.background_image}
                  onChange={(e) => handleHeroChange('background_image', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  placeholder="https://example.com/imagen.jpg"
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-black/20 rounded-lg border border-purple-500/20">
                <h4 className="text-sm font-medium text-purple-200 mb-2">Vista Previa:</h4>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{content.hero.title}</h3>
                  <p className="text-purple-300">{content.hero.subtitle}</p>
                  <p className="text-sm text-purple-400">{content.hero.description}</p>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    {content.hero.cta_text}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section */}
        <TabsContent value="features">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Sección de Características</CardTitle>
                  <CardDescription className="text-purple-300">
                    Configura las características principales de tu plataforma
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={content.features.is_active}
                    onCheckedChange={(checked) => handleFeaturesChange('is_active', checked)}
                  />
                  <Label className="text-purple-200">
                    {content.features.is_active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-purple-200">Título de Sección</Label>
                  <Input
                    value={content.features.title}
                    onChange={(e) => handleFeaturesChange('title', e.target.value)}
                    className="bg-black/50 border-purple-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-purple-200">Subtítulo</Label>
                  <Input
                    value={content.features.subtitle}
                    onChange={(e) => handleFeaturesChange('subtitle', e.target.value)}
                    className="bg-black/50 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Características Individuales</h4>
                {content.features.features_list.map(feature => (
                  <Card key={feature.id} className="bg-black/60 border-purple-500/20">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-medium text-white">Característica {feature.id}</h5>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={feature.is_active}
                            onCheckedChange={(checked) => handleFeatureItemChange(feature.id, 'is_active', checked)}
                          />
                          <Badge className={feature.is_active 
                            ? 'bg-green-900/50 text-green-200 border-green-600/30'
                            : 'bg-red-900/50 text-red-200 border-red-600/30'
                          }>
                            {feature.is_active ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Activa</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Inactiva</>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-purple-200">Título</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => handleFeatureItemChange(feature.id, 'title', e.target.value)}
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-purple-200">Icono</Label>
                          <Input
                            value={feature.icon}
                            onChange={(e) => handleFeatureItemChange(feature.id, 'icon', e.target.value)}
                            className="bg-black/50 border-purple-500/30 text-white"
                            placeholder="calendar, users, trophy..."
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label className="text-purple-200">Descripción</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => handleFeatureItemChange(feature.id, 'description', e.target.value)}
                          className="bg-black/50 border-purple-500/30 text-white"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Sección Acerca de</CardTitle>
                  <CardDescription className="text-purple-300">
                    Configura la información sobre tu empresa o historia
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={content.about.is_active}
                    onCheckedChange={(checked) => handleAboutChange('is_active', checked)}
                  />
                  <Label className="text-purple-200">
                    {content.about.is_active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-purple-200">Título</Label>
                <Input
                  value={content.about.title}
                  onChange={(e) => handleAboutChange('title', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Contenido</Label>
                <Textarea
                  value={content.about.content}
                  onChange={(e) => handleAboutChange('content', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Imagen</Label>
                <Input
                  value={content.about.image}
                  onChange={(e) => handleAboutChange('image', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  placeholder="https://example.com/imagen.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section */}
        <TabsContent value="cta">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Call to Action</CardTitle>
                  <CardDescription className="text-purple-300">
                    Configura la sección de llamada a la acción final
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={content.cta.is_active}
                    onCheckedChange={(checked) => handleCtaChange('is_active', checked)}
                  />
                  <Label className="text-purple-200">
                    {content.cta.is_active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-purple-200">Título</Label>
                <Input
                  value={content.cta.title}
                  onChange={(e) => handleCtaChange('title', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Descripción</Label>
                <Textarea
                  value={content.cta.description}
                  onChange={(e) => handleCtaChange('description', e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-purple-200">Texto del Botón</Label>
                  <Input
                    value={content.cta.button_text}
                    onChange={(e) => handleCtaChange('button_text', e.target.value)}
                    className="bg-black/50 border-purple-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-purple-200">Color de Fondo</Label>
                  <Input
                    value={content.cta.background_color}
                    onChange={(e) => handleCtaChange('background_color', e.target.value)}
                    className="bg-black/50 border-purple-500/30 text-white"
                    placeholder="purple, blue, black..."
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-black/20 rounded-lg border border-purple-500/20">
                <h4 className="text-sm font-medium text-purple-200 mb-2">Vista Previa:</h4>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white">{content.cta.title}</h3>
                  <p className="text-purple-300">{content.cta.description}</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    {content.cta.button_text}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPageManager;