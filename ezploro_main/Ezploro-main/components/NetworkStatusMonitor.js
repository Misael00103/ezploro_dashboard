import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import NetworkErrorAlert from './NetworkErrorAlert';
import AutoReconnect from './AutoReconnect';
import ConnectionLoadingScreen from './ConnectionLoadingScreen';
import { API_URL_AUTH_LOGIN } from '../config';

const NetworkStatusMonitor = ({ children }) => {
  console.log('🔍 NetworkStatusMonitor: Componente cargado, verificando async/await...');
  const [isConnected, setIsConnected] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionMessage, setConnectionMessage] = useState('Verificando conexión...');

  // Verificar si el servidor está disponible
  const checkServerReachability = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(API_URL_AUTH_LOGIN, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setIsServerReachable(true);
      setShowAlert(false);
    } catch (error) {
      console.warn('❌ Error al verificar servidor:', error.message);
      setIsServerReachable(false);
      setAlertMessage('No se puede conectar al servidor. Verifica tu conexión a internet o inténtalo más tarde.');
      setShowAlert(true);
    }
  }, []);

  // Manejar cambios en la conectividad
  const handleConnectivityChange = useCallback((state) => {
    const { isConnected: connected, isInternetReachable } = state;
    
    setIsConnected(connected);
    
    if (!connected) {
      setAlertMessage('Sin conexión a internet. Conéctate a una red para continuar.');
      setShowAlert(true);
    } else if (connected && isInternetReachable === false) {
      setAlertMessage('Conexión limitada. Verifica tu acceso a internet.');
      setShowAlert(true);
    } else if (connected && isInternetReachable) {
      // Si hay conexión a internet, verificar si el servidor está disponible
      checkServerReachability();
    }
  }, [checkServerReachability]);

  // Manejar cambios en el estado de la aplicación (primer plano/fondo)
  const handleAppStateChange = useCallback((nextAppState) => {
    if (nextAppState === 'active') {
      // La app volvió al primer plano, verificar conectividad
      NetInfo.fetch().then(handleConnectivityChange);
    }
  }, [handleConnectivityChange]);

  // Configurar listeners para cambios de conectividad y estado de la app
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(handleConnectivityChange);
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Verificar conectividad inicial
    NetInfo.fetch().then(state => {
      handleConnectivityChange(state);
      // Después de la verificación inicial, ocultamos la pantalla de carga
      setTimeout(() => {
        setIsInitializing(false);
      }, 1500); // Pequeño retraso para evitar parpadeos
    });
    
    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [handleConnectivityChange, handleAppStateChange]);

  // Manejar reintentos
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setShowAlert(false);
    
    // Verificar conectividad nuevamente
    NetInfo.fetch().then(handleConnectivityChange);
  }, [handleConnectivityChange]);

  // Manejar reconexión exitosa
  const handleReconnectSuccess = useCallback(() => {
    setIsServerReachable(true);
    setShowAlert(false);
    // Refrescar datos de la aplicación si es necesario
    console.log('✅ Reconexión exitosa');
  }, []);

  // Actualizar mensaje de conexión según el estado
  useEffect(() => {
    if (!isConnected) {
      setConnectionMessage('Esperando conexión a internet...');
    } else if (!isServerReachable) {
      setConnectionMessage('Intentando conectar con el servidor...');
    } else {
      setConnectionMessage('Conectando...');
    }
  }, [isConnected, isServerReachable]);

  return (
    <>
      {children}
      <NetworkErrorAlert 
        visible={showAlert && !isInitializing} 
        message={alertMessage}
        onRetry={handleRetry}
        onDismiss={() => setShowAlert(false)}
        autoHideDuration={0} // No ocultar automáticamente para problemas de red
      />
      <AutoReconnect 
        onReconnect={handleReconnectSuccess}
        maxAttempts={5}
      />
      <ConnectionLoadingScreen 
        isVisible={isInitializing} 
        message={connectionMessage} 
      />
    </>
  );
};

export default NetworkStatusMonitor;