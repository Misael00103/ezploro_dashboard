import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { normalizeImageUrl } from '../utils/image';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

// Consistent color palette with CreateGroupScreen
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#1a1a1a';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';
const DIVIDER_COLOR_DARK = '#3A3F47';

export default function RankingScreen({ navigation }) {
  const { darkMode } = useTheme();
  const { token } = useAuth();
  const [category, setCategory] = useState('users-most-subscribed');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoints = {
        'users-most-subscribed': `${BASE_URL}/ranking/usuarios-mas-suscritos`,
        ' users-most-points': `${BASE_URL}/ranking/usuarios-mas-puntos`,
        'users-most-likes-given': `${BASE_URL}/ranking/usuarios-mas-likes-dados`,
        'users-most-comments': `${BASE_URL}/ranking/usuarios-mas-comentarios`,
        'users-most-events-created': `${BASE_URL}/ranking/usuarios-mas-eventos-creados`,
        'events-most-subscribed': `${BASE_URL}/ranking/eventos-mas-suscritos`,
        'events-most-likes': `${BASE_URL}/ranking/eventos-mas-likes`,
      };

      console.log(`Fetching from: ${endpoints[category]}`);
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(endpoints[category], { headers });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Requiere inicio de sesión para ver rankings');
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('API Response:', data);

      // Normalizar los datos según la estructura de la API
      let list = [];
      if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data)) {
        list = data;
      } else if (data.result && Array.isArray(data.result)) {
        list = data.result;
      }

      // Procesar y normalizar los datos para usuarios
      if (category.startsWith('users-')) {
        list = list.map((item, index) => {
          // Extraer datos del usuario desde diferentes estructuras posibles
          const user = item.user || item;
          const profileData = user.profile || user;

          return {
            ...item,
            rank: item.rank || index + 1,
            id: item.id || item.user_id || user.user_id || index,
            // Datos del usuario
            user_id: user.user_id,
            username: user.username || profileData.username,
            display_name: user.display_name || profileData.display_name || profileData.name,
            profile_picture: user.profile_picture || profileData.profile_picture || profileData.avatar,
            // Métricas según la categoría
            total_suscripciones: item.total_suscripciones || item.count || 0,
            total_points: item.total_points || item.points || 0,
            total_likes_dados: item.total_likes_dados || item.count || 0,
            total_comentarios: item.total_comentarios || item.count || 0,
            total_eventos_creados: item.total_eventos_creados || item.count || 0,
          };
        });
      }

      // Procesar y normalizar los datos para eventos
      if (category.startsWith('events-')) {
        list = list.map((item, index) => {
          const event = item.event || item;

          return {
            ...item,
            rank: item.rank || index + 1,
            id: item.id || item.event_id || event.event_id || index,
            // Datos del evento
            event_id: event.event_id,
            title: event.title || event.name,
            cover_image: event.cover_image || event.image,
            // Métricas
            total_suscriptores: item.total_suscriptores || item.count || 0,
            total_likes: item.total_likes || item.count || 0,
          };
        });
      }

      console.log('Processed list:', list);
      setItems(list);
    } catch (e) {
      console.error('Error fetching rankings:', e);
      setError(e.message || 'Error loading rankings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, token]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const getPodiumColors = (position) => {
    switch (position) {
      case 1:
        return { bg: '#8B5CF6', medal: '#FFD700' }; // Purple bg, gold medal
      case 2:
        return { bg: '#FCD34D', medal: '#C0C0C0' }; // Yellow bg, silver medal
      case 3:
        return { bg: '#D1D5DB', medal: '#CD7F32' }; // Gray bg, bronze medal
      default:
        return { bg: '#E5E7EB', medal: '#9CA3AF' };
    }
  };

  const renderPodiumUser = (user, index) => {
    if (!user) return null;

    const position = index + 1;
    const colors = getPodiumColors(position);
    const isFirst = position === 1;
    const containerStyle = isFirst ? styles.firstPlace : styles.otherPlace;

    // Determinar si es un evento o usuario y obtener datos correctos
    const isEvent = !!user.event_id;
    let avatar = null;
    let name = 'Usuario';
    let metric = 0;

    if (isEvent) {
      avatar = user.cover_image || user.image;
      name = user.title || user.name || 'Evento';
      metric = user.total_suscriptores || user.total_likes || user.count || 0;
    } else {
      // Para usuarios, buscar en diferentes campos según el tipo de ranking
      avatar = user.profile_picture || user.avatar || user.profile_image;
      name = user.display_name || user.username || user.name || 'Usuario';

      // Obtener métrica según la categoría
      switch (category) {
        case 'users-most-subscribed':
          metric = user.total_suscripciones || user.count || 0;
          break;
        case 'users-most-points':
          metric = user.total_points || user.points || user.count || 0;
          break;
        case 'users-most-likes-given':
          metric = user.total_likes_dados || user.count || 0;
          break;
        case 'users-most-comments':
          metric = user.total_comentarios || user.count || 0;
          break;
        case 'users-most-events-created':
          metric = user.total_eventos_creados || user.count || 0;
          break;
        default:
          metric = user.count || 0;
      }
    }

    return (
      <View key={user.id || index} style={[containerStyle, { order: position === 2 ? 1 : position }]}>
        <View style={[styles.podiumAvatar, { backgroundColor: colors.bg }, isFirst && styles.firstPlaceAvatar]}>
          {avatar ? (
            <Image
              source={{ uri: normalizeImageUrl(avatar) }}
              style={[styles.avatarImage, isFirst && styles.firstPlaceAvatarImage]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, isFirst && styles.firstPlaceAvatarPlaceholder]}>
              <Text style={[styles.avatarPlaceholderText, isFirst && styles.firstPlaceAvatarPlaceholderText]}>
                {name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.medalBadge, { backgroundColor: colors.medal }]}>
            <Text style={styles.medalText}>{position}</Text>
          </View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.podiumMetric}>{metric}</Text>
      </View>
    );
  };

  const renderListItem = ({ item, index }) => {
    if (!item) return null;

    const isEvent = !!item.event_id;
    const position = item.rank || index + 1;

    // Obtener datos correctos para eventos o usuarios
    let avatar = null;
    let name = 'Usuario';
    let metric = 0;

    if (isEvent) {
      avatar = item.cover_image || item.image;
      name = item.title || item.name || 'Evento';
      metric = item.total_suscriptores || item.total_likes || item.count || 0;
    } else {
      // Para usuarios, buscar en diferentes campos según el tipo de ranking
      avatar = item.profile_picture || item.avatar || item.profile_image;
      name = item.display_name || item.username || item.name || 'Usuario';

      // Obtener métrica según la categoría
      switch (category) {
        case 'users-most-subscribed':
          metric = item.total_suscripciones || item.count || 0;
          break;
        case 'users-most-points':
          metric = item.total_points || item.points || item.count || 0;
          break;
        case 'users-most-likes-given':
          metric = item.total_likes_dados || item.count || 0;
          break;
        case 'users-most-comments':
          metric = item.total_comentarios || item.count || 0;
          break;
        case 'users-most-events-created':
          metric = item.total_eventos_creados || item.count || 0;
          break;
        default:
          metric = item.count || 0;
      }
    }

    return (
      <View style={styles.listItem}>
        <Text style={styles.positionNumber}>{position}</Text>
        {avatar ? (
          <Image source={{ uri: normalizeImageUrl(avatar) }} style={styles.listAvatar} />
        ) : (
          <View style={styles.listAvatarPlaceholder}>
            <Text style={styles.listAvatarPlaceholderText}>
              {name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.listUserInfo}>
          <Text style={styles.listUserName} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={styles.listMetric}>
          <Text style={styles.listMetricText}>{metric}</Text>
        </View>
      </View>
    );
  };

  const getCategoryLabel = () => {
    const labels = {
      'users-most-subscribed': 'Top Suscriptores',
      'users-most-points': 'Puntos',
      'users-most-likes-given': 'Likes dados',
      'users-most-comments': 'Comentarios',
      'users-most-events-created': 'Eventos creados',
      'events-most-subscribed': 'Eventos suscritos',
      'events-most-likes': 'Eventos con likes',
    };
    return labels[category] || 'Ranking';
  };

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Event Rankings</Text>
              <Text style={styles.headerSubtitle}>
                {getCategoryLabel()}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Primero mostrar los usuarios del ranking */}
          {loading ? (
            <View style={{ padding: 24 }}>
              <Text style={{ color: '#fff' }}>Cargando...</Text>
            </View>
          ) : error ? (
            <View style={{ padding: 24 }}>
              <Text style={{ color: '#ff6b6b' }}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Podium para los primeros 3 lugares */}
              {items.length >= 3 && (
                <View style={styles.podiumContainer}>
                  <Text style={styles.podiumTitle}>Top 3</Text>
                  <View style={styles.podiumRow}>
                    {renderPodiumUser(items[1], 1)} {/* 2do lugar */}
                    {renderPodiumUser(items[0], 0)} {/* 1er lugar */}
                    {renderPodiumUser(items[2], 2)} {/* 3er lugar */}
                  </View>
                </View>
              )}

              {/* Lista completa de rankings */}
              {items.length > 0 ? (
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={renderListItem}
                  ListHeaderComponent={
                    items.length >= 3 ? (
                      <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>Ranking Completo</Text>
                      </View>
                    ) : null
                  }
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="trophy-outline" size={48} color="#b0b0b0" />
                  <Text style={styles.emptyText}>No hay datos disponibles</Text>
                  <Text style={styles.emptySubtext}>Selecciona otra categoría</Text>
                </View>
              )}
            </>
          )}

          {/* Botones de categorías debajo del contenido */}
          <View style={styles.categoryTabs}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={styles.categoryTitle}>Cambiar Categoría</Text>
              <Ionicons
                name={showCategories ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.tabsContainer}>
                {[
                  { key: 'users-most-subscribed', label: 'Top Suscriptores', icon: 'people' },
                  { key: 'users-most-points', label: 'Puntos', icon: 'star' },
                  { key: 'users-most-likes-given', label: 'Likes dados', icon: 'heart' },
                  { key: 'users-most-comments', label: 'Comentarios', icon: 'chatbubble' },
                  { key: 'users-most-events-created', label: 'Eventos creados', icon: 'calendar' },
                  { key: 'events-most-subscribed', label: 'Eventos suscritos', icon: 'people-circle' },
                  { key: 'events-most-likes', label: 'Eventos con likes', icon: 'heart-circle' },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => {
                      setCategory(tab.key);
                      setShowCategories(false);
                    }}
                    style={[
                      styles.tabPill,
                      category === tab.key && styles.tabPillActive,
                    ]}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={16}
                      color={category === tab.key ? '#fff' : '#6B7280'}
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.tabPillText,
                        category === tab.key && styles.tabPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 2,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  list: {
    paddingBottom: 100,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 100,
    maxWidth: 140,
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#6200EE',
    borderColor: '#6200EE',
    shadowColor: '#6200EE',
    shadowOpacity: 0.3,
  },
  tabPillText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  tabPillTextActive: {
    color: '#fff',
  },
  tabIcon: {
    marginRight: 2,
  },
  podiumContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  podiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
  },
  firstPlace: {
    alignItems: 'center',
    marginHorizontal: 15,
    zIndex: 3,
  },
  otherPlace: {
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 30,
    zIndex: 1,
  },
  podiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  firstPlaceAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  firstPlaceAvatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstPlaceAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  firstPlaceAvatarPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  medalBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  medalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  podiumName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  podiumMetric: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  positionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
    width: 30,
    textAlign: 'center',
  },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 15,
  },
  listAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 15,
  },
  listAvatarPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  listUserInfo: {
    flex: 1,
  },
  listUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listMetric: {
    alignItems: 'flex-end',
  },
  listMetricText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: '500',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0e0e0',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 8,
    textAlign: 'center',
  },
  topBubble: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    zIndex: 0,
  },
});
