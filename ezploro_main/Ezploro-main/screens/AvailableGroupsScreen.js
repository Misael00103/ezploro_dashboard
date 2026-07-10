"use client"

import { useState, useEffect, useCallback } from "react"
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
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import { useEvents } from "../context/EventContext"
import { useChat } from "../context/ChatContext"
import { useThumbnailImageUrl } from "../hooks/useImageUrl"
import { normalizeImageUrl } from "../utils/image"
import { API_URL_EVENTS, BASE_URL_IMAGE, BASE_URL } from "../config"

// Consistent color palette with CreateGroupScreen
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#1a1a1a';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';
const DIVIDER_COLOR_DARK = '#3A3F47';

const COLORS = {
  background: BACKGROUND_DARK,
  surface: CARD_BACKGROUND_DARK,
  card: CARD_BACKGROUND_DARK,
  text: TEXT_PRIMARY_DARK,
  textSecondary: TEXT_SECONDARY_DARK,
  border: DIVIDER_COLOR_DARK,
  accent: PRIMARY_COLOR,
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  purple: "#AF52DE",
  pink: "#FF2D92",
  orange: "#FF9500",
  green: "#30D158",
  blue: PRIMARY_COLOR,
  indigo: "#5856D6",
  teal: "#5AC8FA",
  yellow: "#FFCC00",
}

const AVATAR_COLORS = [
  PRIMARY_COLOR,
  COLORS.green,
  COLORS.purple,
  COLORS.pink,
  COLORS.orange,
  COLORS.teal,
  COLORS.indigo,
  COLORS.yellow,
]

export default function AvailableGroupsScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user, token } = useAuth()
  const { socket, isConnected } = useSocket()
  const { events, subscribedEvents, subscribeToEvent, fetchEvents } = useEvents()
  const { joinEventChat } = useChat()
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())

  // Función mejorada para obtener URL de imagen del evento
  const getEventImageUrl = useCallback((event) => {
    if (!event) return null
    
    // Priorizar diferentes campos de imagen
    const imageFields = [
      event.cover_image,
      event.image,
      event.event_image,
      event.image_url,
      event.thumbnail,
      event.photo
    ]
    
    for (const imageField of imageFields) {
      if (imageField && typeof imageField === 'string' && imageField.trim() !== '') {
        const normalizedUrl = normalizeImageUrl(imageField)
        console.log(`🖼️ Using image field for ${event.title}:`, imageField, '→', normalizedUrl)
        return normalizedUrl
      }
    }
    
    console.log(`⚠️ No valid image found for event ${event.title}`)
    return null
  }, [])

  const getAvatarColor = useCallback((title) => {
    const index = title ? title.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }, [])

  const fetchAvailableGroups = useCallback(async () => {
    if (!refreshing) setLoadingGroups(true)
    try {
      console.log("📋 Fetching available events/groups...")
      await fetchEvents()
      console.log("✅ Available groups data loaded:", events.length)
    } catch (error) {
      console.error("❌ Error fetching available groups:", error)
      Alert.alert("Error", "Failed to load available groups.")
    } finally {
      setLoadingGroups(false)
      setRefreshing(false)
    }
  }, [fetchEvents, refreshing])

  // Verificar si el usuario está suscrito a un evento
  const isSubscribedToEvent = useCallback((eventId) => {
    return subscribedEvents.includes(parseInt(eventId))
  }, [subscribedEvents])

  const joinGroup = useCallback(
    async (event) => {
      if (!user?.user_id || !token) {
        Alert.alert("Error", "You must be logged in to join a group.")
        return
      }

      setJoiningGroup(event.event_id)

      try {
        console.log(`📝 Subscribing to event ${event.event_id}: ${event.title}`)
        
        // Suscribirse al evento usando el contexto
        await subscribeToEvent(event.event_id)
        
        // Unirse al chat del evento
        try {
          await joinEventChat(event.event_id)
          console.log(`✅ Successfully joined event chat: ${event.event_id}`)
        } catch (chatError) {
          console.warn("⚠️ Could not join event chat, but subscription successful:", chatError.message)
        }

        // Notificar via socket que se unió a un nuevo evento
        if (socket && isConnected) {
          socket.emit('user-joined-event', {
            userId: user.user_id,
            eventId: event.event_id,
            eventTitle: event.title
          })
        }

        Alert.alert("Success", `You've joined "${event.title}"! You can now chat with other participants.`, [
          {
            text: "Go to Chat",
            onPress: () => {
              // Navegar al chat y luego volver a ChatMainScreen para que se actualice
              navigation.navigate("ChatScreen", { event })
            },
          },
          {
            text: "View in Messages",
            onPress: () => {
              // Navegar directamente a ChatMainScreen para ver el nuevo chat
              navigation.navigate("ChatMainScreen")
            },
          },
          {
            text: "Stay Here",
            style: "cancel",
          },
        ])
      } catch (error) {
        console.error("❌ Error joining group:", error)
        Alert.alert("Error", error.message || "Failed to join group. Please try again.")
      } finally {
        setJoiningGroup(null)
      }
    },
    [user?.user_id, token, subscribeToEvent, joinEventChat, navigation],
  )

  useEffect(() => {
    fetchAvailableGroups()
  }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAvailableGroups()
    })
    return unsubscribe
  }, [navigation, fetchAvailableGroups])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAvailableGroups()
  }, [fetchAvailableGroups])

  // Componente para mostrar la imagen del evento
  const EventImage = ({ event }) => {
    const avatarColor = getAvatarColor(event.title)
    const initials = event.title ? event.title.substring(0, 2).toUpperCase() : "EV"
    
    // Obtener la URL de la imagen del evento
    const imageUrl = getEventImageUrl(event)
    
    console.log(`🖼️ EventImage for ${event.title}:`, {
      cover_image: event.cover_image,
      image: event.image,
      event_image: event.event_image,
      image_url: event.image_url,
      finalUrl: imageUrl
    })

    if (imageUrl && !failedImages.has(event.event_id)) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={styles.groupImage}
          resizeMode="cover"
          onError={(error) => {
            console.log(`❌ Image load error for event ${event.title}:`, error.nativeEvent.error)
            console.log(`🔗 Failed URL: ${imageUrl}`)
            // Marcar esta imagen como fallida para mostrar el placeholder
            setFailedImages(prev => new Set([...prev, event.event_id]))
          }}
          onLoad={() => {
            console.log(`✅ Image loaded successfully for event ${event.title}`)
            // Remover de la lista de fallidas si se carga exitosamente
            setFailedImages(prev => {
              const newSet = new Set(prev)
              newSet.delete(event.event_id)
              return newSet
            })
          }}
        />
      )
    }

    return (
      <View style={[styles.groupImagePlaceholder, { backgroundColor: avatarColor }]}>
        <Text style={styles.groupImageText}>{initials}</Text>
      </View>
    )
  }

  const renderGroupItem = ({ item }) => {
    const isJoined = isSubscribedToEvent(item.event_id)
    const isJoining = joiningGroup === item.event_id

    return (
      <TouchableOpacity
        style={[styles.groupCard, isJoined && styles.joinedGroupCard]}
        onPress={() => {
          if (isJoined) {
            navigation.navigate("ChatScreen", { event: item })
          } else {
            joinGroup(item)
          }
        }}
        activeOpacity={0.8}
        disabled={isJoining}
      >
        <View style={styles.groupImageContainer}>
          <EventImage event={item} />
          {isJoined && (
            <View style={styles.joinedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
        </View>

        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.groupDescription} numberOfLines={3}>
                {item.description}
              </Text>
            )}
            
            {/* Información adicional del evento */}
            <View style={styles.eventMeta}>
              {item.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
              {item.subscribers_count > 0 && (
                <Text style={styles.subscribersText}>
                  {item.subscribers_count} member{item.subscribers_count !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.groupActions}>
            {isJoining ? (
              <View style={[styles.actionButton, styles.joiningButton]}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.actionButtonText}>Joining...</Text>
              </View>
            ) : isJoined ? (
              <View style={[styles.actionButton, styles.joinedButton]}>
                <Ionicons name="chatbubbles" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Open Chat</Text>
              </View>
            ) : (
              <View style={[styles.actionButton, styles.joinButton]}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Join Group</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Available Groups</Text>
              <Text style={styles.headerSubtitle}>
                {events.length} groups • {subscribedEvents.length} joined
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {/* Groups List */}
          {loadingGroups && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading available groups...</Text>
            </View>
          ) : events.length > 0 ? (
            <FlatList
              data={events}
              keyExtractor={(item) => String(item.event_id)}
              renderItem={renderGroupItem}
              contentContainerStyle={styles.groupsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No groups available</Text>
              <Text style={styles.emptySubtitle}>Check back later for new groups to join</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableGroups}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  groupsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  joinedGroupCard: {
    backgroundColor: "rgba(48, 209, 88, 0.1)",
    borderColor: "rgba(48, 209, 88, 0.3)",
  },
  groupImageContainer: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 12,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
  },
  groupImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  groupImageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  joinedIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  eventMeta: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  subscribersText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  groupActions: {
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: "center",
  },
  joinButton: {
    backgroundColor: COLORS.accent,
  },
  joinedButton: {
    backgroundColor: COLORS.success,
  },
  joiningButton: {
    backgroundColor: COLORS.textSecondary,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  separator: {
    height: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 50,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
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
})
