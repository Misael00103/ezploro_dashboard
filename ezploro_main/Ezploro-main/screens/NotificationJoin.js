import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { normalizeImageUrl } from '../utils/image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const notificationTypeStyles = {
  join: { icon: 'person-add-outline', color: '#43a047', gradient: ['#43a047', '#A5D6A7'] },
};

export default function NotificationJoin({ route }) {
  const { notification } = route.params;
  const { darkMode } = useTheme();
  const navigation = useNavigation();
  const typeStyle = notificationTypeStyles.join;

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && { backgroundColor: '#181A20' }]}>
      <View style={styles.container}>
        <Text style={[styles.mainTitle, darkMode && { color: '#fff' }]}>Join Details</Text>
        <View style={styles.content}>
          <LinearGradient colors={typeStyle.gradient} style={styles.header}>
            <Ionicons name={typeStyle.icon} size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.detailTitle, darkMode && { color: '#fff' }]}>{notification.title}</Text>
          <Text style={[styles.detailMessage, darkMode && { color: '#bbb' }]}>{notification.message}</Text>
          <Image source={{ uri: normalizeImageUrl(notification.image) }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.6}>
            <Text style={styles.backButtonText}>Back to Notifications</Text>
            <Ionicons name="chevron-back" size={20} color="#43a047" />
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
  header: {
    height: Dimensions.get('window').height * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
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
    borderColor: '#43a047',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#43a047',
    marginRight: 8,
  },
});