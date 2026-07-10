import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatDate } from '../../utils/date.js';

const EventManagementCard = ({ event, onPress, isDraft = false }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: isDraft ? 4 : 0,
        borderLeftColor: isDraft ? '#f59e0b' : 'transparent'
      }}
    >
      <View style={{ marginBottom: 12 }}>
        {isDraft && (
          <View style={{
            backgroundColor: '#f59e0b',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginBottom: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>BORRADOR</Text>
          </View>
        )}
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{event.title}</Text>
        <Text style={{ color: '#ccc', fontSize: 12, marginTop: 4 }}>{formatDate(event.date_time, 'long')}</Text>
      </View>

      {event.description && (
        <Text style={{ color: '#ddd', fontSize: 12, marginBottom: 12 }} numberOfLines={2}>{event.description}</Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {event.city && (
            <Text style={{ color: '#999', fontSize: 12 }}>📍 {event.city}</Text>
          )}
          <Text style={{ color: '#999', fontSize: 12 }}>👥 {event.subscribers_count || 0}</Text>
          <Text style={{ color: '#999', fontSize: 12 }}>❤️ {event.likes || 0}</Text>
        </View>

        <Text style={{ color: '#a855f7', fontWeight: 'bold' }}>
          {event.price && parseFloat(event.price) > 0 ? `$${event.price}` : 'Gratis'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default EventManagementCard;
