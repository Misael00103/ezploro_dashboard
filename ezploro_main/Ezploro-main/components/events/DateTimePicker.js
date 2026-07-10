import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomDateTimePicker = ({ label, value, onChange, type = 'date', icon }) => {
  const [show, setShow] = useState(false);

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = getValidDate();
    
    if (type === 'date') {
      return date.toLocaleDateString('es-ES', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    if (type === 'time') {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    
    return '';
  };

  const handleChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // Ensure value is always a Date object
  const getValidDate = () => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity 
        onPress={() => setShow(true)}
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {icon && <Text style={{ marginRight: 8 }}>{icon}</Text>}
          <Text style={{ color: '#999', fontSize: 12 }}>{label}</Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '600' }}>
          {formatDisplayValue() || 'Seleccionar'}
        </Text>
      </TouchableOpacity>
      
      {show && (
        <DateTimePicker
          value={getValidDate()}
          mode={type}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

export default CustomDateTimePicker;
