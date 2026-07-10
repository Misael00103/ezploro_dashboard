import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const PRIMARY_COLOR = '#6366F1';
const SECONDARY_COLOR = '#8B5CF6';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';
const BORDER_COLOR = '#374151';
const CARD_COLOR = '#1A1B23';

const Step1BasicInfo = ({ eventData, updateEventData, setError }) => {
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requieren permisos de galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        updateEventData({ coverImage: asset.uri, coverImageUploaded: false });
      }
    } catch (e) {
      console.error('Error al seleccionar imagen:', e);
      setError('Error al seleccionar imagen.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
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
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>
              Información Básica
            </Text>
            <Text style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 2 }}>
              Datos principales de tu evento
            </Text>
          </View>
        </View>

        {/* Title Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
            Nombre del Evento
          </Text>
          <TextInput
            value={eventData.title}
            onChangeText={(text) => updateEventData({ title: text })}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
            }}
            mode="outlined"
            outlineColor={BORDER_COLOR}
            activeOutlineColor={PRIMARY_COLOR}
            textColor={TEXT_PRIMARY}
            placeholder="Ej: Concierto de Jazz en el Parque"
            placeholderTextColor={TEXT_SECONDARY}
            theme={{
              colors: {
                primary: PRIMARY_COLOR,
                onSurfaceVariant: TEXT_SECONDARY,
              }
            }}
          />
        </View>

        {/* Resume Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
            Resumen Breve
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={eventData.resume}
              onChangeText={(text) => updateEventData({ resume: text.slice(0, 140) })}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                minHeight: 80,
              }}
              mode="outlined"
              outlineColor={BORDER_COLOR}
              activeOutlineColor={PRIMARY_COLOR}
              textColor={TEXT_PRIMARY}
              placeholder="Una descripción atractiva que invite a participar..."
              placeholderTextColor={TEXT_SECONDARY}
              multiline
              maxLength={140}
              theme={{
                colors: {
                  primary: PRIMARY_COLOR,
                  onSurfaceVariant: TEXT_SECONDARY,
                }
              }}
            />
            <Text style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              fontSize: 12,
              color: TEXT_SECONDARY,
              backgroundColor: CARD_COLOR,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}>
              {eventData.resume.length}/140
            </Text>
          </View>
        </View>

        {/* Image Picker */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 }}>
            Imagen de Portada
          </Text>
          <TouchableOpacity 
            style={{
              borderWidth: 2,
              borderColor: PRIMARY_COLOR,
              borderStyle: 'dashed',
              borderRadius: 16,
              height: 180,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
            }}
            onPress={pickImage}
          >
            {eventData.coverImage ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image 
                  source={{ uri: eventData.coverImage }} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 14,
                  }}
                  resizeMode="cover"
                />
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                    Cambiar imagen
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="cloud-upload-outline" size={28} color={PRIMARY_COLOR} />
                </View>
                <Text style={{ color: PRIMARY_COLOR, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                  Subir Imagen
                </Text>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, textAlign: 'center', lineHeight: 16 }}>
                  Toca para seleccionar una imagen{"\n"}JPG, PNG • Máx 5MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default Step1BasicInfo;