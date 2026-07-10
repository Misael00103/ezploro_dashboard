import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import CategorySelector from '../CategorySelector';
import { CATEGORIES, getSubcategories } from '../../../constants/categories';

const Step3Details = ({ eventData, updateEventData, setError }) => {
  const subcategories = getSubcategories(eventData.category);

  return (
    <View style={{ gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Text style={{ fontSize: 24, color: '#a855f7' }}>ℹ️</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>Detalles del Evento</Text>
      </View>

      {/* Descripción Completa */}
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Descripción Completa
        </Text>
        <TextInput
          value={eventData.about}
          onChangeText={(text) => updateEventData({ about: text })}
          placeholder="Describe tu evento, agenda, qué pueden esperar los asistentes..."
          multiline
          numberOfLines={6}
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: '#fff',
            textAlignVertical: 'top'
          }}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Alerta para eventos online */}
      {eventData.isOnline && (
        <View style={{ backgroundColor: 'rgba(251, 146, 60, 0.2)', borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.3)', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24, color: '#fb923c' }}>🔗</Text>
          <Text style={{ color: '#fed7aa', fontSize: 12 }}>
            Para eventos online, el enlace de reunión es obligatorio
          </Text>
        </View>
      )}

      {/* Enlace de Video/Reunión */}
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          {eventData.isOnline ? 'Enlace de Reunión (Obligatorio)' : 'Enlace de Video (Opcional)'}
        </Text>
        <TextInput
          value={eventData.videoUrl}
          onChangeText={(text) => updateEventData({ videoUrl: text })}
          placeholder={eventData.isOnline ? 'https://zoom.us/j/123456789' : 'https://youtube.com/watch?v=...'}
          keyboardType="url"
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: '#fff'
          }}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Categoría */}
      <CategorySelector
        categories={CATEGORIES}
        selected={eventData.category}
        onChange={(category) => updateEventData({ category, subcategory: '' })}
      />

      {/* Subcategoría */}
      {subcategories.length > 0 && (
        <View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Subcategoría
          </Text>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#9ca3af' }}>Seleccionar subcategoría</Text>
            {/* Aquí necesitarías implementar un picker para React Native */}
          </View>
        </View>
      )}

      {/* Precio */}
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Precio (USD)
        </Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={eventData.price?.toString() || ''}
            onChangeText={(text) => updateEventData({ price: parseFloat(text) || 0 })}
            placeholder="0"
            keyboardType="numeric"
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 16,
              paddingVertical: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              color: '#fff'
            }}
            placeholderTextColor="#9ca3af"
          />
          <Text style={{ position: 'absolute', left: 16, top: '50%', transform: [{ translateY: -8 }], color: '#9ca3af' }}>$</Text>
          {(!eventData.price || eventData.price === 0) && (
            <View style={{ position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -8 }] }}>
              <Text style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#10b981', color: '#fff', fontSize: 10, fontWeight: 'bold', borderRadius: 12 }}>
                GRATIS
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Step3Details;
