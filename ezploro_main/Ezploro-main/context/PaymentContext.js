import React, { createContext, useContext, useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import { useAuth } from './AuthContext';

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const [prices, setPrices] = useState({
    monthly: 15.99,
    yearly: 99.99
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Cargar precios al inicializar
  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const response = await paymentService.getPromotionPrices();
      if (response.success) {
        setPrices(response.prices);
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const createCheckout = async (plan, paymentMethod = 'stripe') => {
    if (!user) {
      throw new Error('User must be logged in to create checkout');
    }

    setIsLoading(true);
    try {
      const paymentData = {
        plan,
        userId: user.id,
        paymentMethod,
        successUrl: 'app://payment/success',
        cancelUrl: 'app://payment/cancel'
      };

      const response = await paymentService.createPromotionCheckout(paymentData);
      
      if (response.success) {
        setPaymentStatus('checkout_created');
        return response;
      } else {
        throw new Error(response.message || 'Failed to create checkout');
      }
    } catch (error) {
      setPaymentStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (sessionId, paymentMethod) => {
    setIsLoading(true);
    try {
      const response = await paymentService.handlePaymentSuccess(sessionId, paymentMethod);
      
      if (response.success) {
        setPaymentStatus('success');
        return response;
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (error) {
      setPaymentStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCancel = async (sessionId, paymentMethod) => {
    try {
      const response = await paymentService.handlePaymentCancel(sessionId, paymentMethod);
      setPaymentStatus('cancelled');
      return response;
    } catch (error) {
      setPaymentStatus('error');
      throw error;
    }
  };

  const resetPaymentStatus = () => {
    setPaymentStatus(null);
  };

  const value = {
    prices,
    isLoading,
    paymentStatus,
    createCheckout,
    handlePaymentSuccess,
    handlePaymentCancel,
    resetPaymentStatus,
    loadPrices
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};