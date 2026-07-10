"use client"

import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import RealtimeToast from "../components/RealtimeToast"
import { ChatAvatar } from "../components/chat/ChatAvatar"
import { BASE_URL } from "../config"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import socketService from "../services/socketService"
import userBlockService from "../services/userBlockService"
import { normalizeImageUrl } from "../utils/image"

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
}

const AVATAR_COLORS = [PRIMARY_COLOR, "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]

export default function PersonalChatsListScreen({ navigation }) {
  const { user, token } = useAuth()
  const {
    loading,
    getUserChats,
    getChatUserInfo,
    formatChatListItem,
    getUserDisplayName,
    getUserProfilePicture,
    subscribeToChatList,
    unsubscribeFromChatList,
    getConnectionStatus
  } = useChat()

  // Hook para notificaciones toast
  const { toasts, hideToast } = useToast()

  const [personalChats, setPersonalChats] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [failedImages, setFailedImages] = useState(new Set())
  const lastFetchRef = useRef(0)
  const socketConnectedRef = useRef(false)

  // Hook para actualizaciones en tiempo real de la lista de chats
  const { isConnected: socketConnected } = useRealTimeUpdates({
    onNewMessage: (messageData) => {
      console.log("💬 PersonalChatsListScreen: Nuevo mensaje recibido", messageData)
      updateChatWithNewMessage(messageData)
    },
    autoJoinUserRoom: true
  })

  // Función para actualizar chat con nuevo mensaje
  const updateChatWithNewMessage = useCallback((messageData) => {
    setPersonalChats(prev => {
      const updatedChats = [...prev]
      const chatIndex = updatedChats.findIndex(chat =>
        (chat.userId === messageData.sender?.id && messageData.receiver?.id === user?.user_id) ||
        (chat.userId === messageData.receiver?.id && messageData.sender?.id === user?.user_id)
      )

      if (chatIndex >= 0) {
        // Actualizar chat existente
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: messageData.content || messageData.message || "New message",
          lastMessageTime: messageData.created_at || messageData.createdAt || new Date().toISOString(),
          unreadCount: messageData.sender?.id !== user?.user_id ?
            (updatedChats[chatIndex].unreadCount || 0) + 1 : 0
        }

        // Mover al principio de la lista
        const updatedChat = updatedChats.splice(chatIndex, 1)[0]
        return [updatedChat, ...updatedChats]
      } else if (messageData.sender?.id !== user?.user_id) {
        // Crear nuevo chat si no existe y el mensaje no es del usuario actual
        const newChat = {
          userId: messageData.sender?.id,
          name: messageData.sender?.name || messageData.sender?.username || 'Usuario',
          lastname: messageData.sender?.lastname || '',
          username: messageData.sender?.username || '',
          display_name: messageData.sender?.display_name || messageData.sender?.name || '',
          profile_picture: messageData.sender?.profile_picture,
          lastMessage: messageData.content || messageData.message || "New message",
          lastMessageTime: messageData.created_at || messageData.createdAt || new Date().toISOString(),
          unreadCount: 1
        }
        return [newChat, ...updatedChats]
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

  const getUserInitials = useCallback((name, lastname) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : ""
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : ""
    return firstInitial + lastInitial || "U"
  }, [])

  // Fetch conversations using the same approach as AddPersonScreen
  const fetchAllConversations = useCallback(async () => {
    if (!user || !user.user_id || !token) {
      console.warn("[PersonalChatsListScreen] Missing user, user_id, or token")
      setPersonalChats([])
      setRefreshing(false)
      return
    }

    // Debouncing
    const now = Date.now()
    if (now - lastFetchRef.current < 2000 && !refreshing) {
      console.log("[PersonalChatsListScreen] Debouncing fetch call")
      return
    }
    lastFetchRef.current = now

    if (isFetching && !refreshing) return
    setIsFetching(true)
    if (!refreshing) setRefreshing(true)

    try {
      console.log(`[PersonalChatsListScreen] Fetching conversations for user: ${user.user_id}`)
      console.log(`[PersonalChatsListScreen] User object:`, user)
      console.log(`[PersonalChatsListScreen] Token exists:`, !!token)

      // Ejecutar diagnóstico si es la primera vez o si hay problemas
      if (personalChats.length === 0) {
        await runDiagnostics()
      }

      // Get user chats using context function
      console.log(`[PersonalChatsListScreen] Calling getUserChats with userId: ${user.user_id}`)

      let chatsData;
      try {
        chatsData = await getUserChats(user.user_id)
        console.log("[PersonalChatsListScreen] Raw chats data received:", chatsData)
        console.log("[PersonalChatsListScreen] Chats data type:", typeof chatsData)
        console.log("[PersonalChatsListScreen] Is chats data array:", Array.isArray(chatsData))
      } catch (chatError) {
        console.error("[PersonalChatsListScreen] Error calling getUserChats:", chatError)
        
        // En lugar de fallar, continuar con array vacío
        console.log("[PersonalChatsListScreen] Continuando con array vacío debido a error")
        chatsData = []
      }

      // Validar y normalizar los datos recibidos
      let chats = [];
      if (Array.isArray(chatsData)) {
        chats = chatsData;
      } else if (chatsData && typeof chatsData === 'object') {
        // Si chatsData es un objeto, intentar extraer el array
        if (Array.isArray(chatsData.data)) {
          chats = chatsData.data;
        } else if (Array.isArray(chatsData.chats)) {
          chats = chatsData.chats;
        } else {
          console.warn("[PersonalChatsListScreen] Unexpected data structure:", chatsData);
          chats = [];
        }
      } else {
        console.warn("[PersonalChatsListScreen] Invalid chats data:", chatsData);
        chats = [];
      }

      if (chats.length === 0) {
        console.log("[PersonalChatsListScreen] No chats found - this might be normal if user has no conversations yet")
        setPersonalChats([])
        setRefreshing(false)
        setIsFetching(false)
        return
      }

      // Process each chat using the new formatting service
      const validChats = []

      for (const chat of chats) {
        try {
          console.log(`[PersonalChatsListScreen] Processing chat:`, chat)

          // Validar que el chat tenga la estructura mínima necesaria
          if (!chat || typeof chat !== 'object') {
            console.warn(`[PersonalChatsListScreen] Invalid chat object:`, chat)
            continue
          }

          // Formatear chat usando el servicio
          const formattedChat = formatChatListItem(chat)
          const chatUserId = formattedChat.userId

          console.log(`[PersonalChatsListScreen] Chat userId: ${chatUserId}, Current user: ${user.user_id}`)

          if (!chatUserId) {
            console.log(`[PersonalChatsListScreen] Skipping chat - no userId`)
            continue
          }

          if (chatUserId === user.user_id) {
            console.log(`[PersonalChatsListScreen] Skipping chat - self conversation`)
            continue
          }

          // Check if user is blocked
          try {
            const blockStatus = await userBlockService.checkMutualBlock(token, user.user_id, chatUserId)
            if (blockStatus.isBlocked) {
              console.log(`[PersonalChatsListScreen] User ${chatUserId} is blocked`)
              continue
            }
          } catch (error) {
            console.warn(`[PersonalChatsListScreen] Block check failed for ${chatUserId}:`, error)
          }

          // Get complete user information
          let userInfo = {
            name: formattedChat.name || "Unknown User",
            lastname: formattedChat.lastname || "",
            username: formattedChat.username || "",
            display_name: formattedChat.display_name || formattedChat.name || "",
            profile_picture: formattedChat.profile_picture || null
          }

          // Siempre intentar obtener información actualizada del usuario
          try {
            const userData = await getChatUserInfo(chatUserId)
            console.log(`[PersonalChatsListScreen] User data for ${chatUserId}:`, userData)

            if (userData && (userData.name || userData.display_name || userData.username)) {
              const displayName = getUserDisplayName(userData);

              // Solo actualizar si obtenemos un nombre mejor que "Usuario"
              if (displayName && displayName !== 'Usuario' && !displayName.startsWith('Usuario ')) {
                userInfo = {
                  name: displayName,
                  lastname: userData.lastname || "",
                  username: userData.username || "",
                  display_name: userData.display_name || userData.name || userData.username || "",
                  profile_picture: getUserProfilePicture(userData)
                }
                console.log(`[PersonalChatsListScreen] Updated user info for ${chatUserId}:`, userInfo)
              } else {
                console.warn(`[PersonalChatsListScreen] Received generic name for ${chatUserId}: ${displayName}`)
                // Mantener la información original si es mejor
                if (formattedChat.name && formattedChat.name !== 'Usuario') {
                  userInfo.name = formattedChat.name;
                  userInfo.display_name = formattedChat.name;
                }
              }
            } else {
              console.warn(`[PersonalChatsListScreen] No valid user data received for ${chatUserId}:`, userData)
            }
          } catch (userError) {
            console.warn(`[PersonalChatsListScreen] Failed to fetch user ${chatUserId}:`, userError)
            // Mantener la información original del chat si la llamada falla
          }

          const finalFormattedChat = {
            userId: chatUserId,
            name: userInfo.name,
            lastname: userInfo.lastname,
            username: userInfo.username,
            display_name: userInfo.display_name,
            profile_picture: userInfo.profile_picture,
            lastMessage: formattedChat.lastMessage || "No messages yet",
            lastMessageTime: formattedChat.lastMessageDate?.toISOString() || new Date().toISOString(),
            sortTime: formattedChat.lastMessageDate?.getTime() || new Date().getTime(),
          }

          console.log(`[PersonalChatsListScreen] Final formatted chat:`, finalFormattedChat)
          validChats.push(finalFormattedChat)

        } catch (error) {
          console.error(`[PersonalChatsListScreen] Error processing user ${chatUserId}:`, error)
        }
      }

      // Sort by most recent message first
      validChats.sort((a, b) => b.sortTime - a.sortTime)

      console.log(`[PersonalChatsListScreen] Setting ${validChats.length} chats`)
      setPersonalChats(validChats)

    } catch (err) {
      console.error("[PersonalChatsListScreen] Error fetching conversations:", err)
      console.error("[PersonalChatsListScreen] Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      })

      // More specific error handling
      if (err.message && err.message.includes('404')) {
        console.log("[PersonalChatsListScreen] No conversations found (404)")
        setPersonalChats([])
      } else if (err.message && err.message.includes('401')) {
        Alert.alert("Authentication Error", "Please log in again.")
      } else {
        Alert.alert("Error", `Failed to load conversations: ${err.message}`)
        setPersonalChats([])
      }
    } finally {
      setRefreshing(false)
      setIsFetching(false)
    }
  }, [user, token, getUserChats, getChatUserInfo, formatChatListItem, getUserDisplayName, getUserProfilePicture])

  // Función de diagnóstico para debuggear problemas
  const runDiagnostics = useCallback(async () => {
    if (!user?.user_id) return

    try {
      console.log("[PersonalChatsListScreen] Running chat diagnostics...")
      
      // Importar utilidad de diagnóstico
      const { default: chatDiagnostics } = await import("../utils/chatDiagnostics")
      
      // Ejecutar diagnóstico rápido
      const issues = await chatDiagnostics.quickDiagnostic(user.user_id)
      
      if (issues.length > 0) {
        console.warn("[PersonalChatsListScreen] Problemas detectados:", issues)
        
        // Ejecutar diagnóstico completo si hay problemas
        const fullResults = await chatDiagnostics.runFullDiagnostic(user.user_id)
        console.log("[PersonalChatsListScreen] Diagnóstico completo:", fullResults)
      } else {
        console.log("[PersonalChatsListScreen] ✅ Sistema de chat funcionando correctamente")
      }
      
    } catch (error) {
      console.error("[PersonalChatsListScreen] Error en diagnóstico:", error)
    }
  }, [user?.user_id])

  // Setup para tiempo real usando el contexto de chat
  useEffect(() => {
    if (user?.user_id) {
      console.log("[PersonalChatsListScreen] Setting up real-time chat list for user:", user.user_id)

      // Callback para actualizaciones de lista de chats
      const handleChatListUpdate = (chats) => {
        console.log("[PersonalChatsListScreen] Chat list updated:", chats.length)
        if (Array.isArray(chats)) {
          // Formatear chats usando el servicio
          const formattedChats = chats.map(chat => formatChatListItem(chat))
          setPersonalChats(formattedChats)
        }
      }

      // Suscribirse a actualizaciones de lista de chats de forma segura
      subscribeToChatList(handleChatListUpdate).catch(error => {
        console.warn("[PersonalChatsListScreen] Error subscribing to chat list:", error)
      })

      // Cargar datos iniciales si no hay chats
      if (personalChats.length === 0) {
        fetchAllConversations()
      }

      // Configurar listeners de Socket.IO como fallback
      socketService.onChatListUpdate((data) => {
        console.log("[PersonalChatsListScreen] Chat list update received via socket:", data)
        if (data.chats) {
          handleChatListUpdate(data.chats)
        } else {
          fetchAllConversations()
        }
      })

      socketService.onNewPrivateMessage((messageData) => {
        console.log("[PersonalChatsListScreen] New private message via socket:", messageData)
        updateChatWithNewMessage(messageData)
      })

      socketService.onUserOnlineStatus((statusData) => {
        console.log("[PersonalChatsListScreen] User online status update:", statusData)
        setPersonalChats(prev => prev.map(chat =>
          chat.userId === statusData.userId
            ? { ...chat, isOnline: statusData.isOnline }
            : chat
        ))
      })

      return () => {
        console.log("[PersonalChatsListScreen] Cleaning up chat listeners")
        // Desuscribirse de actualizaciones de lista de chats de forma segura
        unsubscribeFromChatList(handleChatListUpdate).catch(error => {
          console.warn("[PersonalChatsListScreen] Error unsubscribing from chat list:", error)
        })
      }
    }
  }, [user?.user_id, subscribeToChatList, unsubscribeFromChatList, formatChatListItem, updateChatWithNewMessage, fetchAllConversations, personalChats.length])

  // Focus listener - actualizar chats cuando la pantalla se enfoca
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      console.log("[PersonalChatsListScreen] Screen focused - refreshing chat list")
      
      // Verificar estado de conexión de forma segura
      getConnectionStatus().then(connectionStatus => {
        console.log("[PersonalChatsListScreen] Connection status:", connectionStatus)
      }).catch(error => {
        console.warn("[PersonalChatsListScreen] Error getting connection status:", error)
      })
      
      // Siempre refrescar los datos cuando se enfoca la pantalla
      fetchAllConversations()
    })
    return unsubscribeFocus
  }, [navigation, fetchAllConversations, getConnectionStatus])

  // Update time for relative timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const onRefresh = useCallback(() => {
    console.log("[PersonalChatsListScreen] Pull-to-refresh triggered")
    fetchAllConversations()
  }, [fetchAllConversations])

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

  const renderChatItem = ({ item }) => {
    // Debug logging for rendering
    console.log(`[PersonalChatsListScreen] Rendering chat item:`, {
      userId: item.userId,
      name: item.name,
      lastname: item.lastname,
      username: item.username,
      display_name: item.display_name,
      profile_picture: item.profile_picture
    })

    const avatarColor = getAvatarColor(item.name)
    const initials = getUserInitials(item.name, item.lastname)

    // Properly handle profile picture URL
    let displayAvatar = null
    if (item.profile_picture && item.profile_picture.trim() !== "") {
      displayAvatar = getFullImageUrl(item.profile_picture)
    }

    // Handle last message text
    const lastMessageText = item.lastMessage || 'No messages yet'

    // Handle time formatting
    const timeToShow = item.lastMessageTime || new Date().toISOString()

    // Better name handling with multiple fallbacks
    const getDisplayName = () => {
      // Try different name fields in order of preference
      if (item.name && item.name !== "Unknown User" && item.name !== "Usuario Desconocido" && item.name !== "Usuario") {
        return item.name
      }
      if (item.display_name && item.display_name !== "Unknown User" && item.display_name !== "Usuario") {
        return item.display_name
      }
      if (item.username && item.username.trim() !== "") {
        return item.username
      }
      // Last resort - create a more descriptive name
      return `Usuario ${item.userId}`
    }

    const displayName = getDisplayName()

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          console.log("[PersonalChatsListScreen] Navigating to chat with:", item.name)
          navigation.navigate("PersonalChatScreen", {
            recipient: {
              id: item.userId,
              user_id: item.userId, // Add both formats for compatibility
              name: item.name,
              display_name: item.display_name,
              username: item.username,
              lastname: item.lastname,
              profile_picture: item.profile_picture,
            },
            recipientId: item.userId, // Add recipientId for compatibility
          })
        }}
        activeOpacity={0.7}
      >
        <View style={styles.chatImageContainer}>
          <ChatAvatar
            userObj={{
              id: item.userId,
              user_id: item.userId,
              name: item.name,
              display_name: item.display_name,
              username: item.username,
              profile_picture: item.profile_picture
            }}
            size={56}
            backgroundColor={avatarColor}
          />
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName} {item.lastname ? item.lastname : ''}
              </Text>
              {item.username && item.username !== displayName && (
                <Text style={styles.usernameText} numberOfLines={1}>
                  @{item.username}
                </Text>
              )}
            </View>
            <Text style={styles.timeText}>
              {formatTime(timeToShow)}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
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
        <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>Start a conversation by adding someone new</Text>
      <TouchableOpacity style={styles.addFirstPersonButton} onPress={() => navigation.navigate("AddPersonScreen")}>
        <Ionicons name="person-add" size={20} color="#fff" />
        <Text style={styles.addFirstPersonText}>Add Someone</Text>
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
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>{personalChats.length} conversations</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddPersonScreen")}>
              <Ionicons name="person-add" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading chats...</Text>
            </View>
          ) : personalChats.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={personalChats}
              keyExtractor={(item) => String(item.userId)}
              renderItem={renderChatItem}
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
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: { flex: 1, alignItems: "center", marginHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text, marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary },
  addButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginBottom: 12,
  },
  chatImageContainer: { position: "relative", marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  userNameContainer: { flex: 1, marginRight: 8 },
  userName: { fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 2 },
  usernameText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "400" },
  timeText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lastMessage: { fontSize: 15, color: COLORS.textSecondary },
  chatActions: { marginLeft: 8 },
  separator: { height: 0 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, marginTop: 50 },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontWeight: "600", color: COLORS.text, marginBottom: 12, textAlign: "center" },
  emptySubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", marginBottom: 30, lineHeight: 24 },
  addFirstPersonButton: {
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
  addFirstPersonText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
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