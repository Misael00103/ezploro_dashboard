"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import RealtimeToast from "../components/RealtimeToast"
import { BASE_URL } from "../config"
import { normalizeImageUrl } from "../utils/image"
import socketService from "../services/socketService"

// Consistent color palette
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
}

const AVATAR_COLORS = [PRIMARY_COLOR, "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]

export default function EventChatsListScreen({ navigation }) {
  const { user, token } = useAuth()
  const { loading } = useChat()

  // Hook para notificaciones toast
  const { toasts, hideToast } = useToast()

  const [eventChats, setEventChats] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const lastFetchRef = useRef(0)

  // Hook para actualizaciones en tiempo real de la lista de chats de eventos
  const { isConnected: socketConnected } = useRealTimeUpdates({
    onNewMessage: (messageData) => {
      console.log("💬 EventChatsListScreen: Nuevo mensaje de evento recibido", messageData)
      if (messageData.eventId) {
        updateEventChatWithNewMessage(messageData)
      }
    },
    autoJoinUserRoom: true
  })

  // Función para actualizar chat de evento con nuevo mensaje
  const updateEventChatWithNewMessage = useCallback((messageData) => {
    setEventChats(prev => {
      const updatedChats = [...prev]
      const chatIndex = updatedChats.findIndex(chat => 
        chat.eventId === messageData.eventId
      )

      if (chatIndex >= 0) {
        // Actualizar chat existente
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: messageData.content || messageData.message || "New message",
          lastMessageTime: messageData.created_at || messageData.createdAt || new Date().toISOString(),
          lastMessageSender: messageData.sender?.name || messageData.senderName || 'Usuario',
          unreadCount: messageData.sender?.id !== user?.user_id ?
            (updatedChats[chatIndex].unreadCount || 0) + 1 : 0
        }

        // Mover al principio de la lista
        const updatedChat = updatedChats.splice(chatIndex, 1)[0]
        return [updatedChat, ...updatedChats]
      }

      return updatedChats
    })
  }, [user?.user_id])

  const getFullImageUrl = useCallback((relativePath) => {
    if (!relativePath) return null

    // Si ya es una URL completa, usarla directamente
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return relativePath
    }

    // Si es una ruta relativa, construir la URL completa
    if (relativePath.startsWith("/")) {
      return `${BASE_URL.replace('/api', '')}${relativePath}`
    }

    // Usar la función normalizeImageUrl como fallback
    return normalizeImageUrl(relativePath)
  }, [])

  const getAvatarColor = useCallback((name) => {
    const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }, [])

  const getCategoryIcon = useCallback((category) => {
    const categoryIcons = {
      'musica': 'musical-notes',
      'deportes': 'football',
      'tecnologia': 'laptop',
      'arte': 'brush',
      'comida': 'restaurant',
      'educacion': 'school',
      'negocios': 'briefcase',
      'salud': 'fitness',
      'entretenimiento': 'game-controller',
      'viajes': 'airplane',
    }
    return categoryIcons[category] || 'calendar'
  }, [])

  // Fetch event chats - simulado por ahora, necesitarás implementar el endpoint
  const fetchEventChats = useCallback(async () => {
    if (!user || !user.user_id || !token) {
      console.warn("[EventChatsListScreen] Missing user, user_id, or token")
      setEventChats([])
      setRefreshing(false)
      return
    }

    // Debouncing
    const now = Date.now()
    if (now - lastFetchRef.current < 2000 && !refreshing) {
      console.log("[EventChatsListScreen] Debouncing fetch call")
      return
    }
    lastFetchRef.current = now

    if (isFetching && !refreshing) return
    setIsFetching(true)
    if (!refreshing) setRefreshing(true)

    try {
      console.log(`[EventChatsListScreen] Fetching event chats for user: ${user.user_id}`)

      // TODO: Implementar endpoint para obtener chats de eventos del usuario
      // Por ahora, datos simulados
      const mockEventChats = [
        {
          eventId: 1,
          eventTitle: "Concierto de Bachata en Vivo",
          eventCategory: "musica",
          eventImage: "https://res.cloudinary.com/dxa1augjh/image/upload/v1760402516/events/concert.jpg",
          lastMessage: "¡Nos vemos en el concierto!",
          lastMessageTime: new Date().toISOString(),
          lastMessageSender: "María",
          unreadCount: 2,
          participantsCount: 45,
        },
        {
          eventId: 2,
          eventTitle: "Festival Gastronómico Dominicano",
          eventCategory: "comida",
          eventImage: "https://res.cloudinary.com/dxa1augjh/image/upload/v1760402516/events/food.jpg",
          lastMessage: "¿Alguien sabe si habrá vegetariano?",
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          lastMessageSender: "Carlos",
          unreadCount: 0,
          participantsCount: 23,
        },
      ]

      setEventChats(mockEventChats)

    } catch (err) {
      console.error("[EventChatsListScreen] Error fetching event chats:", err)
      Alert.alert("Error", `Failed to load event chats: ${err.message}`)
      setEventChats([])
    } finally {
      setRefreshing(false)
      setIsFetching(false)
    }
  }, [user, token])

  // Socket.IO setup para tiempo real
  useEffect(() => {
    if (user?.user_id && socketConnected) {
      console.log("[EventChatsListScreen] Setting up real-time event chat list for user:", user.user_id)

      // Configurar listeners de Socket.IO
      socketService.onEventChatListUpdate((data) => {
        console.log("[EventChatsListScreen] Event chat list update received:", data)
        if (data.chats) {
          setEventChats(data.chats)
        } else {
          // Si no hay datos específicos, recargar
          fetchEventChats()
        }
      })

      socketService.onNewEventMessage((messageData) => {
        console.log("[EventChatsListScreen] New event message via socket:", messageData)
        updateEventChatWithNewMessage(messageData)
      })

      // Solicitar actualización inicial de la lista
      socketService.requestEventChatListUpdate()

      // Cargar datos iniciales solo una vez
      if (eventChats.length === 0) {
        fetchEventChats()
      }

      return () => {
        console.log("[EventChatsListScreen] Cleaning up socket listeners")
      }
    }
  }, [user?.user_id, socketConnected, updateEventChatWithNewMessage])

  // Focus listener simplificado - solo solicitar actualización via socket
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      console.log("[EventChatsListScreen] Screen focused - requesting event chat list update")
      if (socketConnected) {
        socketService.requestEventChatListUpdate()
      } else {
        // Fallback si no hay socket
        fetchEventChats()
      }
    })
    return unsubscribeFocus
  }, [navigation, socketConnected, fetchEventChats])

  // Update time for relative timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const onRefresh = useCallback(() => {
    console.log("[EventChatsListScreen] Pull-to-refresh triggered")
    fetchEventChats()
  }, [fetchEventChats])

  const formatTime = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    const diffInMs = currentTime.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return "Now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays}d`

    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const renderEventChatItem = ({ item }) => {
    console.log(`[EventChatsListScreen] Rendering event chat item:`, item)

    const avatarColor = getAvatarColor(item.eventTitle)
    const categoryIcon = getCategoryIcon(item.eventCategory)
    const displayImage = getFullImageUrl(item.eventImage)

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          console.log("[EventChatsListScreen] Navigating to event chat:", item.eventTitle)
          navigation.navigate("ChatScreen", {
            eventId: item.eventId,
            eventTitle: item.eventTitle,
            eventImage: item.eventImage,
          })
        }}
        activeOpacity={0.7}
      >
        <View style={styles.chatImageContainer}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.eventImage}
              onError={(error) => {
                console.log("[EventChatsListScreen] Image load error:", error.nativeEvent.error)
              }}
            />
          ) : (
            <View style={[styles.eventImagePlaceholder, { backgroundColor: avatarColor }]}>
              <Ionicons name={categoryIcon} size={28} color="#fff" />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.eventTitleContainer}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {item.eventTitle}
              </Text>
              <View style={styles.participantsContainer}>
                <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                <Text style={styles.participantsText}>
                  {item.participantsCount} participants
                </Text>
              </View>
            </View>
            <Text style={styles.timeText}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessageSender} numberOfLines={1}>
              {item.lastMessageSender}:
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
        </View>

        <View style={styles.chatActions}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No event chats yet</Text>
      <Text style={styles.emptySubtitle}>Join events to start chatting with other participants</Text>
      <TouchableOpacity style={styles.exploreEventsButton} onPress={() => navigation.navigate("HomeScreen")}>
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.exploreEventsText}>Explore Events</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Event Chats</Text>
              <Text style={styles.headerSubtitle}>{eventChats.length} active chats</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate("HomeScreen")}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading event chats...</Text>
            </View>
          ) : eventChats.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={eventChats}
              keyExtractor={(item) => String(item.eventId)}
              renderItem={renderEventChatItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              extraData={currentTime}
              removeClippedSubviews={false}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={15}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Toasts de notificaciones en tiempo real */}
      {toasts.map((toast) => (
        <RealtimeToast
          key={toast.id}
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => hideToast(toast.id)}
          onPress={toast.onPress}
        />
      ))}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
  },
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: { flex: 1, alignItems: "center", marginHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text, marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary },
  searchButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  chatImageContainer: { position: "relative", marginRight: 16 },
  eventImage: { 
    width: 64, 
    height: 64, 
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  eventImagePlaceholder: { 
    width: 64, 
    height: 64, 
    borderRadius: 16, 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF453A",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0F0F23",
    shadowColor: "#FF453A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  eventTitleContainer: { flex: 1, marginRight: 8 },
  eventTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.text, 
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  participantsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  participantsText: { 
    fontSize: 12, 
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  timeText: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 2,
    fontWeight: "500",
    opacity: 0.7,
  },
  lastMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessageSender: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: "600",
    marginRight: 6,
  },
  lastMessage: { 
    fontSize: 14, 
    color: COLORS.textSecondary,
    flex: 1,
    opacity: 0.8,
  },
  chatActions: { marginLeft: 8 },
  separator: { height: 0 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, marginTop: 50 },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: { fontSize: 24, fontWeight: "600", color: COLORS.text, marginBottom: 12, textAlign: "center" },
  emptySubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", marginBottom: 30, lineHeight: 24 },
  exploreEventsButton: {
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exploreEventsText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  topBubble: {
    position: "absolute",
    top: 50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: 100,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 0,
  },
})