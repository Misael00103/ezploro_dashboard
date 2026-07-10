import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#6366F1';
const ERROR_COLOR = '#EF4444';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';
const BORDER_COLOR = '#374151';

const Step4FAQs = ({ eventData, updateEventData }) => {
  const addFaq = () => {
    const newFaq = { id: Date.now() + Math.random(), question: '', answer: '' };
    updateEventData({ faqs: [...eventData.faqs, newFaq] });
  };

  const updateFaq = (index, field, value) => {
    const updatedFaqs = eventData.faqs.map((faq, i) => 
      i === index ? { ...faq, [field]: value } : faq
    );
    updateEventData({ faqs: updatedFaqs });
  };

  const removeFaq = (index) => {
    if (eventData.faqs.length > 1) {
      const updatedFaqs = eventData.faqs.filter((_, i) => i !== index);
      updateEventData({ faqs: updatedFaqs });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
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
            <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>
              Preguntas Frecuentes
            </Text>
            <Text style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 2 }}>
              Anticipa las dudas de tus asistentes
            </Text>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {eventData.faqs.map((faq, index) => (
            <View 
              key={`faq_${faq.id}_${index}`} 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              }}
            >
              {/* FAQ Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: PRIMARY_COLOR,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={{ color: PRIMARY_COLOR, fontSize: 16, fontWeight: '600' }}>
                    FAQ {index + 1}
                  </Text>
                </View>
                
                {eventData.faqs.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeFaq(index)} 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Question Input */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 6 }}>
                  Pregunta
                </Text>
                <TextInput
                  value={faq.question}
                  onChangeText={(text) => updateFaq(index, 'question', text)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                  }}
                  mode="outlined"
                  outlineColor={BORDER_COLOR}
                  activeOutlineColor={PRIMARY_COLOR}
                  textColor={TEXT_PRIMARY}
                  placeholder="¿Cuál es el horario del evento?"
                  placeholderTextColor={TEXT_SECONDARY}
                  theme={{
                    colors: {
                      primary: PRIMARY_COLOR,
                      onSurfaceVariant: TEXT_SECONDARY,
                    }
                  }}
                />
              </View>

              {/* Answer Input */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 6 }}>
                  Respuesta
                </Text>
                <TextInput
                  value={faq.answer}
                  onChangeText={(text) => updateFaq(index, 'answer', text)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                    minHeight: 80,
                  }}
                  mode="outlined"
                  outlineColor={BORDER_COLOR}
                  activeOutlineColor={PRIMARY_COLOR}
                  textColor={TEXT_PRIMARY}
                  placeholder="El evento comenzará a las 7:00 PM y terminará aproximadamente a las 10:00 PM..."
                  placeholderTextColor={TEXT_SECONDARY}
                  multiline
                  numberOfLines={3}
                  theme={{
                    colors: {
                      primary: PRIMARY_COLOR,
                      onSurfaceVariant: TEXT_SECONDARY,
                    }
                  }}
                />
              </View>
            </View>
          ))}

          {/* Add FAQ Button */}
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: PRIMARY_COLOR,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 16,
              marginTop: 8,
              marginBottom: 20,
              shadowColor: PRIMARY_COLOR,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={addFaq}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Agregar Pregunta
            </Text>
          </TouchableOpacity>

          {/* Helper Text */}
          <View style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(99, 102, 241, 0.3)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={20} color={PRIMARY_COLOR} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: PRIMARY_COLOR, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                  Consejos para las FAQs
                </Text>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                  • Incluye información sobre horarios, ubicación y requisitos{'\n'}
                  • Responde dudas sobre precios, cancelaciones y reembolsos{'\n'}
                  • Menciona qué deben traer los asistentes{'\n'}
                  • Proporciona información de contacto para más dudas
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Step4FAQs;