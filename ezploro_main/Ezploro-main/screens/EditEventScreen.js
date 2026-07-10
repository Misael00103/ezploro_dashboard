import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/common/PageHeader';
import StepIndicator from '../components/events/StepIndicator';
import AnimationModal from '../components/common/AnimationModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import imageService from '../services/imageService';
import Step1BasicInfo from '../components/events/create/Step1BasicInfo';
import Step2DateTime from '../components/events/create/Step2DateTime';
import Step3Details from '../components/events/create/Step3Details';
import Step4FAQs from '../components/events/create/Step4FAQs';

const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { event } = route.params;
  const { updateEvent } = useEvents();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: '',
    resume: '',
    date: new Date().toISOString(),
    endDate: new Date().toISOString(),
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    location: '',
    locationCoords: null,
    eventType: 'free',
    about: '',
    coverImage: null,
    coverImageUploaded: false,
    videoUrl: '',
    faqs: [{ id: Date.now(), question: '', answer: '' }],
    category: 'musica',
    subcategory: '',
    price: 0,
    address: '',
    city: '',
    state: '',
    country: '',
    isOnline: false,
  });

  // Cargar datos del evento al inicializar
  useEffect(() => {
    if (event) {
      setEventData({
        title: event.title || '',
        resume: event.resume || '',
        date: event.date_time || new Date().toISOString(),
        endDate: event.end_date_time || new Date().toISOString(),
        startTime: event.date_time || new Date().toISOString(),
        endTime: event.end_date_time || new Date().toISOString(),
        location: event.location || '',
        locationCoords: event.latitude && event.longitude ? {
          lat: event.latitude,
          lng: event.longitude
        } : null,
        eventType: event.price > 0 ? 'paid' : 'free',
        about: event.description || '',
        coverImage: event.cover_image || null,
        coverImageUploaded: !!event.cover_image,
        videoUrl: event.video_url || '',
        faqs: Array.isArray(event.faqs) && event.faqs.length > 0 
          ? event.faqs 
          : [{ id: Date.now(), question: '', answer: '' }],
        category: event.category || 'musica',
        subcategory: event.subcategory || '',
        price: event.price || 0,
        address: event.address || '',
        city: event.city || '',
        state: event.state || '',
        country: event.country || '',
        isOnline: event.online || false,
      });
    }
  }, [event]);

  const updateEventData = (updates) => {
    setEventData(prev => ({ ...prev, ...updates }));
  };

  const handleNextStep = async () => {
    setError('');

    // Validaciones por paso
    if (step === 1) {
      if (!eventData.title.trim() || !eventData.resume.trim()) {
        setError('Por favor completa el título y resumen.');
        return;
      }
    }

    if (step === 2) {
      const startDateTime = new Date(eventData.date);
      const endDateTime = new Date(eventData.endDate);

      if (endDateTime <= startDateTime) {
        setError('La fecha y hora de fin debe ser posterior a la de inicio.');
        return;
      }

      if (!eventData.isOnline && (!eventData.city.trim() || !eventData.state.trim() || !eventData.country.trim())) {
        setError('Por favor completa todos los campos de ubicación para eventos presenciales.');
        return;
      }
    }

    if (step === 3) {
      if (!eventData.about.trim()) {
        setError('Por favor proporciona detalles sobre el evento.');
        return;
      }
      if (eventData.isOnline && !eventData.videoUrl.trim()) {
        setError('Para eventos online, proporciona un enlace de video/reunión.');
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      await handleUpdateEvent();
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleUpdateEvent = async () => {
    if (!user?.user_id) {
      setError('Usuario no autenticado. Por favor inicia sesión.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📤 Actualizando evento...');
      
      // Preparar datos para actualización
      const eventPayload = {
        title: eventData.title,
        description: eventData.about,
        resume: eventData.resume,
        date_time: eventData.date,
        end_date_time: eventData.endDate,
        online: eventData.isOnline,
        category: eventData.category,
        subcategory: eventData.subcategory || '',
        price: eventData.price || 0,
        video_url: eventData.videoUrl || '',
        faqs: eventData.faqs.filter(faq => faq.question.trim() && faq.answer.trim())
      };
      
      // Si hay una nueva imagen local, agregarla como archivo
      if (eventData.coverImage && eventData.coverImage.startsWith('file://')) {
        eventPayload.coverImageFile = eventData.coverImage;
      }
      // No incluir cover_image URL - el backend maneja las imágenes
      
      if (!eventData.isOnline) {
        eventPayload.address = eventData.address || '';
        eventPayload.city = eventData.city || '';
        eventPayload.state = eventData.state || '';
        eventPayload.country = eventData.country || '';
        
        if (eventData.locationCoords) {
          eventPayload.latitude = eventData.locationCoords.lat;
          eventPayload.longitude = eventData.locationCoords.lng;
          // Formato GeoJSON correcto para el backend
          eventPayload.location = {
            type: "Point",
            coordinates: [eventData.locationCoords.lng, eventData.locationCoords.lat] // [longitude, latitude]
          };
        } else {
          // Para eventos sin coordenadas específicas, enviar null
          eventPayload.location = null;
        }
      } else {
        // Para eventos online, no enviar campo location
        console.log('🌐 EditEvent: Online event, no location field needed');
        // No establecer eventPayload.location
      }

      const updatedEvent = await updateEvent(event.event_id, eventPayload);
      setModalVisible(true);
    } catch (e) {
      console.error('Error al actualizar evento:', e);
      setError('Ocurrió un error al actualizar el evento. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1BasicInfo eventData={eventData} updateEventData={updateEventData} setError={setError} />;
      case 2:
        return <Step2DateTime eventData={eventData} updateEventData={updateEventData} setError={setError} />;
      case 3:
        return <Step3Details eventData={eventData} updateEventData={updateEventData} setError={setError} />;
      case 4:
        return <Step4FAQs eventData={eventData} updateEventData={updateEventData} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {/* Background Gradient */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
        opacity: 0.8,
      }} />
      
      {/* Decorative Elements */}
      <View style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
      }} />
      <View style={{
        position: 'absolute',
        bottom: -80,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
      }} />

      <PageHeader
        title="Editar Evento"
        subtitle={`Paso ${step} de 4`}
        onBack={handlePreviousStep}
      />

      <View style={{ flex: 1, padding: 16 }}>
        <StepIndicator currentStep={step} totalSteps={4} />

        {error && (
          <View style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#EF4444',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>!</Text>
            </View>
            <Text style={{ color: '#FCA5A5', fontSize: 14, flex: 1 }}>{error}</Text>
        </View>
        )}

        <View style={{
          backgroundColor: 'rgba(26, 27, 35, 0.8)',
          borderRadius: 20,
          padding: 20,
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          {renderStep()}
        </View>
      </View>

      {/* Fixed Footer */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      }}>
        <TouchableOpacity
          onPress={handleNextStep}
          disabled={isLoading}
          style={{
            width: '100%',
            paddingVertical: 18,
            backgroundColor: '#6366F1',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: isLoading ? 0.6 : 1,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {isLoading ? (
            <LoadingSpinner size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                marginRight: 8,
              }}>
                {step === 4 ? 'Actualizar Evento' : 'Continuar'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <AnimationModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

export default EditEventScreen;