import { BASE_URL } from './config';

export const forgotPassword = async (email) => {
  try {
    console.log('Sending forgot password request to:', `${BASE_URL}/auth/forgot-password`);
    console.log('Email:', email);
    
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error response:', errorData);
      throw new Error(errorData.message || 'Error al enviar el correo');
    }

    const data = await response.json();
    console.log('Success response:', data);
    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const confirmPin = async (email, pin) => {
  try {
    console.log('Confirming PIN:', { email, pin });
    
    const response = await fetch(`${BASE_URL}/auth/confirm-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, pin }),
    });

    console.log('PIN confirmation response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('PIN error response:', errorData);
      throw new Error(errorData.message || 'Código inválido o expirado');
    }

    const data = await response.json();
    console.log('PIN success response:', data);
    return data;
  } catch (error) {
    console.error('Confirm PIN error:', error);
    throw error;
  }
};

export const resetPassword = async (email, newPassword, confirmPassword) => {
  try {
    console.log('Resetting password for:', email);
    
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword, confirmPassword }),
    });

    console.log('Reset password response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Reset password error response:', errorData);
      throw new Error(errorData.message || 'Error al restablecer la contraseña');
    }

    const data = await response.json();
    console.log('Reset password success response:', data);
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};