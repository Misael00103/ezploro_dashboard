import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useTheme } from '../context/ThemeContext';
import { useGuestRestrictions } from '../hooks/useGuestRestrictions';
import draftService from '../services/draftService';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#0F0F23';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';

const EventsYoureHostingScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const { events, loading, updateEvent, deleteEvent, refreshAllData } = useEvents();
  const { user } = useAuth();
  const { restrictedActions } = useGuestRestrictions();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, published, draft
  const [drafts, setDrafts] = useState([]);

  const userId = useMemo(() => user?.user_id, [user?.user_id]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const loadDrafts = useCallback(async () => {
    try {
      const draftsList = await draftService.getDraftsList();
      setDrafts(draftsList);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (refreshing || !refreshAllData) return;

    setRefreshing(true);
    try {
      await refreshAllData();
      await loadDrafts();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData, refreshing, loadDrafts]);

  const filteredEvents = useMemo(() => {
    if (!userId) return [];

    // Si el filtro es 'draft', mostrar solo borradores del draftService
    if (filterType === 'draft') {
      let filteredDrafts = drafts;
      
      if (searchQuery.trim()) {
        filteredDrafts = drafts.filter(
          (draft) =>
            draft.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            draft.resume?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            draft.about?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return filteredDrafts;
    }

    // Para 'all' y 'published', usar eventos del backend
    if (!events || !Array.isArray(events)) return [];

    let userEvents = events.filter((event) => {
      return event.organizer_id === parseInt(userId) || event.creator_id === parseInt(userId);
    });

    if (filterType === 'published') {
      userEvents = userEvents.filter((event) => event.status !== 'draft' && !event.is_draft);
    }

    if (searchQuery.trim()) {
      userEvents = userEvents.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return userEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [events, userId, searchQuery, filterType, drafts]);

  const openEditModal = useCallback((event) => {
    setEditingEvent(event);
    setEditModalVisible(true);
  }, []);

  const handleDeleteEvent = useCallback(
    (event) => {
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que quieres eliminar "${event.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              deleteEvent(event.event_id)
                .then((result) => {
                  if (result.success) {
                    Alert.alert('Éxito', 'Evento eliminado exitosamente');
                  } else {
                    Alert.alert('Error', result.message || 'No se pudo eliminar el evento');
                  }
                })
                .catch((error) => {
                  console.error('Error deleting event:', error);
                  Alert.alert('Error', 'No se pudo eliminar el evento');
                });
            }
          }
        ]
      );
    },
    [deleteEvent]
  );

  const EventItem = React.memo(({ event }) => {
    const isDraft = event.status === 'draft' || event.is_draft || filterType === 'draft';
    const isLocalDraft = filterType === 'draft';

    return (
      <View style={[styles.eventCard, isDraft && styles.draftCard]}>
        <TouchableOpacity
          style={styles.eventContent}
          onPress={() => {
            if (isLocalDraft) {
              if (restrictedActions.createEvent(navigation)) {
                return; // La alerta ya se mostró
              }
              navigation.navigate('CreateEvent', { draft: event });
            } else if (event.event_id) {
              navigation.navigate('EventDetails', { event: event, eventId: event.event_id });
            } else {
              Alert.alert('Error', 'Este evento no tiene un ID válido');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleContainer}>
              {isDraft && (
                <View style={styles.draftBadge}>
                  <Text style={styles.draftBadgeText}>BORRADOR</Text>
                </View>
              )}
              <Text style={styles.eventTitle}>{event.title}</Text>
            </View>
            <Text style={styles.eventDate}>
              {isLocalDraft && event.lastModified
                ? new Date(event.lastModified).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : event.date_time
                ? new Date(event.date_time).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Sin fecha'
              }
            </Text>
          </View>

          {(event.description || event.resume || event.about) && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description || event.resume || event.about}
            </Text>
          )}

          <View style={styles.eventFooter}>
            <View style={styles.eventStats}>
              {event.city && (
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={14} color="#B8B8D9" />
                  <Text style={styles.statText}>{event.city}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color="#B8B8D9" />
                <Text style={styles.statText}>{event.subscribers_count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={14} color="#B8B8D9" />
                <Text style={styles.statText}>{event.likes || 0}</Text>
              </View>
            </View>
            <Text style={styles.eventPrice}>
              {event.price && parseFloat(event.price) > 0 ? `$${event.price}` : 'Gratis'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.eventActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              if (isLocalDraft) {
                if (restrictedActions.createEvent(navigation)) {
                  return; // La alerta ya se mostró
                }
                navigation.navigate('CreateEvent', { draft: event });
              } else {
                navigation.navigate('EditEvent', { event });
              }
            }}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              if (isLocalDraft) {
                Alert.alert(
                  'Eliminar Borrador',
                  `¿Estás seguro de que quieres eliminar el borrador "${event.title || 'Sin título'}"?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: async () => {
                        const result = await draftService.deleteDraft(event.id);
                        if (result.success) {
                          setDrafts(prev => prev.filter(d => d.id !== event.id));
                        }
                      },
                    },
                  ]
                );
              } else {
                handleDeleteEvent(event);
              }
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  return (
    <View style={styles.blackContainer}>
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_DARK} />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eventos que Organizas</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#B8B8D9" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar eventos..."
              placeholderTextColor="#B8B8D9"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {['all', 'published', 'draft'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  filterType === filter && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(filter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === filter && styles.filterButtonTextActive
                ]}>
                  {filter === 'all' ? 'Todos' : filter === 'published' ? 'Publicados' : 'Borradores'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.content}
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
          ) : filteredEvents.length > 0 ? (
            <>
              <View style={styles.statsHeader}>
                <Text style={styles.statsText}>
                  {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {filteredEvents.map((event) => (
                <EventItem key={event.event_id} event={event} />
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#B8B8D9" />
              <Text style={styles.emptyTitle}>No hay eventos</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No se encontraron eventos con esos criterios de búsqueda."
                  : "Aún no has creado ningún evento. ¡Crea tu primer evento ahora!"
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    if (restrictedActions.createEvent(navigation)) {
                      return; // La alerta ya se mostró
                    }
                    navigation.navigate('CreateEvent');
                  }}
                >
                  <Text style={styles.createButtonText}>Crear Evento</Text>
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: TEXT_PRIMARY_DARK,
    fontSize: 16,
    marginLeft: 10,
  },
  filterContainer: {
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  filterButtonText: {
    color: TEXT_SECONDARY_DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statsText: {
    color: TEXT_SECONDARY_DARK,
    fontSize: 14,
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: CARD_BACKGROUND_DARK,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  draftCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  eventContent: {
    padding: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 15,
  },
  draftBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
    lineHeight: 24,
  },
  eventDate: {
    fontSize: 14,
    color: TEXT_SECONDARY_DARK,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: TEXT_SECONDARY_DARK,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  eventActions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  deleteButton: {
    backgroundColor: '#FF4757',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: TEXT_SECONDARY_DARK,
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_PRIMARY_DARK,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_SECONDARY_DARK,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsYoureHostingScreen;
