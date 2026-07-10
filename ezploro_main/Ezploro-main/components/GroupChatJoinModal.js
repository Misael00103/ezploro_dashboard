import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroupChatJoinModal({ visible, onClose, onJoin, eventTitle, eventId }) {
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const checkNotificationPreference = async (eventId) => {
    try {
      const key = `notification_pref_${eventId}`;
      const preference = await AsyncStorage.getItem(key);
      return preference === 'granted';
    } catch (error) {
      console.error('Error checking notification preference:', error);
      return false;
    }
  };

  const saveNotificationPreference = async (eventId, granted) => {
    try {
      const key = `notification_pref_${eventId}`;
      await AsyncStorage.setItem(key, granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      // Check if we already asked for this event
      const alreadyAsked = await checkNotificationPreference(eventId);
      if (alreadyAsked) {
        return true;
      }

      setIsRequestingPermissions(true);
      
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        Alert.alert(
          "Activar notificaciones",
          `¿Quieres recibir notificaciones del chat de "${eventTitle}"? Podrás desactivarlas en cualquier momento.`,
          [
            {
              text: "No, gracias",
              onPress: async () => {
                await saveNotificationPreference(eventId, false);
                setIsRequestingPermissions(false);
              },
              style: "cancel"
            },
            {
              text: "Sí, activar",
              onPress: async () => {
                try {
                  const { status } = await Notifications.requestPermissionsAsync();
                  await saveNotificationPreference(eventId, status === 'granted');
                  setIsRequestingPermissions(false);
                  
                  if (status !== 'granted') {
                    Alert.alert(
                      "Permisos denegados", 
                      "Puedes activar las notificaciones más tarde en la configuración de tu dispositivo."
                    );
                  }
                } catch (error) {
                  console.error('Error requesting notification permissions:', error);
                  setIsRequestingPermissions(false);
                }
              }
            }
          ]
        );
      } else {
        // Already granted, save preference
        await saveNotificationPreference(eventId, true);
      }
      
      return true;
    } catch (error) {
      console.error('Error in requestNotificationPermissions:', error);
      setIsRequestingPermissions(false);
      return false;
    }
  };

  const handleJoin = async () => {
    try {
      // Request notification permissions before joining
      await requestNotificationPermissions();
      
      // Proceed with joining
      if (onJoin) {
        onJoin();
      }
    } catch (error) {
      console.error('Error in handleJoin:', error);
      // Still proceed with joining even if notification permission fails
      if (onJoin) {
        onJoin();
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Ionicons name="notifications-outline" size={48} color="#6200EE" />
          <Text style={styles.title}>¿Unirse al chat del evento?</Text>
          <Text style={styles.message}>
            Únete al chat de "{eventTitle}" para participar en la conversación.
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={isRequestingPermissions}
            >
              <Text style={styles.cancelText}>Ahora no</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.joinButton, isRequestingPermissions && styles.joinButtonDisabled]} 
              onPress={handleJoin}
              disabled={isRequestingPermissions}
            >
              <Text style={styles.joinText}>
                {isRequestingPermissions ? 'Configurando...' : 'Unirse'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    margin: 20,
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6200EE',
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelText: {
    color: '#666',
    fontWeight: '500',
  },
  joinText: {
    color: '#fff',
    fontWeight: '500',
  },
});