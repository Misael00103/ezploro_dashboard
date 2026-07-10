import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const NetworkErrorAlert = ({ visible, message, onRetry, onDismiss, autoHideDuration = 5000, type = 'error' }) => {
  const { theme } = useTheme();
  const [animation] = useState(new Animated.Value(0));
  const hideTimeout = useRef(null);
  
  useEffect(() => {
    if (visible) {
      // Mostrar alerta
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
      
      // Auto ocultar después de un tiempo si se proporciona duración
      if (autoHideDuration > 0 && onDismiss) {
        hideTimeout.current = setTimeout(() => {
          hideAlert();
        }, autoHideDuration);
        return () => clearTimeout(hideTimeout.current);
      }
    } else {
      // Ocultar alerta
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  // Determinar el icono y color según el tipo de alerta
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: theme.colors.success,
          backgroundColor: theme.colors.successLight || 'rgba(46, 204, 113, 0.1)'
        };
      case 'warning':
        return {
          icon: 'warning',
          color: theme.colors.warning || '#F39C12',
          backgroundColor: theme.colors.warningLight || 'rgba(243, 156, 18, 0.1)'
        };
      case 'info':
        return {
          icon: 'information-circle',
          color: theme.colors.info || '#3498DB',
          backgroundColor: theme.colors.infoLight || 'rgba(52, 152, 219, 0.1)'
        };
      case 'error':
      default:
        return {
          icon: 'warning-outline',
          color: theme.colors.error,
          backgroundColor: theme.colors.errorLight || 'rgba(231, 76, 60, 0.1)'
        };
    }
  };
  
  const alertStyle = getAlertStyle();
  
  const hideAlert = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });
  
  if (!visible && animation._value === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.card,
          transform: [{ translateY }],
          opacity: animation,
          borderLeftColor: alertStyle.color,
          borderLeftWidth: 4,
          ...Platform.select({
            ios: {
              shadowColor: alertStyle.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            },
            android: {
              elevation: 4,
            },
          }),
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={alertStyle.icon} size={24} color={alertStyle.color} style={styles.icon} />
        <Text style={[styles.message, { color: theme.colors.text }]}>{message || 'Error de conexión'}</Text>
      </View>
      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: alertStyle.color }]} 
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={hideAlert}>
          <Ionicons name="close" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default NetworkErrorAlert;