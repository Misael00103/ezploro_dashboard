import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { API_URL_AUTH_LOGIN } from '../config';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AutoReconnect = ({ onReconnect, maxAttempts = 5, initialDelay = 5000 }) => {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [showComponent, setShowComponent] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectMessage, setReconnectMessage] = useState('Verificando conexión...');
  const [nextRetryTime, setNextRetryTime] = useState(0);

  // Verificar si el servidor está disponible
  const checkServerReachability = useCallback(async () => {
    try {
      setReconnectMessage('Conectando al servidor...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(API_URL_AUTH_LOGIN, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setIsServerReachable(true);
      setReconnectMessage('Conexión restablecida');
      
      // Pequeño retraso para mostrar el mensaje de éxito y luego ocultar el componente
      setTimeout(() => {
        if (onReconnect) onReconnect();
        setShowComponent(false);
        setAttempts(0);
        setReconnecting(false);
      }, 1500);
      
      return true;
    } catch (error) {
      console.log('❌ Servidor no disponible:', error);
      setIsServerReachable(false);
      setReconnectMessage('No se puede conectar al servidor');
      setReconnecting(false);
      return false;
    }
  }, [onReconnect]);

  // Manejar cambios de conectividad
  const handleConnectivityChange = useCallback(async (state) => {
    setIsConnected(state.isConnected);
    
    if (state.isConnected) {
      // Si hay internet, verificar si el servidor está disponible
      await checkServerReachability();
    } else {
      setIsServerReachable(false);
      setReconnectMessage('Sin conexión a internet');
      setReconnecting(false);
    }
  }, [checkServerReachability]);

  // Suscribirse a cambios de conectividad
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    
    // Verificar conectividad inicial
    NetInfo.fetch().then(handleConnectivityChange);
    
    return () => {
      unsubscribe();
    };
  }, [handleConnectivityChange]);

  // Obtener mensaje según el estado de conexión
  const getReconnectMessage = useCallback(() => {
    if (!isConnected) {
      return 'Sin conexión a internet';
    } else if (!isServerReachable) {
      return 'No se puede conectar al servidor';
    }
    return 'Reconectando...';
  }, [isConnected, isServerReachable]);

  // Intentar reconexión automática
  useEffect(() => {
    let reconnectTimer;
    
    if (!isConnected || !isServerReachable) {
      // Mostrar el componente después de un retraso inicial
      setTimeout(() => {
        if (!isConnected || !isServerReachable) {
          setShowComponent(true);
        }
      }, initialDelay);
      
      if (attempts < maxAttempts && !reconnecting) {
        // Intentar reconectar cada 5 segundos (aumentando el tiempo con cada intento)
        const delay = Math.min(5000 * (attempts + 1), 30000);
        setReconnectMessage(getReconnectMessage());
        
        // Establecer el tiempo para el próximo intento
        setNextRetryTime(Date.now() + delay);
        
        reconnectTimer = setTimeout(() => {
          setReconnecting(true);
          setAttempts(prev => prev + 1);
          NetInfo.fetch().then(handleConnectivityChange);
        }, delay);
      }
    } else {
      // Si la conexión se ha restablecido, asegurarse de que el componente se oculte
      setShowComponent(false);
    }
    
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [isConnected, isServerReachable, attempts, maxAttempts, reconnecting, handleConnectivityChange, initialDelay, getReconnectMessage]);

  // Calcular tiempo restante para el próximo intento
  const getTimeRemaining = () => {
    const remaining = Math.max(0, nextRetryTime - Date.now());
    return Math.ceil(remaining / 1000);
  };

  // Actualizar contador de tiempo
  useEffect(() => {
    if (!showComponent) return;
    
    const timer = setInterval(() => {
      if (getTimeRemaining() <= 0) {
        clearInterval(timer);
      } else {
        // Forzar actualización del componente
        setNextRetryTime(prev => prev);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showComponent, nextRetryTime]);
  
  // Efecto para ocultar el componente cuando la conexión se restablece
  useEffect(() => {
    if (isConnected && isServerReachable) {
      // Asegurarse de que el componente se oculte después de un breve retraso
      const hideTimer = setTimeout(() => {
        setShowComponent(false);
      }, 2000);
      
      return () => clearTimeout(hideTimer);
    }
  }, [isConnected, isServerReachable]);

  // Manejar reconexión manual
  const handleManualReconnect = () => {
    setAttempts(0);
    setReconnecting(true);
    setReconnectMessage('Verificando conexión...');
    NetInfo.fetch().then(handleConnectivityChange);
  };

  // No mostrar el componente si no es necesario
  if (!showComponent || (isConnected && isServerReachable && !reconnecting)) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.content}>
        {reconnecting ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.icon} />
        ) : (
          <Ionicons 
            name={isConnected ? (isServerReachable ? "checkmark-circle" : "server-outline") : "cloud-offline-outline"} 
            size={24} 
            color={isConnected && isServerReachable ? theme.colors.success : theme.colors.error} 
            style={styles.icon}
          />
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {reconnectMessage}
          </Text>
          
          {!reconnecting && (attempts < maxAttempts) && (!isConnected || !isServerReachable) && (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Reintentando en {getTimeRemaining()} segundos...
            </Text>
          )}
          
          {!reconnecting && (attempts >= maxAttempts) && (!isConnected || !isServerReachable) && (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              No se pudo reconectar automáticamente
            </Text>
          )}
        </View>
        
        {!reconnecting && (!isConnected || !isServerReachable) && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleManualReconnect}
            disabled={reconnecting}
          >
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AutoReconnect;