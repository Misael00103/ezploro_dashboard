import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';

const EventManagementActions = ({ event, style }) => {
  const navigation = useNavigation();
  const { deleteEvent } = useEvents();
  const { user } = useAuth();

  // Solo mostrar si el usuario es el organizador
  if (!event || !user || event.organizer_id !== user.user_id) {
    return null;
  }

  const handleEdit = () => {
    navigation.navigate('EditEvent', { event });
  };

  const handleDelete = () => {
    console.log("🗑️ Iniciando eliminación de evento:", event.event_id);
    Alert.alert(
      'Eliminar Evento',
      `¿Estás seguro de que quieres eliminar "${event.title}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteEvent(event.event_id);
              console.log("✅ Resultado de deleteEvent:", result);
              if (result.success) {
                Alert.alert('Éxito', 'Evento eliminado correctamente');
                navigation.goBack();
              } else {
                Alert.alert('Error', result.message || 'No se pudo eliminar el evento');
              }
            } catch (error) {
              console.error('❌ Error al eliminar evento:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error al eliminar el evento');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[{
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      marginTop: 16,
    }, style]}>
      <TouchableOpacity
        onPress={handleEdit}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#6366F1',
          paddingVertical: 12,
          borderRadius: 8,
          gap: 8,
        }}
      >
        <Ionicons name="pencil" size={18} color="#FFFFFF" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
        }}>
          Editar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDelete}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#EF4444',
          paddingVertical: 12,
          borderRadius: 8,
          gap: 8,
        }}
      >
        <Ionicons name="trash" size={18} color="#FFFFFF" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
        }}>
          Eliminar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EventManagementActions;