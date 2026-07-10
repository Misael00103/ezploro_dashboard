import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import PageHeader from '../components/common/PageHeader';
import EventCard from '../components/events/EventCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const EventsListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { events = [], likeEvent, likedEvents } = useEvents();
  const { user } = useAuth();

  // Obtener título desde los parámetros de navegación
  const title = route.params?.title || 'Eventos';
  const filteredEvents = route.params?.events || events;

  const handleLikeEvent = async (eventId) => {
    if (!user || !user.user_id) {
      return;
    }
    try {
      await likeEvent(eventId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (!Array.isArray(filteredEvents)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
        <PageHeader title={title} onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner size="lg" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <PageHeader title={title} onBack={() => navigation.goBack()} />

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {filteredEvents.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingBottom: 80 }}>
            {filteredEvents.map((event, index) => (
              <EventCard
                key={`event-${event.event_id || event.id}-${index}`}
                event={event}
                onPress={() => navigation.navigate('EventDetails', { eventId: event.event_id || event.id })}
                onLike={handleLikeEvent}
                isLiked={likedEvents.includes(event.event_id || event.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="📅"
            title="No hay eventos"
            description="No se encontraron eventos que coincidan con tu búsqueda."
            actionLabel="Ver todos los eventos"
            onAction={() => navigation.navigate('Events')}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default EventsListScreen;
