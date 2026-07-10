import { API_URL_OFFERS, API_URL_OFFERS_ACTIVE, API_URL_OFFERS_BY_ID, API_URL_OFFERS_VALIDATE_PROMO, API_URL_OFFERS_USE_PROMO } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const offerService = {
  // Helper para obtener headers con token
  async getHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  },
  // Obtener todas las ofertas
  async getOffers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_URL_OFFERS}?${queryString}` : API_URL_OFFERS;
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  },

  // Obtener ofertas activas
  async getActiveOffers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_URL_OFFERS_ACTIVE}?${queryString}` : API_URL_OFFERS_ACTIVE;
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching active offers:', error);
      throw error;
    }
  },

  // Obtener oferta por ID
  async getOfferById(id) {
    try {
      const url = API_URL_OFFERS_BY_ID.replace(':id', id);
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching offer by ID:', error);
      throw error;
    }
  },

  // Validar código promocional
  async validatePromoCode(promoCode) {
    try {
      const url = API_URL_OFFERS_VALIDATE_PROMO.replace(':promo_code', promoCode);
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating promo code:', error);
      throw error;
    }
  },

  // Usar código promocional
  async usePromoCode(promoCode, userId) {
    try {
      const url = API_URL_OFFERS_USE_PROMO.replace(':promo_code', promoCode);
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error using promo code:', error);
      throw error;
    }
  }
};

export default offerService;