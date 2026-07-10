import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon || '📭'}</Text>
      
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' }}>
        {title || 'No hay nada aquí'}
      </Text>
      
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
        {description || 'Parece que aún no hay contenido disponible'}
      </Text>
      
      {onAction && actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#6366f1',
            borderRadius: 25,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
