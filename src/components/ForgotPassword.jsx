import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, ArrowLeft, Key, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { forgotPassword, confirmPin, resetPassword } from '../services/passwordService';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    console.log('handleSendCode triggered, email:', email); // Debug: Confirm function is called

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      console.log('Invalid email:', email); // Debug: Log invalid email
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    console.log('isLoading set to true'); // Debug: Track loading state

    try {
      const result = await forgotPassword(email);
      console.log('forgotPassword result:', result); // Debug: Log API response
      toast.success('Código enviado a tu correo');
      setStep(2);
    } catch (error) {
      console.error('Error in forgotPassword:', error); // Debug: Log full error
      toast.error(error.message || 'Error al enviar el código');
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false'); // Debug: Confirm loading reset
    }
  };

  
  const handleConfirmPin = async (e) => {
    e.preventDefault();
    console.log('handleConfirmPin triggered, pin:', pin); // Debug
    setIsLoading(true);
    console.log('isLoading set to true');

    try {
      await confirmPin(email, pin);
      toast.success('Código confirmado');
      setStep(3);
    } catch (error) {
      console.error('Error in confirmPin:', error);
      toast.error(error.message || 'Error al confirmar el código');
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    console.log('handleResetPassword triggered'); // Debug

    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match'); // Debug
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    console.log('isLoading set to true');

    try {
      await resetPassword(email, newPassword, confirmPassword);
      toast.success('Contraseña restablecida exitosamente');
      onBack();
    } catch (error) {
      console.error('Error in resetPassword:', error);
      toast.error(error.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-black/40 border-purple-500/30">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center">
          <img 
            src={require('../img/logoezploro.png')} 
            alt="Ezploro Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <CardTitle className="text-white">
          {step === 1 && 'Recuperar Contraseña'}
          {step === 2 && 'Confirmar Código'}
          {step === 3 && 'Nueva Contraseña'}
        </CardTitle>
        <CardDescription className="text-purple-300">
          {step === 1 && 'Ingresa tu correo para recibir el código'}
          {step === 2 && 'Ingresa el código enviado a tu correo'}
          {step === 3 && 'Crea tu nueva contraseña'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-200">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-500/30 text-white"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
              onClick={() => console.log('Button clicked')} // Debug: Confirm button click
            >
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleConfirmPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-purple-200">Código de verificación</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  id="pin"
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-500/30 text-white"
                  placeholder="123456"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Confirmar Código'}
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-purple-200">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-purple-200">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={isLoading}
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
          </form>
        )}

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-purple-300 hover:bg-purple-900/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio de sesión
        </Button>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;