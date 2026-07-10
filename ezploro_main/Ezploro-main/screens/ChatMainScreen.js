"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import { useChat } from "../context/ChatContext"
import { useEvents } from "../context/EventContext"
import { API_URL_EVENTS, BASE_URL_IMAGE } from "../config"

const COLORS = {
  background: "#000000",
  surface: "#1A1A1A",
  card: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#3A3A3C",
  accent: "#007AFF",
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  purple: "#AF52DE",
  pink: "#FF2D92",
  orange: "#FF9500",
  green: "#30D158",
  blue: "#007AFF",
  indigo: "#5856D6",
  teal: "#5AC8FA",
  yellow: "#FFCC00",
}

const AVATAR_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.purple,
  COLORS.pink,
  COLORS.orange,
  COLORS.teal,
  COLORS.indigo,
  COLORS.yellow,
]

export default function ChatMainScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const { subscribedEvents } = useEvents()
  const { 
    getEventMessages, 
    getUserEventChats,
    invalidateAllCache,
    formatMessage,
    formatChatListItem,
    getUserDisplayName
  } = useChat()
  const [groupChats, setGroupChats] = useState([])
  const [loadingGroupChats, setLoadingGroupChats] = useState(true)
  const [lastMessages, setLastMessages] = useState({})
  const [failedImages, setFailedImages] = useState(new Set())
  const lastLoadTime = useRef(0)

  const getFullImageUrl = useCallback((relativePath) => {
    if (!relativePath || typeof relativePath !== "string") return null

    // Limpiar la ruta de la imagen
    let cleanRelativePath = relativePath

    // Remover barras del inicio y final si existen
    if (cleanRelativePath.startsWith("/")) {
      cleanRelativePath = cleanRelativePath.substring(1)
    }
    if (cleanRelativePath.endsWith("/")) {
      cleanRelativePath = cleanRelativePath.substring(0, cleanRelativePath.length - 1)
    }

    // Si la ruta ya es una URL completa, devolverla tal como está
    if (cleanRelativePath.startsWith("http://") || cleanRelativePath.startsWith("https://")) {
      return cleanRelativePath
    }

    // Construir la URL completa
    const fullUrl = `${BASE_URL_IMAGE}/${cleanRelativePath}`
    console.log(`🖼️ Image URL constructed: ${fullUrl} from path: ${relativePath}`)

    return fullUrl
  }, [])

  const getAvatarColor = useCallback((title) => {
    const index = title ? title.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }, [])

  const fetchLastMessages = useCallback(
    async (events) => {
      const messages = {}
      const messageCounts = {}

      // Procesar eventos en lotes para evitar sobrecarga del servidor
      const batchSize = 3
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize)

        // Procesar lote en paralelo con límite
        await Promise.allSettled(
          batch.map(async (event) => {
            try {
              const eventMessages = await getEventMessages(event.event_id)
              if (eventMessages && Array.isArray(eventMessages)) {
                // Formatear mensajes usando el servicio
                const formattedMessages = eventMessages.map(msg => formatMessage(msg))
                const sortedMessages = formattedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                
                messages[event.event_id] = sortedMessages[0] || null
                messageCounts[event.event_id] = eventMessages.length
              } else {
                messages[event.event_id] = null
                messageCounts[event.event_id] = 0
              }
            } catch (error) {
              console.log(`Error getting messages for event ${event.event_id}:`, error.message)
              messages[event.event_id] = null
              messageCounts[event.event_id] = 0
            }
          }),
        )

        // Pequeña pausa entre lotes para no sobrecargar
        if (i + batchSize < events.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      setLastMessages(messages)
      // Update events with message counts
      setGroupChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          messageCount: messageCounts[chat.event_id] || 0,
          lastMessage: messages[chat.event_id],
        })),
      )
    },
    [getEventMessages, formatMessage],
  )

  // Caché para evitar llamadas repetitivas
  const lastFetchTime = useRef(0)
  const CACHE_DURATION = 30000 // 30 segundos

  const fetchGroupChats = useCallback(async (forceRefresh = false) => {
    if (!user?.user_id) return
    
    // Verificar caché
    const now = Date.now()
    if (!forceRefresh && (now - lastFetchTime.current) < CACHE_DURATION) {
      console.log("📋 Using cached group chats data")
      return
    }
    
    setLoadingGroupChats(true)
    try {
      // Intentar usar el endpoint de chats de eventos primero
      console.log("📋 Attempting to use getUserEventChats endpoint...")
      let eventsData = []
      
      try {
        console.log("📋 Calling getUserEventChats with userId:", user.user_id)
        const eventChats = await getUserEventChats(user.user_id)
        console.log("📋 getUserEventChats response:", {
          type: typeof eventChats,
          isArray: Array.isArray(eventChats),
          length: Array.isArray(eventChats) ? eventChats.length : 'N/A',
          hasData: !!eventChats,
          sample: Array.isArray(eventChats) && eventChats.length > 0 ? eventChats[0] : null
        })
        
        if (Array.isArray(eventChats) && eventChats.length > 0) {
          console.log("✅ Successfully loaded event chats from endpoint:", eventChats.length)
          eventsData = eventChats.map(chat => ({
            event_id: chat.event_id,
            title: chat.title,
            cover_image: chat.cover_image,
            last_message: chat.last_message,
            last_message_date: chat.last_message_date,
            last_sender: chat.last_sender
          }))
        } else {
          console.log("⚠️ No event chats found or empty array returned")
          throw new Error("No event chats returned from endpoint")
        }
      } catch (endpointError) {
        console.warn("⚠️ Event chats endpoint failed, using fallback:", endpointError.message)
        
        // Fallback: usar interactionService para obtener eventos suscritos
        console.log("📋 Using interactionService fallback for event chats...")
        const { interactionService } = await import('../services')
        const subscribedEventsResponse = await interactionService.getUserSubscribedEvents(user.user_id)
        
        console.log("🔍 User subscribed events response:", {
          type: typeof subscribedEventsResponse,
          isArray: Array.isArray(subscribedEventsResponse),
          data: subscribedEventsResponse
        })
        
        // Extraer los IDs de eventos suscritos
        let subscribedEventIds = []
        if (subscribedEventsResponse?.data?.subscribedEventIds && Array.isArray(subscribedEventsResponse.data.subscribedEventIds)) {
          subscribedEventIds = subscribedEventsResponse.data.subscribedEventIds
          console.log("📋 Found subscribedEventIds in data:", subscribedEventIds)
        } else if (subscribedEventsResponse?.subscribedEventIds && Array.isArray(subscribedEventsResponse.subscribedEventIds)) {
          subscribedEventIds = subscribedEventsResponse.subscribedEventIds
          console.log("📋 Found subscribedEventIds directly:", subscribedEventIds)
        } else if (Array.isArray(subscribedEventsResponse)) {
          subscribedEventIds = subscribedEventsResponse.map(event => event.event_id || event.id)
          console.log("📋 Extracted IDs from array:", subscribedEventIds)
        } else {
          console.warn("⚠️ Could not extract subscribed event IDs from response:", subscribedEventsResponse)
        }
        
        console.log("📋 Subscribed event IDs:", subscribedEventIds)
        
        // Si tenemos eventos suscritos, obtener la información completa de esos eventos
        if (subscribedEventIds.length > 0) {
          try {
            const { eventService } = await import('../services')
            const allEvents = await eventService.getEvents()
            
            // Filtrar solo los eventos a los que está suscrito
            eventsData = allEvents.filter(event => {
              const eventIdStr = String(event.event_id)
              const eventIdNum = event.event_id
              const isSubscribed = subscribedEventIds.includes(eventIdStr) || 
                                 subscribedEventIds.includes(eventIdNum) ||
                                 subscribedEventIds.includes(parseInt(eventIdStr))
              
              if (isSubscribed) {
                console.log(`✅ Event ${event.event_id} (${event.title}) is subscribed`)
              }
              
              return isSubscribed
            })
            
            console.log(`✅ Found ${eventsData.length} subscribed events for chat`)
          } catch (eventError) {
            console.warn("⚠️ Could not fetch event details, using empty array:", eventError.message)
            eventsData = []
          }
        } else {
          console.log("📋 No subscribed events found")
          eventsData = []
        }
      }
      
      console.log("📋 Subscribed events loaded:", eventsData.length)
      setGroupChats(eventsData)
      lastFetchTime.current = now
      
      if (eventsData && eventsData.length > 0) {
        await fetchLastMessages(eventsData)
      }
    } catch (error) {
      console.error("❌ Error loading event chats:", error)
      setGroupChats([])
    } finally {
      setLoadingGroupChats(false)
    }
  }, [fetchLastMessages, getUserEventChats, formatChatListItem, user?.user_id])

  useEffect(() => {
    fetchGroupChats()
    // Solo recargar cuando la pantalla se enfoca, no en cada navegación
    const unsubscribe = navigation.addListener("focus", () => {
      // Solo recargar si han pasado más de 30 segundos desde la última carga
      const now = Date.now()
      const lastLoad = lastLoadTime.current
      if (!lastLoad || now - lastLoad > 30000) {
        fetchGroupChats()
        lastLoadTime.current = now
      }
    })
    return unsubscribe
  }, [fetchGroupChats, navigation])

  // Escuchar cambios en las suscripciones de eventos
  useEffect(() => {
    console.log("📋 Subscribed events changed, refreshing chat list...")
    lastFetchTime.current = 0 // Reset cache
    fetchGroupChats(true) // Force refresh
  }, [subscribedEvents, fetchGroupChats])

  // Socket listener for real-time message updates
  useEffect(() => {
    if (!socket || !isConnected || !user?.user_id) return

    console.log("🔌 Setting up socket listeners in ChatMainScreen for user:", user.user_id)

    const handleNewMessage = (data) => {
      console.log("📨 New message received in ChatMainScreen:", data)

      if (data.eventId) {
        // Update last message for the event
        setLastMessages((prev) => ({
          ...prev,
          [data.eventId]: data,
        }))

        // Update group chat with new message info
        setGroupChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.event_id === data.eventId) {
              return {
                ...chat,
                lastMessage: data,
                messageCount: (chat.messageCount || 0) + 1,
              }
            }
            return chat
          }),
        )
      }
    }

    const handleChatUpdate = (data) => {
      console.log("💬 Chat update received in ChatMainScreen:", data)

      if (data.type === "event" && data.eventId) {
        // Refresh group chats if needed
        const now = Date.now()
        if (!lastLoadTime.current || now - lastLoadTime.current > 30000) {
          fetchGroupChats()
          lastLoadTime.current = now
        }
      }
    }

    const handleUserJoinedEvent = (data) => {
      console.log("👥 User joined event:", data)
      if (data.userId === user.user_id) {
        // User joined a new event, refresh the chat list immediately
        console.log("🔄 User joined new event, refreshing chat list...")
        lastFetchTime.current = 0 // Reset cache
        fetchGroupChats(true) // Force refresh
      }
    }

    // Join user's personal chat room
    socket.emit("join-user-chat", user.user_id)

    // Set up event listeners
    socket.on("new-message", handleNewMessage)
    socket.on("chat-update", handleChatUpdate)
    socket.on("user-joined-event", handleUserJoinedEvent)
    socket.on("message-received", handleNewMessage)
    socket.on("privateMessage", handleNewMessage)

    return () => {
      console.log("🔌 Cleaning up socket listeners in ChatMainScreen")
      socket.off("new-message", handleNewMessage)
      socket.off("chat-update", handleChatUpdate)
      socket.off("user-joined-event", handleUserJoinedEvent)
      socket.off("message-received", handleNewMessage)
      socket.off("privateMessage", handleNewMessage)
    }
  }, [socket, isConnected, user?.user_id, fetchGroupChats])

  // Indicador de sincronización automática
  const renderSyncIndicator = () => (
    <View style={styles.syncIndicator}>
      <TouchableOpacity
        style={styles.syncButton}
        onPress={() => {
          invalidateAllCache()
          fetchGroupChats()
          lastLoadTime.current = 0
        }}
      >
        <Ionicons name="sync" size={16} color={COLORS.textSecondary} />
        <Text style={styles.syncText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  )

  const renderGroupChatItem = ({ item, index }) => {
    const avatarColor = getAvatarColor(item.title)
    const initials = item.title ? item.title.substring(0, 2).toUpperCase() : "EV"

    // Get last message from state or item
    const lastMessage = lastMessages[item.event_id] || item.lastMessage
    const messageCount = item.messageCount || 0

    // Format time
    const formatTime = (dateString) => {
      if (!dateString) return ""
      try {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))

        if (diffInMinutes < 1) return "Ahora"
        if (diffInMinutes < 60) return `${diffInMinutes}m`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
        return date.toLocaleDateString()
      } catch {
        return ""
      }
    }

    // Get sender name for last message
    const getLastMessageSender = () => {
      if (!lastMessage?.sender) return ""
      
      const senderName = lastMessage.sender.name || 
                         lastMessage.sender.display_name || 
                         lastMessage.sender.username
      
      // Don't show sender name if it's the current user
      if (lastMessage.sender.id === user?.user_id) {
        return "Tú: "
      }
      
      // Show sender name for group chats
      if (senderName && senderName !== "Unknown" && senderName !== "Usuario Desconocido") {
        return `${senderName}: `
      }
      
      return ""
    }

    const lastMessageText = lastMessage?.content 
      ? `${getLastMessageSender()}${lastMessage.content}`
      : messageCount > 0 
        ? `${messageCount} mensajes` 
        : "No hay mensajes aún"

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate("ChatScreen", { event: item })}
        activeOpacity={0.7}
      >
        <View style={styles.chatImageContainer}>
          {getFullImageUrl(item.image || item.cover_image) && !failedImages.has(item.event_id) ? (
            <Image
              source={{ uri: getFullImageUrl(item.image || item.cover_image) }}
              style={styles.chatImage}
              resizeMode="cover"
              onError={(e) => {
                console.log(`❌ Image load error for event ${item.title}:`, e.nativeEvent.error)
                setFailedImages((prev) => new Set([...prev, item.event_id]))
              }}
              onLoad={() => {
                console.log(`✅ Image loaded successfully for event ${item.title}`)
              }}
            />
          ) : (
            <View style={[styles.chatImagePlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.chatImageText}>{initials}</Text>
            </View>
          )}
          <View style={[styles.onlineIndicator, { backgroundColor: COLORS.success }]} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.chatTime}>{formatTime(lastMessage?.createdAt || lastMessage?.created_at)}</Text>
          </View>
          <View style={styles.chatPreview}>
            <Text style={styles.chatLastMessage} numberOfLines={2}>
              {lastMessageText}
            </Text>
            {messageCount > 0 && (
              <View style={[styles.chatBadge, { backgroundColor: COLORS.accent }]}>
                <Text style={styles.chatBadgeText}>{messageCount > 99 ? "99+" : messageCount}</Text>
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
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>{groupChats.length} conversations</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  console.log("🔄 Manual refresh triggered")
                  invalidateAllCache()
                  lastFetchTime.current = 0
                  fetchGroupChats(true)
                }}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate("AvailableGroupsScreen")}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: "rgba(255, 255, 255, 0.15)" }]}
                onPress={() => navigation.navigate("RankingScreen")}
              >
                <Ionicons name="trophy" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Rankings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: "rgba(255, 255, 255, 0.15)" }]}
                onPress={() => navigation.navigate("PersonalChatsListScreen")}
              >
                <Ionicons name="person" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Personal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: "rgba(76, 175, 80, 0.8)" }]}
                onPress={() => navigation.navigate("CreateGroupScreen")}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Create Group</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: "rgba(255, 255, 255, 0.15)" }]}
                onPress={() => navigation.navigate("AvailableGroupsScreen")}
              >
                <Ionicons name="search" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Find Groups</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: "rgba(255, 255, 255, 0.15)" }]}
                onPress={() => navigation.navigate("AddPersonScreen")}
              >
                <Ionicons name="person-add" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat List */}
          {isConnected && <View style={styles.syncContainer}>{renderSyncIndicator()}</View>}
          <View style={styles.chatListContainer}>
            {loadingGroupChats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Loading conversations...</Text>
              </View>
            ) : groupChats.length > 0 ? (
              <FlatList
                data={groupChats}
                keyExtractor={(item, index) => (item.id ? String(item.id) : `${item.title || "no-title"}-${index}`)}
                renderItem={renderGroupChatItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.chatList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#fff" />
                </View>
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySubtitle}>Join events to start chatting with other participants</Text>
                <TouchableOpacity
                  style={styles.findGroupsButton}
                  onPress={() => navigation.navigate("AvailableGroupsScreen")}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.findGroupsButtonText}>Find Groups to Join</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  quickActionsContainer: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  quickActionButton: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  syncContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  syncIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  syncText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  quickActionText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  chatListContainer: {
    flex: 1,
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 0,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  chatImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
  },
  chatImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  chatImageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  chatTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  chatPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatLastMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  chatBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    minWidth: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: 0,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    lineHeight: 24,
  },
  findGroupsButton: {
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  findGroupsButtonText: {
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