import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { login } from '../services/authService';

const API_URL = process.env.REACT_APP_API_URL || 'https://api-v3-backend-ezploro.apps.ezploro.com/api';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      if (!data.data || !data.data.token) {
        throw new Error('No se recibió un token de autenticación');
      }

      // Store user data and token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      onLogin(data.data.user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setCredentials({
      email: 'admin@scapeevents.com',
      password: 'admin123'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-purple-800">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <Card className="w-full max-w-md mx-4 relative z-10 bg-black/80 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Scape Events Dashboard
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
                placeholder="admin@scapeevents.com"
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

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={fillDemoCredentials}
              className="text-purple-300 hover:text-purple-200 hover:bg-purple-900/30"
            >
              Usar credenciales de demo
            </Button>
          </div>

          <div className="text-xs text-purple-300 text-center space-y-1">
            <p><strong>Demo:</strong> admin@scapeevents.com</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;