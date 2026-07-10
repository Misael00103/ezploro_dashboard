import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function NotificationComment({ route }) {
  const { notification } = route.params;
  const { darkMode } = useTheme();
  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#181A20' }]}> 
      <Ionicons name="chatbubble-outline" size={48} color="#3949ab" style={styles.icon} />
      <Text style={[styles.title, darkMode && { color: '#fff' }]}>Nuevo comentario</Text>
      <Text style={[styles.message, darkMode && { color: '#bbb' }]}>{notification.message}</Text>
      <Image source={{ uri: notification.image }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  icon: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  message: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  image: { width: 120, height: 120, borderRadius: 16, marginTop: 12 },
}); 