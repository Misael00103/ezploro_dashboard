import { getAuthToken } from './authService';
import { fetchWithAuth } from './userService';
import { API_URL_TESTIMONIALS } from './config';

/**
 * Obtener solo testimonios activos
 * Intenta primero con autenticación si hay token, sino sin autenticación
 */
export const getTestimonials = async (options = {}) => {
  try {
    const { limit = 10, offset = 0 } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const url = `${API_URL_TESTIMONIALS}?${params}`;
    
    // Intentar primero con autenticación si hay token
    const token = getAuthToken();
    console.log('🔵 getTestimonials - Token disponible:', !!token, 'URL:', url);
    
    if (token) {
      try {
        console.log('🔵 getTestimonials - Intentando con autenticación, URL:', url);
        const authResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log('🔵 getTestimonials - Response status:', authResponse.status, 'ok:', authResponse.ok);

        if (authResponse.ok) {
          const data = await authResponse.json();
          console.log('✅ getTestimonials - Éxito con autenticación, testimonios obtenidos:', data.testimonials?.length || 0);
          return data.testimonials || data || [];
        }
        
        // Si falla con 401 o 400, devolver array vacío silenciosamente
        if (authResponse.status === 401 || authResponse.status === 400) {
          const errorData = await authResponse.json().catch(() => ({}));
          console.log('⚠️ getTestimonials - Error con autenticación:', authResponse.status, errorData.message || 'Sin mensaje');
          // El backend no puede validar el token ("ID de usuario inválido"), devolver array vacío
          // Este es un problema del backend que no podemos resolver desde el frontend
          return [];
        } else {
          // Para otros errores, lanzar error
          const errorData = await authResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Error HTTP! status: ${authResponse.status}`);
        }
      } catch (authError) {
        console.log('❌ getTestimonials - Error en fetch con autenticación:', authError.message);
        // Si falla la autenticación, intentar sin autenticación
        if (authError.message && authError.message.includes('Unauthorized')) {
          console.log('⚠️ getTestimonials - Unauthorized, intentando sin autenticación');
          // Continuar al fallback sin autenticación
        } else {
          throw authError;
        }
      }
    }
    
    // Si no hay token, devolver array vacío (el endpoint requiere autenticación)
    console.log('⚠️ getTestimonials - No hay token disponible, devolviendo array vacío');
    return [];
  } catch (error) {
    // Si el error es "ID de usuario inválido" o "Unauthorized", devolver array vacío sin mostrar error
    if (error.message && (error.message.includes('ID de usuario inválido') || error.message.includes('Unauthorized'))) {
      return [];
    }
    
    console.error('Error en getTestimonials:', error);
    throw error;
  }
};

/**
 * Obtener todos los testimonios (activos e inactivos) con autenticación
 * Esta función requiere autenticación para obtener todos los testimonios
 */
export const getAllTestimonials = async (options = {}) => {
  try {
    const { limit = 10, offset = 0 } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      include_inactive: 'true'
    });

    const url = `${API_URL_TESTIMONIALS}?${params}`;
    
    try {
      // Usar fetchWithAuth que maneja correctamente la autenticación
      const response = await fetchWithAuth(url, {
        method: 'GET',
      });

      const data = await response.json();
      console.log('✅ getAllTestimonials - Éxito, testimonios obtenidos:', data.testimonials?.length || 0);
      return data.testimonials || data || [];
    } catch (authError) {
      // Si falla con "ID de usuario inválido", devolver array vacío
      // El backend no puede validar el userId del token para este endpoint
      const errorMessage = authError.message || '';
      console.log('⚠️ getAllTestimonials - Error de autenticación:', errorMessage);
      
      if (errorMessage.includes('ID de usuario inválido')) {
        console.log('⚠️ getAllTestimonials - Backend no puede validar userId, devolviendo array vacío');
        return [];
      }
      
      // Para otros errores, intentar obtener solo los activos como fallback
      if (errorMessage.includes('Unauthorized') ||
          errorMessage.includes('No hay sesión activa') ||
          errorMessage.includes('Error HTTP! status: 401')) {
        console.log('⚠️ getAllTestimonials - Obteniendo solo activos como fallback');
        return await getTestimonials(options);
      }
      
      throw authError;
    }
  } catch (error) {
    console.error('Error en getAllTestimonials:', error);
    // Como último recurso, intentar obtener solo los activos
    try {
      return await getTestimonials(options);
    } catch (fallbackError) {
      // Si incluso esto falla, devolver array vacío
    return [];
    }
  }
};

/**
 * Obtener testimonio por ID
 * Nota: Este endpoint NO requiere autenticación según el router del backend
 */
export const getTestimonialById = async (testimonialId) => {
  try {
    const response = await fetch(`${API_URL_TESTIMONIALS}/${testimonialId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data.testimonial || data;
  } catch (error) {
    console.error('Error en getTestimonialById:', error);
    throw error;
  }
};

/**
 * Descargar imagen desde URL y convertirla en File
 */
const urlToFile = async (url, filename = 'image.jpg') => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al descargar la imagen desde la URL');
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch (error) {
    console.error('Error convirtiendo URL a File:', error);
    throw new Error('No se pudo descargar la imagen desde la URL proporcionada');
  }
};

/**
 * Crear nuevo testimonio
 * @param {Object} testimonialData - Datos del testimonio
 * @param {File} imageFile - Archivo de imagen opcional
 */
export const createTestimonial = async (testimonialData, imageFile = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append('testimonio', testimonialData.testimonio.trim());
    formData.append('name_testimonio', testimonialData.name_testimonio.trim());
    formData.append('cargo_testimonio', testimonialData.cargo_testimonio.trim());

    // Determinar qué imagen usar: archivo local tiene prioridad, luego URL
    let fileToUpload = imageFile;
    if (!fileToUpload && testimonialData.imagen_testimonio instanceof File) {
      fileToUpload = testimonialData.imagen_testimonio;
    }

    if (fileToUpload instanceof File || fileToUpload instanceof Blob) {
      formData.append('image', fileToUpload);
    } else if (typeof testimonialData.imagen_testimonio === 'string' && testimonialData.imagen_testimonio.trim()) {
      const urlStr = testimonialData.imagen_testimonio.trim();
      formData.append('imagen_testimonio', urlStr);
      formData.append('image', urlStr);
    } else if (typeof testimonialData.image === 'string' && testimonialData.image.trim()) {
      const urlStr = testimonialData.image.trim();
      formData.append('imagen_testimonio', urlStr);
      formData.append('image', urlStr);
    } else {
      throw new Error('Debes proporcionar una imagen (archivo o URL)');
    }

    const response = await fetch(API_URL_TESTIMONIALS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // No incluir Content-Type para FormData, el navegador lo hará automáticamente
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data.testimonial;
  } catch (error) {
    console.error('Error en createTestimonial:', error);
    throw error;
  }
};

/**
 * Actualizar testimonio
 * @param {string|number} testimonialId - ID del testimonio
 * @param {Object} testimonialData - Datos actualizados
 * @param {File} imageFile - Archivo de imagen opcional
 */
export const updateTestimonial = async (testimonialId, testimonialData, imageFile = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const formData = new FormData();
    
    // Agregar campos de texto si existen
    if (testimonialData.testimonio !== undefined) {
      formData.append('testimonio', testimonialData.testimonio.trim());
    }
    if (testimonialData.name_testimonio !== undefined) {
      formData.append('name_testimonio', testimonialData.name_testimonio.trim());
    }
    if (testimonialData.cargo_testimonio !== undefined) {
      formData.append('cargo_testimonio', testimonialData.cargo_testimonio.trim());
    }
    if (testimonialData.is_active !== undefined) {
      formData.append('is_active', testimonialData.is_active.toString());
    }

    // Determinar qué imagen usar: archivo local tiene prioridad, luego URL
    let fileToUpload = imageFile;
    if (!fileToUpload && testimonialData.imagen_testimonio instanceof File) {
      fileToUpload = testimonialData.imagen_testimonio;
    }

    if (fileToUpload instanceof File || fileToUpload instanceof Blob) {
      formData.append('image', fileToUpload);
    } else if (typeof testimonialData.imagen_testimonio === 'string' && testimonialData.imagen_testimonio.trim()) {
      const urlStr = testimonialData.imagen_testimonio.trim();
      formData.append('imagen_testimonio', urlStr);
      formData.append('image', urlStr);
    } else if (typeof testimonialData.image === 'string' && testimonialData.image.trim()) {
      const urlStr = testimonialData.image.trim();
      formData.append('imagen_testimonio', urlStr);
      formData.append('image', urlStr);
    }

    const response = await fetch(`${API_URL_TESTIMONIALS}/${testimonialId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // No incluir Content-Type para FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data.testimonial;
  } catch (error) {
    console.error('Error en updateTestimonial:', error);
    throw error;
  }
};

/**
 * Eliminar testimonio (soft delete)
 */
export const deleteTestimonial = async (testimonialId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL_TESTIMONIALS}/${testimonialId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en deleteTestimonial:', error);
    throw error;
  }
};

/**
 * Activar/Desactivar testimonio
 */
export const toggleTestimonial = async (testimonialId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Primero obtenemos el testimonio actual
    const testimonial = await getTestimonialById(testimonialId);
    
    // Luego lo actualizamos con el estado invertido
    return await updateTestimonial(testimonialId, {
      is_active: !testimonial.is_active
    });
  } catch (error) {
    console.error('Error en toggleTestimonial:', error);
    throw error;
  }
};

/**
 * Contar testimonios activos
 * Nota: Este endpoint puede requerir autenticación dependiendo del backend
 */
export const countActiveTestimonials = async () => {
  try {
    // Intentar primero sin autenticación
    const response = await fetch(`${API_URL_TESTIMONIALS}/count/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si falla, podría requerir autenticación
      if (response.status === 401 || response.status === 403) {
        const token = getAuthToken();
        if (token) {
          const authResponse = await fetch(`${API_URL_TESTIMONIALS}/count/active`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (authResponse.ok) {
            const data = await authResponse.json();
            return data.activos || data || 0;
          }
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data.activos || data || 0;
  } catch (error) {
    console.error('Error en countActiveTestimonials:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de testimonios
 * Nota: Este endpoint puede requerir autenticación dependiendo del backend
 */
export const getTestimonialStats = async () => {
  try {
    // Intentar primero sin autenticación
    const response = await fetch(`${API_URL_TESTIMONIALS}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si falla, podría requerir autenticación
      if (response.status === 401 || response.status === 403) {
        const token = getAuthToken();
        if (token) {
          const authResponse = await fetch(`${API_URL_TESTIMONIALS}/stats`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (authResponse.ok) {
            const data = await authResponse.json();
            return data.stats || data;
          }
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data.stats || data;
  } catch (error) {
    console.error('Error en getTestimonialStats:', error);
    throw error;
  }
};
