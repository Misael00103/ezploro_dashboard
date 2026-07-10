import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useGuestRestrictions } from '../hooks/useGuestRestrictions';

const GuestBanner = ({ navigation, style }) => {
  const { user } = useAuth();
  const { isGuestUser } = useGuestRestrictions();

  if (!isGuestUser) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={24} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Modo Invitado</Text>
            <Text style={styles.subtitle}>
              Crea una cuenta para suscribirte a eventos, crear contenido y más
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.buttonText}>Crear cuenta</Text>
            <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default GuestBanner;