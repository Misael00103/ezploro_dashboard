import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { login } from '../services/authService';
import { debugAuthState } from '../services/authUtils';
import ForgotPassword from './ForgotPassword';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://api-v3-backend-ezploro.apps.ezploro.com/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

     /// if (!response.ok) {
      //  throw new Error(data.message || 'Credenciales inválidas');
     // }
      
      const data = await response.json();
      console.log(data);
      if (!data.user || !data.token) {
        throw new Error('No se recibió un token de autenticación');
      }
      
      // Store user data and token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Store user ID with multiple fallbacks
      const userId = data.user.user_id || data.user.id || data.user.id;
      if (userId) {
        localStorage.setItem('userId', userId);
      } else {
        console.warn('No user ID found in login response');
      }
      
      // Debug authentication state after login
      debugAuthState();
      
      onLogin(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };



  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-purple-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <Toaster position="top-right" />
        <ForgotPassword onBack={() => setShowForgotPassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-purple-800">
      <div className="absolute inset-0 bg-black/20"></div>
      <Toaster position="top-right" />
      
      <Card className="w-full max-w-md mx-4 relative z-10 bg-black/80 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-32 h-32 rounded-full flex items-center justify-center">
            <img 
              src={require('../img/logoezploro.png')} 
              alt="Ezploro Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Ezploro Dashboard
          </CardTitle>
          <CardDescription className="text-purple-200">
            Ingresa tus credenciales para acceder al panel de administración
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-purple-300 focus:border-purple-400"
                placeholder="Ingresa tu email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-200">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-purple-300 focus:border-purple-400 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-900/50 border-red-500/30">
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          
          <Button
            variant="ghost"
            onClick={() => setShowForgotPassword(true)}
            className="w-full text-purple-300 hover:bg-purple-900/50"
          >
            ¿Olvidaste tu contraseña?
          </Button>


        </CardContent>
      </Card>
    </div>
  );
};

export default Login;