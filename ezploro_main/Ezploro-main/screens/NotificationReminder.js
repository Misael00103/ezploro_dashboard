import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeImageUrl } from '../utils/image';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const notificationTypeStyles = {
  reminder: { icon: 'alarm-outline', color: '#ffb300' },
};

export default function NotificationReminder({ route }) {
  const { notification } = route.params;
  const { darkMode } = useTheme();
  const navigation = useNavigation();
  const typeStyle = notificationTypeStyles.reminder;

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && { backgroundColor: '#181A20' }]}>
      <View style={styles.container}>
        <Text style={[styles.mainTitle, darkMode && { color: '#fff' }]}>Reminder Details</Text>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={typeStyle.icon} size={40} color={typeStyle.color} />
          </View>
          <Text style={[styles.detailTitle, darkMode && { color: '#fff' }]}>{notification.title}</Text>
          <Text style={[styles.detailMessage, darkMode && { color: '#bbb' }]}>{notification.message}</Text>
          <Image source={{ uri: normalizeImageUrl(notification.image) }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.6}>
            <Text style={styles.backButtonText}>Back to Notifications</Text>
            <Ionicons name="chevron-back" size={20} color="#ffb300" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 18,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 24,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffb300',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#ffb300',
    marginRight: 8,
  },
});