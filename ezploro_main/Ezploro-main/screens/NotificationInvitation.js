import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { normalizeImageUrl } from '../utils/image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const notificationTypeStyles = {
  invitation: { icon: 'mail-outline', color: '#4F8EF7', bg: '#e3f0ff', darkBg: '#22304a', gradient: ['#4F8EF7', '#A3C9FF'] },
};

export default function NotificationInvitation({ route }) {
  const { notification } = route.params;
  const { darkMode } = useTheme();
  const typeStyle = notificationTypeStyles.invitation;

  return (
    <View style={styles.container}>
      <LinearGradient colors={typeStyle.gradient} style={styles.header}>
        <Ionicons name={typeStyle.icon} size={60} color="#fff" />
      </LinearGradient>
      <View style={styles.content}>
        <Text style={[styles.title, darkMode && { color: '#fff' }]}>Invitación a evento</Text>
        <Text style={[styles.message, darkMode && { color: '#bbb' }]}>{notification.message}</Text>
        <Image source={{ uri: normalizeImageUrl(notification.image) }} style={styles.image} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: Dimensions.get('window').height * 0.3, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#333' },
  message: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  image: { width: 150, height: 150, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
});