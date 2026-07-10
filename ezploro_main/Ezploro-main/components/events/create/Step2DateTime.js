import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_COLOR = '#6366F1';
const SECONDARY_COLOR = '#8B5CF6';
const ACCENT_COLOR = '#06B6D4';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';
const BORDER_COLOR = '#374151';
const CARD_COLOR = '#1A1B23';

const Step2DateTime = ({ eventData, updateEventData, setError }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [timePickerMode, setTimePickerMode] = useState('start');
  const [locationInput, setLocationInput] = useState(eventData.address || '');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Debug inicial
  console.log('🔍 Step2DateTime inicializado con:', {
    isOnline: eventData.isOnline,
    isOnlineType: typeof eventData.isOnline,
    address: eventData.address,
    location: eventData.location,
    fullEventData: eventData
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLocationTypeChange = (isOnline) => {
    console.log('🔄 Cambiando tipo de evento a:', isOnline ? 'Online' : 'Presencial');
    console.log('🔄 Estado actual antes del cambio:', {
      currentIsOnline: eventData.isOnline,
      newIsOnline: isOnline
    });
    
    // Crear el objeto de actualización
    const updates = {
      isOnline: isOnline, // Asegurar que se establezca explícitamente
    };
    
    if (isOnline) {
      // Evento online - limpiar campos de ubicación física
      updates.location = 'Online';
      updates.address = '';
      updates.city = '';
      updates.state = '';
      updates.country = '';
      updates.locationCoords = null;
      setLocationInput('');
    } else {
      // Evento presencial - limpiar location y mantener campos de ubicación
      updates.location = ''; // No establecer location como string para eventos presenciales
      // Mantener los valores existentes si los hay, o usar strings vacíos
      updates.address = eventData.address || '';
      updates.city = eventData.city || '';
      updates.state = eventData.state || '';
      updates.country = eventData.country || '';
      updates.locationCoords = eventData.locationCoords || null;
      setLocationInput(eventData.address || '');
    }
    
    console.log('🔄 Actualizaciones a aplicar:', updates);
    
    // Aplicar todas las actualizaciones de una vez
    updateEventData(updates);
    
    setLocationSuggestions([]);
    
    // Log para verificar que el cambio se aplicó
    setTimeout(() => {
      console.log('🔄 Estado después del cambio (verificación):', {
        isOnline: eventData.isOnline,
        shouldBe: isOnline
      });
    }, 100);
  };

  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setLocationLoading(true);
    try {
      const searchQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=5&addressdetails=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const suggestions = data.map((item) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          name: item.name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address,
        }));
        setLocationSuggestions(suggestions);
      } else {
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error buscando ubicaciones:', error);
      setLocationSuggestions([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const selectLocation = (suggestion) => {
    const address = suggestion.address || {};
    const city = address.city || address.town || address.village || '';
    const state = address.state || address.province || address.region || '';
    const country = address.country || '';
    const displayName = suggestion.display_name || suggestion.name || '';
    
    console.log('📍 Seleccionando ubicación:', {
      displayName,
      city,
      state,
      country,
      coords: { lat: suggestion.lat, lng: suggestion.lon },
      currentIsOnline: eventData.isOnline
    });
    
    updateEventData({
      address: displayName,
      city: city,
      state: state,
      country: country,
      // NO establecer location como string para eventos presenciales
      locationCoords: { lat: suggestion.lat, lng: suggestion.lon },
    });
    
    setLocationInput(displayName);
    setLocationSuggestions([]);
    Keyboard.dismiss();
  };

  // Sincronizar el input local con el estado del evento
  useEffect(() => {
    if (eventData.address !== locationInput) {
      setLocationInput(eventData.address || '');
    }
  }, [eventData.address]);

  // Debug: monitorear cambios en isOnline
  useEffect(() => {
    console.log('🔍 Step2DateTime - isOnline cambió a:', eventData.isOnline);
  }, [eventData.isOnline]);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, []);

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
          <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>
            Fecha y Ubicación
          </Text>
          <Text style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 2 }}>
            Cuándo y dónde será tu evento
          </Text>
        </View>
      </View>

      {/* Date and Time Cards */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 }}>
          Fechas y Horarios
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => {
              setShowDatePicker(true);
              setDatePickerMode('start');
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={20} color={PRIMARY_COLOR} />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 8, fontWeight: '600' }}>
                FECHA INICIO
              </Text>
            </View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
              {formatDate(eventData.date)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowTimePicker(true);
              setTimePickerMode('start');
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="time" size={20} color={PRIMARY_COLOR} />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 8, fontWeight: '600' }}>
                HORA INICIO
              </Text>
            </View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
              {formatTime(eventData.startTime)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              setShowDatePicker(true);
              setDatePickerMode('end');
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={20} color={SECONDARY_COLOR} />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 8, fontWeight: '600' }}>
                FECHA FIN
              </Text>
            </View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
              {formatDate(eventData.endDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowTimePicker(true);
              setTimePickerMode('end');
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="time" size={20} color={SECONDARY_COLOR} />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 8, fontWeight: '600' }}>
                HORA FIN
              </Text>
            </View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
              {formatTime(eventData.endTime)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Type Toggle */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 }}>
          Tipo de Evento
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: !eventData.isOnline ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.05)',
              borderWidth: 2,
              borderColor: !eventData.isOnline ? PRIMARY_COLOR : BORDER_COLOR,
            }}
            onPress={() => {
              console.log('🔘 Botón PRESENCIAL presionado');
              console.log('🔘 Estado actual isOnline:', eventData.isOnline);
              handleLocationTypeChange(false);
            }}
          >
            <Ionicons name="location" size={24} color={!eventData.isOnline ? '#FFFFFF' : TEXT_SECONDARY} />
            <Text style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '600',
              color: !eventData.isOnline ? '#FFFFFF' : TEXT_SECONDARY,
            }}>
              Presencial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: eventData.isOnline ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.05)',
              borderWidth: 2,
              borderColor: eventData.isOnline ? PRIMARY_COLOR : BORDER_COLOR,
            }}
            onPress={() => {
              console.log('🔘 Botón ONLINE presionado');
              console.log('🔘 Estado actual isOnline:', eventData.isOnline);
              handleLocationTypeChange(true);
            }}
          >
            <Ionicons name="laptop" size={24} color={eventData.isOnline ? '#FFFFFF' : TEXT_SECONDARY} />
            <Text style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '600',
              color: eventData.isOnline ? '#FFFFFF' : TEXT_SECONDARY,
            }}>
              Online
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Fields */}
      {eventData.isOnline ? (
        <View style={{
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(99, 102, 241, 0.3)',
        }}>
          <Ionicons name="laptop" size={48} color={PRIMARY_COLOR} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: PRIMARY_COLOR, marginTop: 12, marginBottom: 8 }}>
            Evento Online
          </Text>
          <Text style={{ fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20 }}>
            Este evento se realizará de forma virtual. ¡Los participantes podrán unirse desde cualquier lugar!
          </Text>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 }}>
            Ubicación del Evento
          </Text>
          
          <View style={{ marginBottom: 16, position: 'relative' }}>
            <TextInput
              value={locationInput}
              onChangeText={(text) => {
                setLocationInput(text);
                updateEventData({ address: text });
                
                if (searchTimeout) clearTimeout(searchTimeout);
                const newTimeout = setTimeout(() => {
                  searchLocations(text);
                }, 500);
                setSearchTimeout(newTimeout);
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
              }}
              mode="outlined"
              outlineColor={BORDER_COLOR}
              activeOutlineColor={PRIMARY_COLOR}
              textColor={TEXT_PRIMARY}
              placeholder="Buscar dirección del evento..."
              placeholderTextColor={TEXT_SECONDARY}
              theme={{
                colors: {
                  primary: PRIMARY_COLOR,
                  onSurfaceVariant: TEXT_SECONDARY,
                }
              }}
            />
            
            {locationLoading && (
              <View style={{
                position: 'absolute',
                right: 16,
                top: 16,
              }}>
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              </View>
            )}
            
            {locationSuggestions.length > 0 && (
              <View style={{
                backgroundColor: CARD_COLOR,
                borderRadius: 12,
                marginTop: 8,
                maxHeight: 180,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}>
                <ScrollView 
                  style={{ maxHeight: 200 }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {locationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={`suggestion_${index}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderBottomWidth: index < locationSuggestions.length - 1 ? 1 : 0,
                        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                      }}
                      onPress={() => selectLocation(suggestion)}
                    >
                      <Ionicons name="location-outline" size={16} color={PRIMARY_COLOR} />
                      <Text style={{
                        color: TEXT_PRIMARY,
                        fontSize: 14,
                        marginLeft: 12,
                        flex: 1,
                      }} numberOfLines={2}>
                        {suggestion.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TextInput
              value={eventData.city}
              onChangeText={(text) => updateEventData({ city: text })}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
              }}
              mode="outlined"
              outlineColor={BORDER_COLOR}
              activeOutlineColor={PRIMARY_COLOR}
              textColor={TEXT_PRIMARY}
              placeholder="Ciudad"
              placeholderTextColor={TEXT_SECONDARY}
              theme={{
                colors: {
                  primary: PRIMARY_COLOR,
                  onSurfaceVariant: TEXT_SECONDARY,
                }
              }}
            />
            
            <TextInput
              value={eventData.state}
              onChangeText={(text) => updateEventData({ state: text })}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
              }}
              mode="outlined"
              outlineColor={BORDER_COLOR}
              activeOutlineColor={PRIMARY_COLOR}
              textColor={TEXT_PRIMARY}
              placeholder="Estado/Provincia"
              placeholderTextColor={TEXT_SECONDARY}
              theme={{
                colors: {
                  primary: PRIMARY_COLOR,
                  onSurfaceVariant: TEXT_SECONDARY,
                }
              }}
            />
          </View>

          <TextInput
            value={eventData.country}
            onChangeText={(text) => updateEventData({ country: text })}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
            }}
            mode="outlined"
            outlineColor={BORDER_COLOR}
            activeOutlineColor={PRIMARY_COLOR}
            textColor={TEXT_PRIMARY}
            placeholder="País"
            placeholderTextColor={TEXT_SECONDARY}
            theme={{
              colors: {
                primary: PRIMARY_COLOR,
                onSurfaceVariant: TEXT_SECONDARY,
              }
            }}
          />
        </View>
      )}


      </ScrollView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <View style={{
              backgroundColor: CARD_COLOR,
              borderRadius: 16,
              padding: 20,
              margin: 20,
              minWidth: 300
            }}>
              <DateTimePicker
                value={new Date(datePickerMode === 'start' ? eventData.date : eventData.endDate)}
                mode="date"
                display="spinner"
                textColor={PRIMARY_COLOR}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    if (datePickerMode === 'start') {
                      updateEventData({ date: selectedDate.toISOString() });
                    } else {
                      updateEventData({ endDate: selectedDate.toISOString() });
                    }
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <View style={{
              backgroundColor: CARD_COLOR,
              borderRadius: 16,
              padding: 20,
              margin: 20,
              minWidth: 300
            }}>
              <DateTimePicker
                value={new Date(timePickerMode === 'start' ? eventData.startTime : eventData.endTime)}
                mode="time"
                display="spinner"
                textColor={PRIMARY_COLOR}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    if (timePickerMode === 'start') {
                      updateEventData({ startTime: selectedTime.toISOString() });
                    } else {
                      updateEventData({ endTime: selectedTime.toISOString() });
                    }
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

export default Step2DateTime;