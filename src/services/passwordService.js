import { BASE_URL } from './config';

export const forgotPassword = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al enviar el correo');
  }

  return response.json();
};

export const confirmPin = async (email, pin) => {
  const response = await fetch(`${BASE_URL}/auth/confirm-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, pin }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Código inválido o expirado');
  }

  return response.json();
};

export const resetPassword = async (email, newPassword, confirmPassword) => {
  const response = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, newPassword, confirmPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al restablecer la contraseña');
  }

  return response.json();
};