import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import contactService from '../services/contactService';

/**
 * Hook personalizado para manejar funcionalidades de contacto
 */
export const useContact = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState(null);

  /**
   * Enviar mensaje de contacto
   * @param {object} contactData - Datos del contacto
   * @param {function} onSuccess - Callback ejecutado en caso de éxito
   * @param {function} onError - Callback ejecutado en caso de error
   */
  const sendContactMessage = useCallback(async (contactData, onSuccess = null, onError = null) => {
    if (!token) {
      Alert.alert("Authentication Required", "You must be logged in to send a contact message");
      return false;
    }

    // Validar datos
    const validation = contactService.validateContactData(contactData);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      if (onError) {
        onError(new Error(errorMessage));
      } else {
        Alert.alert("Validation Error", errorMessage);
      }
      return false;
    }

    setLoading(true);
    try {
      console.log('📧 Sending contact message via hook');
      
      const result = await contactService.sendContactMessage(token, contactData);
      
      console.log('✅ Contact message sent successfully via hook');
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        Alert.alert("Success", "Your message has been sent successfully!");
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sending contact message via hook:', error);
      
      const errorMessage = error.message || "Failed to send message";
      
      // Si es un error de servicio no disponible, ofrecer alternativa de email
      if (errorMessage.includes('Contact form is temporarily unavailable')) {
        Alert.alert(
          "Service Unavailable", 
          errorMessage,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Send Email", 
              onPress: async () => {
                try {
                  const emailUrl = contactService.createEmailFallback(contactData);
                  console.log('📧 Opening email client with URL:', emailUrl);
                  await Linking.openURL(emailUrl);
                } catch (linkError) {
                  console.error('❌ Error opening email client:', linkError);
                  Alert.alert("Error", "Could not open email client. Please send your message to: support@ezploro.com");
                }
              }
            }
          ]
        );
      } else {
        if (onError) {
          onError(error);
        } else {
          Alert.alert("Error", errorMessage);
        }
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Obtener lista de contactos (Admin)
   * @param {object} filters - Filtros de búsqueda
   */
  const fetchContacts = useCallback(async (filters = {}) => {
    if (!token) {
      console.warn('No token available for fetching contacts');
      return;
    }

    setLoading(true);
    try {
      console.log('📋 Fetching contacts via hook');
      
      const result = await contactService.getContacts(token, filters);
      
      setContacts(result.contacts || []);
      
      console.log(`✅ Fetched ${result.contacts?.length || 0} contacts via hook`);
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching contacts via hook:', error);
      Alert.alert("Error", "Failed to load contacts");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Actualizar estado de contacto (Admin)
   * @param {number} contactId - ID del contacto
   * @param {string} status - Nuevo estado
   */
  const updateContactStatus = useCallback(async (contactId, status) => {
    if (!token) {
      Alert.alert("Error", "You must be logged in to update contact status");
      return false;
    }

    setLoading(true);
    try {
      console.log(`📝 Updating contact ${contactId} status to ${status} via hook`);
      
      const result = await contactService.updateContactStatus(token, contactId, status);
      
      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.contact_id === contactId 
          ? { ...contact, status } 
          : contact
      ));
      
      console.log('✅ Contact status updated successfully via hook');
      
      return true;
    } catch (error) {
      console.error('❌ Error updating contact status via hook:', error);
      Alert.alert("Error", error.message || "Failed to update contact status");
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Obtener estadísticas de newsletter (Admin)
   */
  const fetchNewsletterStats = useCallback(async () => {
    if (!token) {
      console.warn('No token available for fetching newsletter stats');
      return;
    }

    setLoading(true);
    try {
      console.log('📊 Fetching newsletter stats via hook');
      
      const result = await contactService.getNewsletterStats(token);
      
      setNewsletterStats(result.stats);
      
      console.log('✅ Newsletter stats fetched successfully via hook');
      
      return result.stats;
    } catch (error) {
      console.error('❌ Error fetching newsletter stats via hook:', error);
      Alert.alert("Error", "Failed to load newsletter statistics");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Validar email
   * @param {string} email - Email a validar
   * @returns {boolean} - true si es válido
   */
  const validateEmail = useCallback((email) => {
    return contactService.validateEmail(email);
  }, []);

  /**
   * Validar datos de contacto
   * @param {object} contactData - Datos a validar
   * @returns {object} - { isValid: boolean, errors: string[] }
   */
  const validateContactData = useCallback((contactData) => {
    return contactService.validateContactData(contactData);
  }, []);

  return {
    loading,
    contacts,
    newsletterStats,
    sendContactMessage,
    fetchContacts,
    updateContactStatus,
    fetchNewsletterStats,
    validateEmail,
    validateContactData,
  };
};

export default useContact;