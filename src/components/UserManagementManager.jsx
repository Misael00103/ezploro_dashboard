import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  User,
  Settings,
  Shield,
  Bell,
  Camera,
  Key,
  Mail,
  Phone,
  Save,
  Upload,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Palette,
  Globe,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadProfilePicture 
} from '../services/userService';

const UserManagementManager = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    passwordExpiry: '90'
  });

  const [dashboardPreferences, setDashboardPreferences] = useState({
    theme: 'dark',
    language: 'es',
    timezone: 'Europe/Madrid',
    dateFormat: 'dd/mm/yyyy',
    defaultView: 'overview'
  });

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserProfile();
        setUser(userData);
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || ''
        });
        if (userData.avatar) {
          setImagePreview(userData.avatar);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Error al cargar el perfil del usuario');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true);
      
      // Upload new profile picture if selected
      if (profileImage) {
        const imageUrl = await uploadProfilePicture(profileImage);
        await updateUserProfile({ ...profileForm, avatar: imageUrl });
      } else {
        await updateUserProfile(profileForm);
      }
      
      // Update local state
      setUser(prev => ({
        ...prev,
        ...profileForm,
        avatar: imagePreview || prev.avatar
      }));
      
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsSaving(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Contraseña actualizada exitosamente');
      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSettingsChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSecuritySettingsChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleDashboardPreferenceChange = (setting, value) => {
    setDashboardPreferences(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando perfil...</span>
      </div>
    );
  }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleAvatarUpload = () => {
    // Mock file upload
    const newAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    setUser(prev => ({ ...prev, avatar: newAvatar }));
    alert('Foto de perfil actualizada');
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSecurityToggle = (setting) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePreferenceChange = (setting, value) => {
    setDashboardPreferences(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuario</h1>
          <p className="text-purple-300 mt-2">Administra tu perfil y configuraciones</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-500/30">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferencias
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {/* Profile Picture Card */}
            <Card className="bg-black/40 border-purple-500/30">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview || user?.avatar} alt={user?.name} />
                    <AvatarFallback>{(user?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <label 
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
                    htmlFor="profile-picture"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <h3 className="text-lg font-medium">{user?.name || 'Usuario'}</h3>
                <p className="text-sm text-muted-foreground">{user?.role || 'Administrador'}</p>
                <Badge variant={user?.isActive ? 'default' : 'secondary'} className="mt-2">
                  {user?.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={() => handleSecurityToggle('twoFactorAuth')}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div>
                    <h4 className="text-white font-medium">Alertas de Inicio de Sesión</h4>
                    <p className="text-purple-300 text-sm">Notifica sobre nuevos inicios</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={() => handleSecurityToggle('loginAlerts')}
                  />
                </div>
                <div>
                  <Label className="text-purple-200">Tiempo de Sesión (minutos)</Label>
                  <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Expiración de Contraseña (días)</Label>
                  <Select value={securitySettings.passwordExpiry} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: value }))}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="180">180 días</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription className="text-purple-300">
                Personaliza cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Notificaciones por Email</h4>
                      <p className="text-purple-300 text-sm">Recibir alertas en tu email</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Notificaciones Push</h4>
                      <p className="text-purple-300 text-sm">Alertas del navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Recordatorios de Eventos</h4>
                      <p className="text-purple-300 text-sm">Alertas antes de eventos</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.eventReminders}
                    onCheckedChange={() => handleNotificationToggle('eventReminders')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Emails de Marketing</h4>
                      <p className="text-purple-300 text-sm">Promociones y novedades</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Alertas de Seguridad</h4>
                      <p className="text-purple-300 text-sm">Avisos de seguridad importantes</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={() => handleNotificationToggle('securityAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Reportes Semanales</h4>
                      <p className="text-purple-300 text-sm">Resumen semanal de actividad</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Apariencia
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Personaliza la interfaz del dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-purple-200">Tema</Label>
                  <Select value={dashboardPreferences.theme} onValueChange={(value) => handlePreferenceChange('theme', value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Vista por Defecto</Label>
                  <Select value={dashboardPreferences.defaultView} onValueChange={(value) => handlePreferenceChange('defaultView', value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Resumen</SelectItem>
                      <SelectItem value="events">Eventos</SelectItem>
                      <SelectItem value="contacts">Contactos</SelectItem>
                      <SelectItem value="gamification">Gamificación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Localización
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Configuración regional y de idioma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-purple-200">Idioma</Label>
                  <Select value={dashboardPreferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Zona Horaria</Label>
                  <Select value={dashboardPreferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Formato de Fecha</Label>
                  <Select value={dashboardPreferences.dateFormat} onValueChange={(value) => handlePreferenceChange('dateFormat', value)}>
                    <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Resumen de Configuraciones</CardTitle>
              <CardDescription className="text-purple-300">
                Vista general de tus preferencias actuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <h4 className="text-white font-medium mb-2">Seguridad</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">2FA:</span>
                      <Badge className={securitySettings.twoFactorAuth ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}>
                        {securitySettings.twoFactorAuth ? 'Activado' : 'Desactivado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Sesión:</span>
                      <span className="text-purple-200">{securitySettings.sessionTimeout} min</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <h4 className="text-white font-medium mb-2">Notificaciones</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Email:</span>
                      <Badge className={notificationSettings.emailNotifications ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}>
                        {notificationSettings.emailNotifications ? 'Activado' : 'Desactivado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Push:</span>
                      <Badge className={notificationSettings.pushNotifications ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}>
                        {notificationSettings.pushNotifications ? 'Activado' : 'Desactivado'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-500/20">
                  <h4 className="text-white font-medium mb-2">Preferencias</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Idioma:</span>
                      <span className="text-purple-200">Español</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Tema:</span>
                      <span className="text-purple-200">Oscuro</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementManager;