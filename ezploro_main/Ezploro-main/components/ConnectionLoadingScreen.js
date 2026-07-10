import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ConnectionLoadingScreen = ({ message, isVisible }) => {
  const { theme } = useTheme();
  
  if (!isVisible) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.spinner}
        />
        
        <Text style={[styles.message, { color: theme.colors.text }]}>
          {message || 'Conectando con el servidor...'}
        </Text>
        
        <Text style={[styles.subMessage, { color: theme.colors.textSecondary }]}>
          Esto puede tardar unos momentos
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ConnectionLoadingScreen;