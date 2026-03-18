import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { User, Settings, Shield, Bell, Camera, Key, Save, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
  updateSecuritySettings,
  updateNotificationSettings,
  updateDashboardPreferences,
} from '../services/userService';
import {
  getEzploroInfo,
  updateEzploroInfo,
  patchEzploroInfo,
} from '../services/ezploroInfoService';

const UserManagementManager = () => {
  const navigate = useNavigate();
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
    website: '',
    username: '',
    lastname: '',
    display_name: '',
    lastname: '',
    profile_picture: '',
    banner_image: '',
    online_status: false, // Default to offline
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  


  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true,
    notifications_enabled: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
  });

  const [dashboardPreferences, setDashboardPreferences] = useState({
    theme: 'dark',
    language: 'es',
    timezone: 'Europe/Madrid',
    dateFormat: 'dd/MM/yyyy',
    defaultView: 'overview',
    dark_mode: false,
  });

  const [ezploroInfo, setEzploroInfo] = useState({
    correo: '',
    telefono: '',
    direccion: '',
    instagram: '',
    x: '',
    facebook: '',
    biografia: '',
    google_play_link: '',
    app_store_link: '',
    tiktok: '',
  });

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Try to get user from localStorage first
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('✅ UserManagement - Usuario cargado desde cache:', parsedUser);
            
            // Populate form with cached data
            setProfileForm(prev => ({
              ...prev,
              name: parsedUser.name || '',
              email: parsedUser.email || '',
              phone: parsedUser.phone || '',
              bio: parsedUser.bio || '',
              location: parsedUser.location || '',
              website: parsedUser.website || '',
              username: parsedUser.username || '',
              lastname: parsedUser.lastname || '',
              display_name: parsedUser.display_name || '',
              profile_picture: parsedUser.profile_picture || '',
              banner_image: parsedUser.banner_image || '',
              online_status: parsedUser.online_status || false,
            }));
            
            if (parsedUser.profile_picture) {
              setImagePreview(parsedUser.profile_picture);
            }
            
            setNotificationSettings({
              emailNotifications: parsedUser.notifications_enabled ?? true,
              pushNotifications: parsedUser.notifications_enabled ?? true,
              eventReminders: parsedUser.notifications_enabled ?? true,
              marketingEmails: false,
              securityAlerts: true,
              weeklyReports: true,
              notifications_enabled: parsedUser.notifications_enabled ?? true,
            });
            
            setDashboardPreferences({
              theme: parsedUser.dark_mode ? 'dark' : 'light',
              language: 'es',
              timezone: 'Europe/Madrid',
              dateFormat: 'dd/MM/yyyy',
              defaultView: 'overview',
              dark_mode: parsedUser.dark_mode ?? false,
            });
          } catch (error) {
            console.error('❌ Error parsing cached user:', error);
          }
        }
        
        // Try to fetch fresh user profile, but don't fail if it errors
        try {
          console.log('🔵 UserManagement - Intentando obtener perfil actualizado...');
          const userData = await getUserProfile();
          
          // Preserve online_status from cache if it exists
          const finalUserData = cachedUser ? {
            ...userData,
            online_status: JSON.parse(cachedUser).online_status ?? userData.online_status
          } : userData;
          
          setUser(finalUserData);
          localStorage.setItem('userId', finalUserData.user_id);
          localStorage.setItem('user', JSON.stringify(finalUserData));
          
          setProfileForm(prev => ({
            ...prev,
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            username: userData.username || '',
            lastname: userData.lastname || '',
            display_name: userData.display_name || '',
            profile_picture: userData.profile_picture || '',
            banner_image: userData.banner_image || '',
            online_status: finalUserData.online_status || false,
          }));
          
          if (userData.profile_picture) {
            setImagePreview(userData.profile_picture);
          }
          
          setNotificationSettings({
            emailNotifications: userData.notifications_enabled ?? true,
            pushNotifications: userData.notifications_enabled ?? true,
            eventReminders: userData.notifications_enabled ?? true,
            marketingEmails: false,
            securityAlerts: true,
            weeklyReports: true,
            notifications_enabled: userData.notifications_enabled ?? true,
          });
          
          setDashboardPreferences({
            theme: userData.dark_mode ? 'dark' : 'light',
            language: 'es',
            timezone: 'Europe/Madrid',
            dateFormat: 'dd/MM/yyyy',
            defaultView: 'overview',
            dark_mode: userData.dark_mode ?? false,
          });
          
          console.log('✅ UserManagement - Perfil actualizado desde el servidor');
        } catch (userError) {
          console.error('⚠️ UserManagement - Error al obtener perfil (usando cache):', userError);
          
          // Si hay un error y no hay cache, mostrar error y redirigir
          if (!cachedUser) {
            toast.error('No se pudo cargar el perfil de usuario. Por favor, inicia sesión nuevamente.');
            navigate('/login');
            return;
          }
          
          // Si hay cache, mostrar advertencia pero continuar
          toast.error('No se pudo actualizar el perfil. Usando datos guardados.', {
            duration: 3000,
          });
        }

        // Cargar información de Ezploro
        try {
          console.log('🔵 UserManagement - Cargando información de Ezploro...');
          const ezploroData = await getEzploroInfo();
          console.log('✅ UserManagement - Información de Ezploro cargada:', ezploroData);
          
          setEzploroInfo({
            correo: ezploroData.correo || '',
            telefono: ezploroData.telefono || '',
            direccion: ezploroData.direccion || '',
            instagram: ezploroData.instagram || '',
            x: ezploroData.x || '',
            facebook: ezploroData.facebook || '',
            biografia: ezploroData.biografia || '',
            google_play_link: ezploroData.google_play_link || '',
            app_store_link: ezploroData.app_store_link || '',
            tiktok: ezploroData.tiktok || '',
          });
        } catch (ezploroError) {
          console.error('⚠️ UserManagement - Error al cargar información de Ezploro:', ezploroError);
          // No es crítico, continuar sin esta información
        }
      } catch (error) {
        console.error('❌ Error loading user profile:', error);
        if (error.message.includes('No autorizado') || error.message.includes('No hay sesión activa')) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          navigate('/login');
        } else {
          toast.error(error.message || 'Error al cargar el perfil del usuario');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const updatedProfile = { 
        ...profileForm,
        online_status: profileForm.online_status
      };

      // Upload new profile picture if selected
      if (profileImage) {
        const imageUrl = await uploadProfilePicture(profileImage);
        updatedProfile.profile_picture = imageUrl;
      }

      const updatedUser = await updateUserProfile(updatedProfile);
      setUser(prev => ({
        ...prev,
        ...updatedUser
      }));
      
      // Update localStorage with the latest user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...currentUser,
        ...updatedUser
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      localStorage.setItem('userId', updatedUser.user_id || currentUser.user_id);
      
      // Trigger storage event for Dashboard to update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUserData)
      }));
      
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (
        error.message.includes('No autorizado') ||
        error.message.includes('No hay sesión activa') ||
        error.message.includes('No se encontró el ID de usuario')
      ) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Error al actualizar el perfil');
      }
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
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (
        error.message.includes('No autorizado') ||
        error.message.includes('No hay sesión activa')
      ) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Error al cambiar la contraseña');
      }
    } finally {
      setIsSaving(false);
    }
  };



  const handleNotificationSettingsChange = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
      notifications_enabled:
        setting === 'emailNotifications' || setting === 'pushNotifications'
          ? !prev[setting]
          : prev.notifications_enabled,
    }));
  };

  const handleSecuritySettingsChange = (setting, value) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleDashboardPreferenceChange = (setting, value) => {
    setDashboardPreferences((prev) => ({
      ...prev,
      [setting]: value,
      dark_mode: setting === 'theme' ? value === 'dark' : prev.dark_mode,
    }));
  };

  const handleSecuritySettingsSave = async () => {
    try {
      setIsSaving(true);
      await updateSecuritySettings(securitySettings);
      toast.success('Configuración de seguridad guardada');
    } catch (error) {
      console.error('Error saving security settings:', error);
      if (
        error.message.includes('No autorizado') ||
        error.message.includes('No hay sesión activa') ||
        error.message.includes('No se encontró el ID de usuario')
      ) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Error al guardar la configuración de seguridad');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    try {
      setIsSaving(true);
      await updateNotificationSettings(notificationSettings);
      toast.success('Configuración de notificaciones guardada');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      if (
        error.message.includes('No autorizado') ||
        error.message.includes('No hay sesión activa')
      ) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Error al guardar la configuración de notificaciones');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDashboardPreferencesSave = async () => {
    try {
      setIsSaving(true);
      await updateDashboardPreferences(dashboardPreferences);
      toast.success('Preferencias del panel guardadas');
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      if (
        error.message.includes('No autorizado') ||
        error.message.includes('No hay sesión activa') ||
        error.message.includes('No se encontró el ID de usuario')
      ) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Error al guardar las preferencias del panel');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for saving Ezploro info
  const handleSaveEzploroInfo = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      console.log('🔵 Guardando información de Ezploro:', ezploroInfo);
      await patchEzploroInfo(ezploroInfo);
      
      toast.success('Información de Ezploro actualizada exitosamente');
    } catch (error) {
      console.error('Error saving Ezploro info:', error);
      toast.error(error.message || 'Error al guardar la información de Ezploro');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for toggling online_status
  const handleOnlineStatusChange = async (checked) => {
    try {
      setIsSaving(true);
      const newStatus = checked;
      
      // Update local state immediately for better UX
      setProfileForm(prev => ({
        ...prev,
        online_status: newStatus
      }));
      
      // Update the backend with the new status
      const updatedUser = await updateUserProfile({
        ...profileForm,
        online_status: newStatus
      });
      
      // Update user state with the new status
      setUser(prev => ({
        ...prev,
        ...updatedUser
      }));
      
      // Update localStorage with the new status
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...currentUser,
        ...updatedUser
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Trigger storage event for Dashboard to update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUserData)
      }));
      
      // Show success message
      toast.success(`Estado actualizado: ${newStatus ? 'En línea' : 'Desconectado'}`);
      
    } catch (error) {
      console.error('Error updating online status:', error);
      toast.error('Error al actualizar el estado en línea');
      
      // Revert the change in the UI if there's an error
      setProfileForm(prev => ({
        ...prev,
        online_status: !newStatus
      }));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/4">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=96`} 
                      alt={user?.name || 'User'}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.name || 'User')}&background=7c3aed&color=fff&size=96`;
                      }}
                    />
                    <AvatarFallback>{(user?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
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
                <h3 className="text-lg font-medium">{user?.display_name || user?.name || 'Usuario'}</h3>
                <p className="text-sm text-muted-foreground">{user?.role || 'Usuario'}</p>
                <Badge variant={profileForm?.online_status ? 'default' : 'secondary'} className="mt-2">
                  {profileForm?.online_status ? 'En línea' : 'Desconectado'}
                </Badge>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-6"
                orientation="vertical"
              >
                <TabsList className="flex flex-col items-start space-y-2 h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="profile"
                    className="w-full justify-start data-[state=active]:bg-muted"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="w-full justify-start data-[state=active]:bg-muted"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Seguridad
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="w-full justify-start data-[state=active]:bg-muted"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notificaciones
                  </TabsTrigger>
                  <TabsTrigger
                    value="preferences"
                    className="w-full justify-start data-[state=active]:bg-muted"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Preferencias
                  </TabsTrigger>
                  <TabsTrigger
                    value="ezploro-info"
                    className="w-full justify-start data-[state=active]:bg-muted"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Info Ezploro
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Perfil</CardTitle>
                  <CardDescription>
                    Actualiza la información de tu perfil y configura tu dirección de correo electrónico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Apellido</Label>
                      <Input
                        id="lastname"
                        value={profileForm.lastname}
                        onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Nombre de usuario</Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Nombre para mostrar</Label>
                      <Input
                        id="display_name"
                        value={profileForm.display_name}
                        onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio web</Label>
                      <Input
                        id="website"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="online-status">Estado en línea</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="online-status"
                          checked={!!profileForm.online_status}
                          onCheckedChange={handleOnlineStatusChange}
                          disabled={isSaving}
                        />
                        <span className={profileForm.online_status ? 'text-green-400' : 'text-gray-400'}>
                          {profileForm.online_status ? 'En línea' : 'Desconectado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleProfileUpdate} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>


            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña. Asegúrate de que sea segura y no la compartas con nadie.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña actual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSaving}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={isSaving}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isSaving}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handlePasswordChange} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <Key className="mr-2 h-4 w-4" />
                            Cambiar contraseña
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seguridad de la cuenta</CardTitle>
                  <CardDescription>Configura las opciones de seguridad para tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Autenticación de dos factores</Label>
                      <p className="text-sm text-muted-foreground">
                        Añade una capa extra de seguridad a tu cuenta.
                      </p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        handleSecuritySettingsChange('twoFactorAuth', checked)
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="login-alerts">Alertas de inicio de sesión</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones cuando se detecte un inicio de sesión sospechoso.
                      </p>
                    </div>
                    <Switch
                      id="login-alerts"
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={(checked) => handleSecuritySettingsChange('loginAlerts', checked)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="session-timeout">Tiempo de espera de sesión</Label>
                      <p className="text-sm text-muted-foreground">
                        Tiempo de inactividad antes de cerrar la sesión automáticamente.
                      </p>
                    </div>
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => handleSecuritySettingsChange('sessionTimeout', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSecuritySettingsSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar configuración de seguridad'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de notificaciones</CardTitle>
                  <CardDescription>Personaliza cómo y cuándo recibes notificaciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Correo electrónico</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Notificaciones por correo</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe notificaciones importantes por correo electrónico.
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={() => handleNotificationSettingsChange('emailNotifications')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="event-reminders">Recordatorios de eventos</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe recordatorios antes de que comiencen los eventos.
                          </p>
                        </div>
                        <Switch
                          id="event-reminders"
                          checked={notificationSettings.eventReminders}
                          onCheckedChange={() => handleNotificationSettingsChange('eventReminders')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketing-emails">Correos de marketing</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe ofertas especiales y actualizaciones de productos.
                          </p>
                        </div>
                        <Switch
                          id="marketing-emails"
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={() => handleNotificationSettingsChange('marketingEmails')}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Notificaciones push</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-notifications">Notificaciones push</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe notificaciones en tiempo real en tu dispositivo.
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={() => handleNotificationSettingsChange('pushNotifications')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="security-alerts">Alertas de seguridad</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe alertas sobre actividad sospechosa en tu cuenta.
                          </p>
                        </div>
                        <Switch
                          id="security-alerts"
                          checked={notificationSettings.securityAlerts}
                          onCheckedChange={() => handleNotificationSettingsChange('securityAlerts')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-reports">Informes semanales</Label>
                          <p className="text-sm text-muted-foreground">
                            Recibe un resumen semanal de tu actividad.
                          </p>
                        </div>
                        <Switch
                          id="weekly-reports"
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={() => handleNotificationSettingsChange('weeklyReports')}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleNotificationSettingsSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar configuración de notificaciones'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias del panel</CardTitle>
                  <CardDescription>
                    Personaliza la apariencia y el comportamiento del panel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Apariencia</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="theme">Tema</Label>
                          <p className="text-sm text-muted-foreground">
                            Personaliza la apariencia del panel.
                          </p>
                        </div>
                        <Select
                          value={dashboardPreferences.theme}
                          onValueChange={(value) => handleDashboardPreferenceChange('theme', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Oscuro</SelectItem>
                            <SelectItem value="system">Sistema</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="language">Idioma</Label>
                          <p className="text-sm text-muted-foreground">
                            Selecciona tu idioma preferido.
                          </p>
                        </div>
                        <Select
                          value={dashboardPreferences.language}
                          onValueChange={(value) => handleDashboardPreferenceChange('language', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Zona horaria</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="timezone">Zona horaria</Label>
                          <p className="text-sm text-muted-foreground">
                            Configura tu zona horaria local.
                          </p>
                        </div>
                        <Select
                          value={dashboardPreferences.timezone}
                          onValueChange={(value) => handleDashboardPreferenceChange('timezone', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Seleccionar zona horaria" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="America/Mexico_City">(GMT-6) Ciudad de México</SelectItem>
                            <SelectItem value="America/Bogota">(GMT-5) Bogotá, Lima</SelectItem>
                            <SelectItem value="America/New_York">(GMT-4) Caracas, La Paz</SelectItem>
                            <SelectItem value="America/Argentina/Buenos_Aires">
                              (GMT-3) Buenos Aires, Santiago
                            </SelectItem>
                            <SelectItem value="America/Sao_Paulo">(GMT-3) Brasilia</SelectItem>
                            <SelectItem value="Europe/Madrid">(GMT+1) Madrid, Barcelona</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="date-format">Formato de fecha</Label>
                          <p className="text-sm text-muted-foreground">
                            Cómo se muestran las fechas en el panel.
                          </p>
                        </div>
                        <Select
                          value={dashboardPreferences.dateFormat}
                          onValueChange={(value) => handleDashboardPreferenceChange('dateFormat', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                            <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                            <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                            <SelectItem value="dd MMM, yyyy">DD MMM, AAAA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Vista predeterminada</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="default-view">Vista inicial</Label>
                          <p className="text-sm text-muted-foreground">
                            Qué página verás al iniciar sesión.
                          </p>
                        </div>
                        <Select
                          value={dashboardPreferences.defaultView}
                          onValueChange={(value) => handleDashboardPreferenceChange('defaultView', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar vista" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overview">Resumen</SelectItem>
                            <SelectItem value="events">Eventos</SelectItem>
                            <SelectItem value="analytics">Análisis</SelectItem>
                            <SelectItem value="reports">Informes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleDashboardPreferencesSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar preferencias'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ezploro Info Tab */}
            <TabsContent value="ezploro-info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Ezploro</CardTitle>
                  <CardDescription>
                    Gestiona la información de contacto y redes sociales de Ezploro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveEzploroInfo} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Información de Contacto</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ezploro-correo">Correo Electrónico</Label>
                          <Input
                            id="ezploro-correo"
                            type="email"
                            value={ezploroInfo.correo}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, correo: e.target.value })}
                            placeholder="contacto@ezploro.com"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ezploro-telefono">Teléfono</Label>
                          <Input
                            id="ezploro-telefono"
                            type="tel"
                            value={ezploroInfo.telefono}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, telefono: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="ezploro-direccion">Dirección</Label>
                          <Input
                            id="ezploro-direccion"
                            value={ezploroInfo.direccion}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, direccion: e.target.value })}
                            placeholder="Calle Principal 123, Ciudad"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="ezploro-biografia">Biografía</Label>
                          <Textarea
                            id="ezploro-biografia"
                            value={ezploroInfo.biografia}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, biografia: e.target.value })}
                            placeholder="Descripción de Ezploro..."
                            rows={4}
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-medium">Redes Sociales</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ezploro-instagram">Instagram</Label>
                          <Input
                            id="ezploro-instagram"
                            value={ezploroInfo.instagram}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, instagram: e.target.value })}
                            placeholder="@ezploro"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ezploro-facebook">Facebook</Label>
                          <Input
                            id="ezploro-facebook"
                            value={ezploroInfo.facebook}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, facebook: e.target.value })}
                            placeholder="facebook.com/ezploro"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ezploro-x">X (Twitter)</Label>
                          <Input
                            id="ezploro-x"
                            value={ezploroInfo.x}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, x: e.target.value })}
                            placeholder="@ezploro"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ezploro-tiktok">TikTok</Label>
                          <Input
                            id="ezploro-tiktok"
                            value={ezploroInfo.tiktok}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, tiktok: e.target.value })}
                            placeholder="@ezploro"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-medium">Enlaces de Aplicaciones</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ezploro-google-play">Google Play</Label>
                          <Input
                            id="ezploro-google-play"
                            value={ezploroInfo.google_play_link}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, google_play_link: e.target.value })}
                            placeholder="https://play.google.com/store/apps/..."
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ezploro-app-store">App Store</Label>
                          <Input
                            id="ezploro-app-store"
                            value={ezploroInfo.app_store_link}
                            onChange={(e) => setEzploroInfo({ ...ezploroInfo, app_store_link: e.target.value })}
                            placeholder="https://apps.apple.com/app/..."
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar información
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserManagementManager;