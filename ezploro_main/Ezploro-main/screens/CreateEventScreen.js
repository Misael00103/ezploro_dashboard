import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, Image } from 'react-native';
import AnimationModal from '../components/common/AnimationModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import Step1BasicInfo from '../components/events/create/Step1BasicInfo';
import Step2DateTime from '../components/events/create/Step2DateTime';
import Step3Details from '../components/events/create/Step3Details';
import Step4FAQs from '../components/events/create/Step4FAQs';
import StepIndicator from '../components/events/StepIndicator';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import useGuestRestrictions from '../hooks/useGuestRestrictions';
import draftService from '../services/draftService';

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { draft } = route.params || {};
  const { createEvent, addEventToList } = useEvents();
  const { restrictedActions } = useGuestRestrictions();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [draftId, setDraftId] = useState(draft?.id || null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Los usuarios guest pueden ver la pantalla, pero no crear eventos
  // La verificación se hace en handleCreateEvent, no al cargar la pantalla

  // Cargar datos del borrador si existe
  useEffect(() => {
    if (draft) {
      console.log('📄 Cargando borrador:', {
        draftIsOnline: draft.isOnline,
        draftIsOnlineType: typeof draft.isOnline,
        draftLocation: draft.location,
        fullDraft: draft
      });
      
      const isOnlineFromDraft = draft.isOnline === true || draft.isOnline === 'true';
      
      console.log('📄 Procesando isOnline del borrador:', {
        original: draft.isOnline,
        processed: isOnlineFromDraft,
        willSet: isOnlineFromDraft
      });
      
      setEventData({
        title: draft.title || '',
        resume: draft.resume || '',
        date: draft.date || new Date().toISOString(),
        endDate: draft.endDate || new Date().toISOString(),
        startTime: draft.startTime || new Date().toISOString(),
        endTime: draft.endTime || new Date().toISOString(),
        location: draft.location || '',
        locationCoords: draft.locationCoords || null,
        eventType: draft.eventType || 'free',
        about: draft.about || '',
        coverImage: draft.coverImage || null,
        coverImageUploaded: draft.coverImageUploaded || false,
        videoUrl: draft.videoUrl || '',
        faqs: draft.faqs || [{ id: Date.now(), question: '', answer: '' }],
        category: draft.category || 'musica',
        subcategory: draft.subcategory || '',
        price: draft.price || 0,
        address: draft.address || '',
        city: draft.city || '',
        state: draft.state || '',
        country: draft.country || '',
        isOnline: isOnlineFromDraft, // Usar el valor procesado
      });
    }
  }, [draft]);

  // Debug: monitorear cambios en isOnline
  useEffect(() => {
    if (eventData) {
      console.log('🔍 Estado isOnline cambió:', eventData.isOnline);
    }
  }, [eventData?.isOnline]);
  
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
    isOnline: false, // Por defecto siempre presencial
  });

  // Debug inicial del estado
  console.log('🔍 CreateEventScreen inicializado con isOnline:', eventData.isOnline);

  const updateEventData = (updates) => {
    console.log('🔄 updateEventData llamado con:', updates);
    
    setEventData(prev => {
      const newData = { ...prev, ...updates };
      
      // Log específico para cambios en isOnline
      if ('isOnline' in updates) {
        console.log('🔄 updateEventData - Cambio en isOnline:', {
          previous: prev.isOnline,
          new: updates.isOnline,
          final: newData.isOnline,
          type: typeof newData.isOnline
        });
      }
      
      // Log completo del nuevo estado
      console.log('🔄 updateEventData - Nuevo estado completo:', {
        isOnline: newData.isOnline,
        location: newData.location,
        address: newData.address,
        city: newData.city
      });
      
      // Auto-guardar borrador cada vez que cambian los datos
      if (autoSaveEnabled) {
        saveDraftDebounced(newData);
      }
      return newData;
    });
  };

  // Función debounce
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounce para auto-guardar
  const saveDraftDebounced = useCallback(
    debounce(async (data) => {
      if (data.title.trim() || data.resume.trim() || data.about.trim()) {
        const result = await draftService.saveDraft({
          id: draftId,
          ...data,
          userId: user?.user_id
        });
        if (result.success && !draftId) {
          setDraftId(result.draftId);
        }
      }
    }, 2000),
    [draftId, user?.user_id, debounce]
  );

  const handleNextStep = async () => {
    setError('');

    // Validaciones por paso
    if (step === 1) {
      if (!eventData.title.trim() || !eventData.resume.trim() || !eventData.coverImage) {
        setError('Por favor completa el título, resumen y sube una imagen de portada.');
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
      await handleCreateEvent();
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateEvent = async () => {
    // Verificar restricciones de guest antes de crear
    if (restrictedActions.createEvent(navigation)) {
      return;
    }
    
    if (!user?.user_id) {
      setError('Usuario no autenticado. Por favor inicia sesión.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Debug event creation
    const { debugEventCreation, testEventCreationAPI } = require('../utils/eventDebug');
    console.log('🔍 Starting event creation debug...');
    
    // Test API accessibility
    const apiAccessible = await testEventCreationAPI();
    if (!apiAccessible) {
      setError('No se puede conectar con el servidor. Verifica tu conexión.');
      setIsLoading(false);
      return;
    }

    try {
      // Validar que existe imagen
      if (!eventData.coverImage) {
        setError('Debes seleccionar una imagen de portada');
        return;
      }

      console.log('📤 Creando evento con imagen...');
      console.log('🔍 Estado COMPLETO del evento antes de crear:', {
        isOnline: eventData.isOnline,
        isOnlineType: typeof eventData.isOnline,
        location: eventData.location,
        address: eventData.address,
        city: eventData.city,
        state: eventData.state,
        country: eventData.country,
        locationCoords: eventData.locationCoords,
        fullEventData: eventData
      });

      // Verificar accesibilidad de la imagen usando Image.getSize
      console.log('🔍 Verificando accesibilidad de la imagen...');
      await new Promise((resolve, reject) => {
        Image.getSize(
          eventData.coverImage,
          (width, height) => {
            console.log('✅ Imagen accesible:', { width, height, uri: eventData.coverImage });
            resolve();
          },
          (error) => {
            console.error('❌ Error al acceder a la imagen:', error);
            reject(new Error('La imagen seleccionada no es accesible. Por favor selecciona una imagen válida.'));
          }
        );
      });
      
      // Crear evento con imagen directamente
      const eventPayload = {
        title: eventData.title,
        description: eventData.about,
        resume: eventData.resume,
        organizer_id: user.user_id,
        date_time: eventData.date,
        end_date_time: eventData.endDate,
        online: eventData.isOnline === true, // Asegurar que sea boolean
        category: eventData.category,
        subcategory: eventData.subcategory || '',
        price: eventData.price || 0,
        video_url: eventData.videoUrl || '',
        coverImageFile: eventData.coverImage, // URI de la imagen
        faqs: eventData.faqs.filter(faq => faq.question.trim() && faq.answer.trim())
      };

      // Logging detallado para faqs y location
      console.log('🔍 Logging detallado para faqs:', {
        originalFaqs: eventData.faqs,
        filteredFaqs: eventPayload.faqs,
        faqsCount: eventPayload.faqs.length,
        faqsType: typeof eventPayload.faqs,
        faqsSample: eventPayload.faqs.slice(0, 1)
      });
      
      console.log('🔍 Payload inicial:', {
        online: eventPayload.online,
        onlineType: typeof eventPayload.online,
        isOnline: eventData.isOnline,
        isOnlineType: typeof eventData.isOnline,
        comparison: eventData.isOnline === true,
        strictComparison: eventData.isOnline === false
      });
      
      if (!eventData.isOnline) {
        // Evento presencial
        eventPayload.address = eventData.address || '';
        eventPayload.city = eventData.city || '';
        eventPayload.state = eventData.state || '';
        eventPayload.country = eventData.country || '';

        if (eventData.locationCoords && eventData.locationCoords.lat && eventData.locationCoords.lng) {
          eventPayload.latitude = eventData.locationCoords.lat;
          eventPayload.longitude = eventData.locationCoords.lng;
          // Formato GeoJSON correcto para el backend
          eventPayload.location = {
            type: "Point",
            coordinates: [eventData.locationCoords.lng, eventData.locationCoords.lat] // [longitude, latitude]
          };
          console.log('🗺️ CreateEvent: Setting GeoJSON location:', eventPayload.location);
        } else {
          // Para eventos sin coordenadas específicas, NO enviar el campo location
          console.log('🗺️ CreateEvent: No coordinates, not setting location field');
          // Importante: NO establecer eventPayload.location para evitar confusión
        }
      } else {
        // Para eventos online, establecer location como "Online" string
        console.log('🌐 CreateEvent: Online event, setting location as Online');
        eventPayload.location = "Online";
      }

      // Logging detallado para location
      console.log('🔍 Logging detallado para location:', {
        isOnline: eventData.isOnline,
        locationValue: eventPayload.location,
        locationType: typeof eventPayload.location,
        hasCoordinates: !!eventData.locationCoords,
        coordinates: eventData.locationCoords
      });

      console.log('🔍 Payload final antes de enviar:', {
        online: eventPayload.online,
        hasLocation: !!eventPayload.location,
        hasAddress: !!eventPayload.address,
        hasCity: !!eventPayload.city,
        fullPayload: eventPayload
      });
      
      // Debug validation
      const isValid = await debugEventCreation(eventPayload);
      if (!isValid) {
        setError('Error en la validación de datos del evento.');
        setIsLoading(false);
        return;
      }

      const newEvent = await createEvent(eventPayload);
      
      console.log('✅ Evento creado, respuesta del backend:', {
        online: newEvent.online,
        location: newEvent.location,
        address: newEvent.address
      });
      addEventToList(newEvent);
      
      // Eliminar borrador después de crear evento exitosamente
      if (draftId) {
        await draftService.deleteDraft(draftId);
      }
      
      setModalVisible(true);
      
      // Navegar después de un breve delay para mostrar la animación
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('EventDetails', { eventId: newEvent.event_id || newEvent.id });
      }, 2000);
    } catch (e) {
      console.error('Error al crear evento:', e);
      const errorMessage = e.message || 'Ocurrió un error al crear el evento. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    // Verificar que eventData esté inicializado
    if (!eventData) {
      console.log('⚠️ eventData no está inicializado aún')
      return null;
    }

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
        title="Crear Evento"
        subtitle={`Paso ${step} de 4`}
        onBack={handlePreviousStep}
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('DraftsScreen')}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
            }}
          >
            <Ionicons name="document-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        }
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
                {step === 4 ? 'Crear Evento' : 'Continuar'}
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

export default CreateEventScreen;

