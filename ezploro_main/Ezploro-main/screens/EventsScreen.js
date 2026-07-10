import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import useGuestRestrictions from '../hooks/useGuestRestrictions';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#0F0F23';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';

const EventManagementScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const { events, loading, refreshAllData } = useEvents();
  const { restrictedActions } = useGuestRestrictions();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const userId = useMemo(() => user?.user_id, [user?.user_id]);

  const onRefresh = useCallback(async () => {
    if (refreshing || !refreshAllData) return;

    setRefreshing(true);
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData, refreshing]);

  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events) || !userId) {
      return { publishedEvents: [], draftEvents: [] };
    }

    const userCreatedEvents = events.filter((event) => {
      return event.organizer_id === parseInt(userId) || event.creator_id === parseInt(userId);
    });

    const publishedEvents = userCreatedEvents
      .filter((event) => event.status !== 'draft' && !event.is_draft)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    const draftEvents = userCreatedEvents
      .filter((event) => event.status === 'draft' || event.is_draft)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return { publishedEvents, draftEvents };
  }, [events, userId]);

  const { publishedEvents, draftEvents } = filteredEvents;

  const EventCard = React.memo(({ event, onPress, isDraft = false }) => (
    <TouchableOpacity
      style={[styles.eventCard, isDraft && styles.draftCard]}
      onPress={() => onPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.eventContent}>
        {isDraft && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>BORRADOR</Text>
          </View>
        )}
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>
          {new Date(event.date_time).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        {event.city && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#B8B8D9" />
            <Text style={styles.locationText}>{event.city}</Text>
          </View>
        )}
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.statText}>{event.subscribers_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#FF6B6B" />
            <Text style={styles.statText}>{event.likes || 0}</Text>
          </View>
        </View>
      </View>
      <View style={styles.eventActions}>
        <Ionicons name="chevron-forward" size={20} color="#B8B8D9" />
      </View>
    </TouchableOpacity>
  ));

  const QuickActionCard = React.memo(({ icon, title, subtitle, onPress, color = PRIMARY_COLOR }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#B8B8D9" />
    </TouchableOpacity>
  ));

  return (
    <View style={styles.blackContainer}>
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_DARK} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Eventos</Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🎉 Eventos Recientes</Text>
                  {publishedEvents.length > 0 && (
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() => navigation.navigate('EventsYoureHosting')}
                    >
                      <Text style={styles.viewAllText}>Ver todos</Text>
                      <Ionicons name="chevron-forward" size={16} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                  )}
                </View>

                {publishedEvents.length > 0 ? (
                  <>
                    {publishedEvents.map((event) => (
                      <EventCard
                        key={event.event_id}
                        event={event}
                        onPress={() => navigation.navigate('EventDetails', { eventId: event.event_id })}
                      />
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="calendar-outline" size={48} color="#B8B8D9" />
                    <Text style={styles.emptyStateText}>No tienes eventos publicados aún</Text>
                    <TouchableOpacity
                      style={styles.createFirstEventButton}
                      onPress={() => {
                        if (restrictedActions.createEvent(navigation)) {
                          return;
                        }
                        navigation.navigate('CreateEvent');
                      }}
                    >
                      <Text style={styles.createFirstEventText}>Crear mi primer evento</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {draftEvents.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📝 Borradores Recientes</Text>
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() => navigation.navigate('EventsYoureHosting')}
                    >
                      <Text style={styles.viewAllText}>Ver todos</Text>
                      <Ionicons name="chevron-forward" size={16} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                  </View>
                  {draftEvents.map((draft) => (
                    <EventCard
                      key={draft.event_id}
                      event={draft}
                      onPress={() => navigation.navigate('EventDetails', { eventId: draft.event_id })}
                      isDraft={true}
                    />
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚀 Acciones Rápidas</Text>
                <QuickActionCard
                  icon="add-circle-outline"
                  title="Crear Evento"
                  subtitle="Organiza un nuevo evento"
                  onPress={() => {
                    if (restrictedActions.createEvent(navigation)) {
                      return;
                    }
                    navigation.navigate('CreateEvent');
                  }}
                  color={PRIMARY_COLOR}
                />
                <QuickActionCard
                  icon="calendar-outline"
                  title="Todos los Eventos"
                  subtitle="Ver y gestionar todos tus eventos"
                  onPress={() => navigation.navigate('EventsYoureHosting')}
                  color="#4CAF50"
                />
                <QuickActionCard
                  icon="help-circle-outline"
                  title="Centro de Ayuda"
                  subtitle="Encuentra respuestas a tus preguntas"
                  onPress={() => navigation.navigate('HelpCenter')}
                  color="#9C27B0"
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_DARK,
  },
  topBubble: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    zIndex: 0,
  },
  bottomBubble: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: CARD_BACKGROUND_DARK,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    color: TEXT_SECONDARY_DARK,
    fontSize: 16,
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: TEXT_SECONDARY_DARK,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  createFirstEventButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstEventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  draftCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  draftBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  draftBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 14,
    color: TEXT_SECONDARY_DARK,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: TEXT_SECONDARY_DARK,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: TEXT_SECONDARY_DARK,
    fontWeight: '500',
  },
  eventActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY_DARK,
  },
});

export default EventManagementScreen;

