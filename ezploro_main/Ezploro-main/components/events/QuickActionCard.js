import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const iconEmojis = {
  'add-circle': '➕',
  'calendar': '📅',
  'megaphone': '📢',
  'bar-chart': '📊',
  'help-circle': '❓',
};

const QuickActionCard = ({ icon, title, subtitle, onPress, color = '#4A90E2' }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: `${color}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}
      >
        <Text style={{ fontSize: 20 }}>{iconEmojis[icon] || iconEmojis['help-circle']}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>{subtitle}</Text>
      </View>

      <Text style={{ color: '#999', fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );
};

export default QuickActionCard;
