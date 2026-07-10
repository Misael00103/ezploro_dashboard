import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnimationModal = ({ visible, onClose }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: '#6366F1',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 320,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10
        }}>
          <View style={{
            marginBottom: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            padding: 16
          }}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            ¡Evento Creado!
          </Text>
          
          <Text style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 22
          }}>
            Tu evento ha sido creado exitosamente y está listo para recibir asistentes.
          </Text>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 25,
              minWidth: 120
            }}
          >
            <Text style={{
              color: '#6366F1',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Ver Evento
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AnimationModal;
