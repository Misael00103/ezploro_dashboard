import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_CATEGORIES, getCategoriesArray, getSubcategories } from '../../../constants/filterCategories';

const PRIMARY_COLOR = '#6366F1';
const SECONDARY_COLOR = '#8B5CF6';
const SUCCESS_COLOR = '#10B981';
const WARNING_COLOR = '#F59E0B';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';
const BORDER_COLOR = '#374151';

const Step3Details = ({ eventData, updateEventData, setError }) => {
  const handleCategoryChange = (category) => {
    updateEventData({ category, subcategory: '' });
  };

  const handleSubcategoryChange = (subcategory) => {
    updateEventData({ subcategory });
  };

  const categoriesArray = getCategoriesArray();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <View style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 24, 
          backgroundColor: PRIMARY_COLOR, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 16
        }}>
          <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>
            Detalles del Evento
          </Text>
          <Text style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 2 }}>
            Información adicional y categorización
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
          Descripción Completa
        </Text>
        <TextInput
          value={eventData.about}
          onChangeText={(text) => updateEventData({ about: text })}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            minHeight: 120,
          }}
          mode="outlined"
          outlineColor={BORDER_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          textColor={TEXT_PRIMARY}
          placeholder="Describe tu evento, agenda, qué pueden esperar los asistentes..."
          placeholderTextColor={TEXT_SECONDARY}
          multiline
          numberOfLines={6}
          theme={{
            colors: {
              primary: PRIMARY_COLOR,
              onSurfaceVariant: TEXT_SECONDARY,
            }
          }}
        />
      </View>

      {/* Video URL for Online Events */}
      {eventData.isOnline && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(245, 158, 11, 0.3)',
        }}>
          <Ionicons name="link-outline" size={24} color={WARNING_COLOR} />
          <Text style={{
            marginLeft: 12,
            color: WARNING_COLOR,
            fontSize: 14,
            fontWeight: '500',
            flex: 1,
          }}>
            Para eventos online, el enlace de reunión es obligatorio
          </Text>
        </View>
      )}

      {/* Video URL Input */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
          {eventData.isOnline ? 'Enlace de Reunión (Obligatorio)' : 'Enlace de Video (Opcional)'}
        </Text>
        <TextInput
          value={eventData.videoUrl}
          onChangeText={(text) => updateEventData({ videoUrl: text })}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
          }}
          mode="outlined"
          outlineColor={BORDER_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          textColor={TEXT_PRIMARY}
          placeholder={
            eventData.isOnline
              ? 'https://zoom.us/j/123456789, https://youtube.com/live/xyz'
              : 'https://youtube.com/watch?v=...'
          }
          placeholderTextColor={TEXT_SECONDARY}
          autoCapitalize="none"
          theme={{
            colors: {
              primary: PRIMARY_COLOR,
              onSurfaceVariant: TEXT_SECONDARY,
            }
          }}
        />
      </View>

      {/* Category Selection */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 }}>
          Categoría
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {categoriesArray.map((category, index) => (
            <TouchableOpacity
              key={`category_${category.value}_${index}`}
              style={{
                minWidth: '45%',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: eventData.category === category.value ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: eventData.category === category.value ? PRIMARY_COLOR : BORDER_COLOR,
                alignItems: 'center',
              }}
              onPress={() => handleCategoryChange(category.value)}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: eventData.category === category.value ? '#FFFFFF' : TEXT_SECONDARY,
              }}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Subcategory Selection */}
      {eventData.category && getSubcategories(eventData.category).length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 }}>
            Subcategoría
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {getSubcategories(eventData.category).map((subcategory, index) => (
              <TouchableOpacity
                key={`subcategory_${subcategory.name}_${index}`}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: eventData.subcategory === subcategory.name ? SECONDARY_COLOR : 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: eventData.subcategory === subcategory.name ? SECONDARY_COLOR : BORDER_COLOR,
                }}
                onPress={() => handleSubcategoryChange(subcategory.name)}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: eventData.subcategory === subcategory.name ? '#FFFFFF' : TEXT_SECONDARY,
                }}>
                  {subcategory.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Price Input */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
          Precio (USD)
        </Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={eventData.price?.toString() || '0'}
            onChangeText={(text) => {
              const price = parseFloat(text) || 0;
              updateEventData({ price });
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
            }}
            mode="outlined"
            outlineColor={BORDER_COLOR}
            activeOutlineColor={PRIMARY_COLOR}
            textColor={TEXT_PRIMARY}
            placeholder="0 (Gratis)"
            placeholderTextColor={TEXT_SECONDARY}
            keyboardType="numeric"
            theme={{
              colors: {
                primary: PRIMARY_COLOR,
                onSurfaceVariant: TEXT_SECONDARY,
              }
            }}
          />
          {(!eventData.price || eventData.price === 0) && (
            <View style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: [{ translateY: -12 }],
              backgroundColor: SUCCESS_COLOR,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: '600',
              }}>
                GRATIS
              </Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step3Details;