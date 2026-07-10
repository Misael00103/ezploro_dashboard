import {
  API_URL_CONTACT_CREATE,
  API_URL_CONTACT_LIST,
  API_URL_CONTACT_UPDATE_STATUS,
  API_URL_NEWSLETTER_STATS,
} from '../config';

class ContactService {
  /**
   * Enviar mensaje de contacto
   * @param {string} token - Token de autenticación
   * @param {object} contactData - Datos del contacto
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async sendContactMessage(token, contactData) {
    try {
      console.log('📧 Enviando mensaje de contacto:', {
        name: contactData.name,
        email: contactData.email,
        newsletter: contactData.newsletter,
        messageLength: contactData.message?.length || 0
      });

      console.log('🔗 Contact URL:', API_URL_CONTACT_CREATE);

      // El backend requiere autenticación para todos los endpoints de contacto
      if (!token) {
        throw new Error('Authentication required: You must be logged in to send a contact message');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(API_URL_CONTACT_CREATE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: contactData.name.trim(),
          email: contactData.email.trim().toLowerCase(),
          message: contactData.message.trim(),
          newsletter: Boolean(contactData.newsletter),
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Leer la respuesta como texto primero
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Si no puede parsear JSON, probablemente es HTML (error del servidor)
        console.error('❌ Server returned HTML instead of JSON:', responseText.substring(0, 200));
        
        // Detectar errores específicos
        if (responseText.includes('Cannot POST /api/contact')) {
          throw new Error('Contact service is not available. The contact endpoint is not configured on the server.');
        } else if (response.status === 404) {
          throw new Error('Contact service not found. Please contact the administrator.');
        } else {
          throw new Error(`Server error: Expected JSON but received HTML. Status: ${response.status}`);
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Mensaje de contacto enviado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error enviando mensaje de contacto:', error);
      
      // Si el endpoint no está disponible, ofrecer alternativas
      if (error.message.includes('Contact service is not available') || 
          error.message.includes('Contact service not found')) {
        throw new Error('Contact form is temporarily unavailable. Please send your message directly to: support@ezploro.com');
      }
      
      throw error;
    }
  }

  /**
   * Crear mensaje de email como fallback
   * @param {object} contactData - Datos del contacto
   * @returns {string} - Mensaje formateado para email
   */
  createEmailFallback(contactData) {
    const subject = encodeURIComponent('Contact Form Message - Ezploro App');
    const body = encodeURIComponent(
      `Name: ${contactData.name}\n` +
      `Email: ${contactData.email}\n` +
      `Newsletter Subscription: ${contactData.newsletter ? 'Yes' : 'No'}\n\n` +
      `Message:\n${contactData.message}`
    );
    
    return `mailto:support@ezploro.com?subject=${subject}&body=${body}`;
  }

  /**
   * Obtener lista de contactos (Admin)
   * @param {string} token - Token de autenticación
   * @param {object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Lista de contactos
   */
  async getContacts(token, filters = {}) {
    try {
      console.log('📋 Obteniendo contactos con filtros:', filters);

      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const url = `${API_URL_CONTACT_LIST}?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Obtenidos ${data.contacts?.length || 0} contactos`);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo contactos:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de contacto (Admin)
   * @param {string} token - Token de autenticación
   * @param {number} contactId - ID del contacto
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>} Contacto actualizado
   */
  async updateContactStatus(token, contactId, status) {
    try {
      console.log(`📝 Actualizando estado del contacto ${contactId} a: ${status}`);

      const url = API_URL_CONTACT_UPDATE_STATUS.replace(':id', contactId);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Estado del contacto actualizado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error actualizando estado del contacto:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de newsletter (Admin)
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>} Estadísticas del newsletter
   */
  async getNewsletterStats(token) {
    try {
      console.log('📊 Obteniendo estadísticas de newsletter');

      const response = await fetch(API_URL_NEWSLETTER_STATS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Estadísticas de newsletter obtenidas:', data.stats);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de newsletter:', error);
      throw error;
    }
  }

  /**
   * Validar formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} - true si es válido, false si no
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar datos de contacto
   * @param {object} contactData - Datos a validar
   * @returns {object} - { isValid: boolean, errors: string[] }
   */
  validateContactData(contactData) {
    const errors = [];

    if (!contactData.name || contactData.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!contactData.email || contactData.email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!this.validateEmail(contactData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!contactData.message || contactData.message.trim().length === 0) {
      errors.push('Message is required');
    } else if (contactData.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new ContactService();