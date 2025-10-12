import { 
  BASE_URL,
  BASE_URL_IMAGE 
} from './config';

const API_URL = BASE_URL;

/**
 * Obtiene la configuración completa del usuario actual
 * @returns {Promise<Object>} Configuración del usuario
 */
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener el perfil del usuario');
    }

    return data.data;
  } catch (error) {
    console.error('Error en userService.getUserProfile:', error);
    throw error;
  }
};

/**
 * Actualiza la configuración del usuario
 * @param {Object} userData - Datos del usuario a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUserProfile = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar el perfil');
    }

    // Actualizar los datos del usuario en localStorage si se actualizó el perfil
    if (data.data) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.data }));
    }

    return data.data;
  } catch (error) {
    console.error('Error en userService.updateUserProfile:', error);
    throw error;
  }
};

/**
 * Sube una imagen de perfil
 * @param {File} file - Archivo de imagen a subir
 * @returns {Promise<string>} URL de la imagen subida
 */
export const uploadProfilePicture = async (file) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await fetch(`${API_URL}/user/upload-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al subir la imagen');
    }

    return data.data.url;
  } catch (error) {
    console.error('Error en userService.uploadProfilePicture:', error);
    throw error;
  }
};

/**
 * Cambia la contraseña del usuario
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<Object>} Resultado de la operación
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar la contraseña');
    }

    return data;
  } catch (error) {
    console.error('Error en userService.changePassword:', error);
    throw error;
  }
};
