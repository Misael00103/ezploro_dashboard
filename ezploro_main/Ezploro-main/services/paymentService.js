import {
  API_URL_PAYMENTS_PROMOCION_CHECKOUT,
  API_URL_PAYMENTS_PROMOCION_PRICES,
  API_URL_PAYMENTS_PROMOCION_SUCCESS,
  API_URL_PAYMENTS_PROMOCION_CANCEL
} from '../config.js';

class PaymentService {
  // Obtener precios de promoción según tu controlador
  async getPromotionPrices(moneda = 'USD') {
    try {
      const response = await fetch(`${API_URL_PAYMENTS_PROMOCION_PRICES}?moneda=${moneda}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching promotion prices:', error);
      throw error;
    }
  }

  // Crear checkout de promoción según tu controlador
  async createPromotionCheckout(paymentData) {
    try {
      const response = await fetch(API_URL_PAYMENTS_PROMOCION_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duracion: paymentData.duracion,
          plan: paymentData.plan,
          eventoId: paymentData.eventoId,
          eventoNombre: paymentData.eventoNombre,
          moneda: paymentData.moneda || 'USD',
          metodo_pago: paymentData.metodo_pago || 'stripe'
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating promotion checkout:', error);
      throw error;
    }
  }

  // Procesar éxito del pago
  async handlePaymentSuccess(sessionId, paymentMethod) {
    try {
      const url = `${API_URL_PAYMENTS_PROMOCION_SUCCESS}?session_id=${sessionId}&payment_method=${paymentMethod}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Procesar cancelación del pago
  async handlePaymentCancel(sessionId, paymentMethod) {
    try {
      const url = `${API_URL_PAYMENTS_PROMOCION_CANCEL}?session_id=${sessionId}&payment_method=${paymentMethod}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling payment cancel:', error);
      throw error;
    }
  }
}

export default new PaymentService();