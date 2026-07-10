import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from "expo-image-picker"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import useEventSubscription from "../hooks/useEventSubscription"
import RealtimeToast from "../components/RealtimeToast"
import { 
  BASE_URL,
  BASE_URL_IMAGE, 
  API_URL_EVENT_SUBSCRIPTIONS_TOGGLE,
  API_URL_EVENT_SUBSCRIPTIONS_CHECK,
  API_URL_VIEW_COUNTERS
} from "../config"

import socketService from "../services/socketService"
import googleSheetsDirectService from "../services/googleSheetsDirectService"
import imageService from "../services/imageService"
import { useChat } from "../context/ChatContext"
import { normalizeImageUrl } from "../utils/image"

// Consistent color palette with CreateGroupScreen
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#1a1a1a';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';
const DIVIDER_COLOR_DARK = '#3A3F47';
const INPUT_BACKGROUND_DARK = 'rgba(255, 255, 255, 0.1)';

const COLORS = {
  background: BACKGROUND_DARK,
  surface: CARD_BACKGROUND_DARK,
  card: CARD_BACKGROUND_DARK,
  text: TEXT_PRIMARY_DARK,
  textSecondary: TEXT_SECONDARY_DARK,
  border: DIVIDER_COLOR_DARK,
  accent: PRIMARY_COLOR,
  success: "#30D158",
  userBubble: PRIMARY_COLOR,
  otherBubble: CARD_BACKGROUND_DARK,
  inputBackground: INPUT_BACKGROUND_DARK,
}

export default function ChatScreen({ navigation, route }) {
  const { user } = useAuth()
  const { getEventMessages, sendEventMessage } = useChat()
  const { darkMode } = useTheme()
  const { event = {} } = route.params || {}

  // Hook para notificaciones toast
  const { toasts, showMessage, showNotification, hideToast } = useToast()

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Usar el hook de suscripción con caché
  const { 
    isSubscribed, 
    isLoading: subscriptionLoading, 
    subscribeToEvent,
    refreshSubscription 
  } = useEventSubscription(eventId)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const flatListRef = useRef(null)
  const [pendingImage, setPendingImage] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)

  // Memoize eventId for stable dependency
  const eventId = event.event_id || event.id ? String(event.event_id || event.id) : null

  // Hook para actualizaciones en tiempo real del chat
  const { isConnected: socketConnected, joinEventRoom, leaveEventRoom } = useRealTimeUpdates({
    onNewMessage: (messageData) => {
      console.log("💬 ChatScreen: Nuevo mensaje recibido", messageData)
      // Solo agregar si es del evento actual
      if (messageData.eventId === eventId || messageData.event_id === eventId) {
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg.id === messageData.id)
          if (exists) return prev
          
          return [...prev, messageData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        })
        
        // Scroll al final si no es del usuario actual
        if (messageData.sender?.id !== user?.user_id) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true })
          }, 100)
        }
      }
    },
    autoJoinUserRoom: true
  })

  // Unirse/salir de la sala del evento
  useEffect(() => {
    if (eventId && socketConnected) {
      console.log(`💬 Uniéndose al chat del evento: ${eventId}`)
      joinEventRoom(eventId)
      
      return () => {
        console.log(`💬 Saliendo del chat del evento: ${eventId}`)
        leaveEventRoom(eventId)
      }
    }
  }, [eventId, socketConnected, joinEventRoom, leaveEventRoom])

  // Helper to construct full image URLs
  const getFullImageUrl = useCallback((relativePath) => {
    if (!relativePath) return null
    return normalizeImageUrl(relativePath)
  }, [])

  // Record view when viewing chat
  const recordView = useCallback(async () => {
    if (!eventId || !user?.user_id) return
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        console.warn('⚠️ No token available for recording view')
        return
      }
      
      const response = await fetch(`${BASE_URL_IMAGE}/api/views`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          object_type: 'event',
          object_id: parseInt(eventId),
          viewer_user_id: parseInt(user.user_id)
        }),
        timeout: 5000, // 5 segundos timeout
      })
      
      if (!response.ok) {
        console.warn(`⚠️ View recording failed with status: ${response.status}`)
      }
    } catch (error) {
      // Solo log como warning, no como error para evitar ruido en los logs
      console.warn('⚠️ Could not record view (this is optional):', error.message)
    }
  }, [eventId, user?.user_id])

  // Handle user profile modal
  const showUserProfile = useCallback((messageUser) => {
    if (messageUser.id === user?.user_id) return // Don't show modal for current user
    
    setSelectedUser(messageUser)
    setShowUserModal(true)
  }, [user?.user_id])

  const navigateToProfile = () => {
    if (selectedUser) {
      navigation.navigate("OtherProfile", { 
        userId: selectedUser.id,
        user: selectedUser 
      })
      setShowUserModal(false)
    }
  }

  const sendDirectMessage = () => {
    if (selectedUser) {
      navigation.navigate("PersonalChatScreen", {
        recipient: {
          id: selectedUser.id,
          name: selectedUser.name || selectedUser.display_name || selectedUser.username,
          profile_picture: selectedUser.profile_picture,
        },
      })
      setShowUserModal(false)
    }
  }

  // Fetch messages - OPTIMIZED with better error handling
  const fetchMessages = useCallback(async () => {
    if (!eventId || !user || !user.user_id) {
      console.warn("🚫 ChatScreen: eventId or user missing, cannot fetch messages.")
      setIsLoading(false)
      return
    }

    console.log("💬 Fetching messages for event:", eventId)
    if (!refreshing) setIsLoading(true)

    try {
      const data = await getEventMessages(eventId)
      
      // Validar que data sea un array
      const messagesArray = Array.isArray(data) ? data : 
                           Array.isArray(data?.data) ? data.data :
                           Array.isArray(data?.messages) ? data.messages : []
      
      setMessages(messagesArray)
      console.log("✅ Messages fetched:", messagesArray.length)
      
      // Record view (sin bloquear si falla)
      try {
        await recordView()
      } catch (viewError) {
        console.warn("⚠️ Failed to record view:", viewError.message)
      }
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error("❌ Error fetching messages:", error)
      
      // Manejo específico de errores de red
      if (error.message?.includes("Network request failed") || 
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("timeout")) {
        Alert.alert(
          "Error de Conexión", 
          "No se pudo conectar al servidor. Verifica tu conexión a internet y vuelve a intentar.",
          [
            { text: "Reintentar", onPress: () => fetchMessages() },
            { text: "Cancelar", style: "cancel" }
          ]
        )
      } else {
        Alert.alert("Error", `Error al cargar mensajes: ${error.message}`)
      }
      
      // En caso de error, mostrar mensajes vacíos en lugar de crash
      setMessages([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [eventId, user, refreshing, getEventMessages, recordView])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMessages()
  }, [fetchMessages])

  // Initial fetch and socket setup - OPTIMIZED with fallbacks
  useEffect(() => {
    if (eventId && user?.user_id) {
      fetchMessages()



      // Join event chat (con manejo de errores mejorado)
      const joinEventChat = async () => {
        try {
          const token = await AsyncStorage.getItem("token")
          const response = await fetch(`${BASE_URL}/event-messages/events/${eventId}/join-chat`, {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${token}`, 
              "Content-Type": "application/json" 
            },
            timeout: 10000, // 10 segundos timeout
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          console.log("✅ Successfully joined event chat")
        } catch (e) {
          console.warn("⚠️ Failed to join event chat:", e?.message)
          // No mostrar error al usuario, es opcional
        }
      }

      joinEventChat()

      // Connect socket con fallback
      const connectSocket = async () => {
        try {
          await socketService.connect(user.user_id)
          socketService.joinEventChat(eventId)
          
          // Listen for new messages
          const messageHandler = (newMessage) => {
            if (newMessage.eventId === eventId && String(newMessage.senderId) !== String(user.user_id)) {
              setMessages(prev => {
                // Evitar duplicados
                const exists = prev.some(msg => msg.id === newMessage.id)
                if (exists) return prev
                
                return [...prev, newMessage].sort((a, b) => 
                  new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at)
                )
              })
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true })
              }, 100)
            }
          }
          
          socketService.onNewEventMessage(messageHandler)
          console.log("✅ Socket connected for event chat")
        } catch (socketError) {
          console.warn("⚠️ Socket connection failed:", socketError.message)
          // Continuar sin socket, usar solo polling manual
        }
      }

      connectSocket()

      // Fallback: polling manual cada 30 segundos si socket falla
      const startPolling = () => {
        const interval = setInterval(() => {
          if (!socketConnected) {
            console.log("🔄 Polling for new messages (socket not connected)")
            fetchMessages()
          }
        }, 30000) // 30 segundos
        
        setPollingInterval(interval)
        return interval
      }

      // Iniciar polling después de un delay para dar tiempo al socket
      const pollingTimeout = setTimeout(() => {
        startPolling()
      }, 5000)
      
      return () => {
        try {
          socketService.leaveEventChat(eventId)
          socketService.removeAllListeners()
        } catch (cleanupError) {
          console.warn("⚠️ Socket cleanup failed:", cleanupError.message)
        }
        
        // Limpiar polling
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        clearTimeout(pollingTimeout)
      }
    }
  }, [eventId, user?.user_id, fetchMessages, isSubscribed, subscriptionLoading])

  // Handle sending messages - OPTIMIZED
  const handleSend = async () => {
    const hasText = message.trim() !== ""
    const hasImage = !!pendingImage?.uri
    if (!hasText && !hasImage) return
    if (!eventId || !user?.user_id) {
      Alert.alert("Error", "Cannot send message: Invalid event ID or user not authenticated.")
      return
    }

    console.log("📤 Sending message:", message)
    const messageToSend = message.trim()
    setMessage("")

    try {
      // Optimistic update
      const optimistic = {
        id: `temp-${Date.now()}`,
        sender: { 
          id: user.user_id, 
          name: user.name || user.display_name, 
          username: user.username, 
          profile_picture: user.profile_picture 
        },
        senderId: user.user_id,
        eventId,
        content: messageToSend,
        image: pendingImage?.uri || null,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)

      const imageObj = pendingImage?.uri
        ? { uri: pendingImage.uri, type: pendingImage.type || "image/jpeg", name: pendingImage.name || `photo-${Date.now()}.jpg` }
        : null
      await sendEventMessage(user.user_id, eventId, messageToSend, imageObj)
      setPendingImage(null)
      console.log("✅ Message sent via REST and broadcast")
    } catch (error) {
      console.error("❌ Error sending message:", error)
      Alert.alert("Error", `Failed to send message: ${error.message}. Please try again.`)
      setMessage(messageToSend)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`))
    }
  }

  // Handle image picking
  const pickImage = async () => {
    if (!eventId || !user?.user_id) {
      Alert.alert("Error", "You must be logged in and in a valid event to send images.")
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to select images.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const asset = result.assets[0]
      setPendingImage({ uri: asset.uri, type: asset.mimeType || "image/jpeg", name: asset.fileName || `photo-${Date.now()}.jpg` })
    }
  }

  const clearPendingImage = () => setPendingImage(null)

  // Sync to Google Sheets - OPTIMIZED
  const syncToGoogleSheets = async () => {
    if (!event || !event.title) {
      Alert.alert("Error", "No hay información del evento para sincronizar")
      return
    }

    if (isSyncing) {
      Alert.alert("⏳ En proceso", "Ya se está sincronizando el evento...")
      return
    }

    try {
      setIsSyncing(true)
      
      const eventData = {
        title: event.title,
        date: event.date || event.start_date || event.end_date || new Date().toISOString(),
        location: event.location || event.address || "No especificada",
        description: event.description || event.details || "Sin descripción"
      }

      console.log("📊 Sincronizando evento:", eventData)

      const result = await googleSheetsDirectService.syncEvent(eventData)

      if (result.success) {
        Alert.alert("✅ Éxito", result.message)
        console.log("📊 Evento sincronizado:", result.data)
      } else {
        Alert.alert("❌ Error", result.message)
        console.error("📊 Error de sincronización:", result.error)
      }
    } catch (error) {
      console.error("Error sincronizando con Google Sheets:", error)
      Alert.alert("❌ Error", "No se pudo sincronizar con Google Sheets. Verifica tu configuración.")
    } finally {
      setIsSyncing(false)
    }
  }



  // User Modal Component
  const UserModal = () => {
    if (!selectedUser) return null
    
    const userName = getSenderName(selectedUser, false)
    const userColor = getAvatarColor(userName)
    const userInitials = getUserInitials(selectedUser.name, selectedUser.lastname)
    
    return (
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowUserModal(false)}
        >
          <TouchableOpacity 
            style={styles.userModalContent} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.userModalHeader}>
              {getFullImageUrl(selectedUser.profile_picture) ? (
                <Image
                  source={{ uri: getFullImageUrl(selectedUser.profile_picture) }}
                  style={styles.userModalAvatar}
                  onError={() => console.log(`Failed to load modal avatar for ${userName}`)}
                />
              ) : (
                <View style={[styles.userModalAvatar, { backgroundColor: userColor, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={[styles.avatarText, { fontSize: 24 }]}>{userInitials}</Text>
                </View>
              )}
              <Text style={styles.userModalName}>{userName}</Text>
              {selectedUser.username && (
                <Text style={styles.userModalUsername}>@{selectedUser.username}</Text>
              )}
            </View>

            <View style={styles.userModalActions}>
              <TouchableOpacity style={styles.userModalButton} onPress={navigateToProfile}>
                <Ionicons name="person-outline" size={24} color="#007AFF" />
                <Text style={styles.userModalButtonText}>Ver Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.userModalButton} onPress={sendDirectMessage}>
                <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                <Text style={styles.userModalButtonText}>Enviar Mensaje</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    )
  }

  // Get avatar color based on name
  const getAvatarColor = useCallback((name) => {
    const AVATAR_COLORS = ["#007AFF", "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]
    const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }, [])

  // Get user initials
  const getUserInitials = useCallback((name, lastname) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : ""
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : ""
    return firstInitial + lastInitial || "U"
  }, [])

  // Get proper sender name with fallbacks
  const getSenderName = useCallback((sender, isCurrentUser) => {
    if (isCurrentUser) {
      return user?.name || user?.display_name || user?.username || "Tú"
    }
    
    // Try multiple fields to get a proper name
    const name = sender?.name || sender?.display_name || sender?.username
    
    // Validate that the name is not a placeholder
    if (name && 
        name !== "Unknown" && 
        name !== "Unknown User" && 
        name !== "Usuario Desconocido" &&
        !name.startsWith("User ")) {
      return name
    }
    
    // If we have a valid sender ID, try to create a better fallback
    if (sender?.id) {
      return `Usuario ${sender.id}`
    }
    
    return "Usuario"
  }, [user])

  const renderMessage = ({ item }) => {
    const isUser = item.sender.id === user?.user_id || String(item.sender.id) === String(user?.user_id)
    
    // Get proper sender name
    const senderName = getSenderName(item.sender, isUser)
    const avatarColor = getAvatarColor(senderName)
    const initials = getUserInitials(
      isUser ? user?.name : item.sender?.name, 
      isUser ? user?.lastname : item.sender?.lastname
    )

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.otherUserRow]}>
        {!isUser && (
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => showUserProfile(item.sender)}
          >
            {getFullImageUrl(item.sender?.profile_picture) ? (
              <Image
                source={{ uri: getFullImageUrl(item.sender.profile_picture) }}
                style={styles.avatar}
                onError={() => console.log(`Failed to load avatar for user ${senderName}`)}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.otherUserBubble]}>
          {!isUser && (
            <TouchableOpacity onPress={() => showUserProfile(item.sender)}>
              <Text style={styles.senderName}>{senderName}</Text>
            </TouchableOpacity>
          )}
          {item.image && getFullImageUrl(item.image) && (
            <Image
              source={{ uri: getFullImageUrl(item.image) }}
              style={styles.messageImage}
              onError={() => console.log(`Failed to load message image: ${item.image}`)}
            />
          )}
          {item.content && (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.otherUserText]}>{item.content}</Text>
          )}
          <Text style={[styles.messageTimestamp, isUser ? styles.userTimestamp : styles.otherUserTimestamp]}>
            {new Date(item.createdAt || item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatarContainer}>
            {getFullImageUrl(user?.profile_picture) ? (
              <Image
                source={{ uri: getFullImageUrl(user.profile_picture) }}
                style={styles.avatar}
                onError={() => console.log(`Failed to load user avatar`)}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor(user?.name || "User") }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
        )}
      </View>
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{event.title || "Event Chat"}</Text>
              <Text style={styles.statusText}>{messages.length} messages</Text>
            </View>
            <TouchableOpacity style={styles.headerAction} onPress={syncToGoogleSheets} disabled={isSyncing}>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="logo-google" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : !eventId ? (
            <View style={styles.messageContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#fff" />
              <Text style={styles.noMessagesText}>Could not load chat. Invalid event ID.</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.messageContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#fff" />
              </View>
              <Text style={styles.noMessagesTitle}>No messages yet</Text>
              <Text style={styles.noMessagesText}>Be the first to send a message in this chat!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                  colors={["#fff"]}
                />
              }
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            style={styles.inputContainer}
          >
            {pendingImage?.uri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: pendingImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={clearPendingImage}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={message}
                onChangeText={setMessage}
                editable={!!eventId && !!user?.user_id}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!eventId || (message.trim() === "" && !pendingImage?.uri) || !user?.user_id) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!eventId || (message.trim() === "" && !pendingImage?.uri) || !user?.user_id}
              >
                <Ionicons name="arrow-up" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
      


      <UserModal />

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
  backBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: { flex: 1, alignItems: "center" },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: TEXT_PRIMARY_DARK, 
    textAlign: 'center' 
  },
  statusText: { 
    fontSize: 14, 
    color: TEXT_SECONDARY_DARK 
  },
  headerAction: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center", 
    alignItems: "center",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 16, fontSize: 16 },
  messageContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  noMessagesTitle: { fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 8, textAlign: "center" },
  noMessagesText: { fontSize: 16, color: "rgba(255, 255, 255, 0.7)", textAlign: "center", lineHeight: 24 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-end" },
  userRow: { justifyContent: "flex-end" },
  otherUserRow: { justifyContent: "flex-start" },
  avatarContainer: { marginHorizontal: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  bubble: {
    maxWidth: "75%", 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderRadius: 18, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: { 
    backgroundColor: '#007AFF', 
    borderBottomRightRadius: 4 
  },
  otherUserBubble: { 
    backgroundColor: 'rgba(255, 255, 255, 0.12)', 
    borderBottomLeftRadius: 4 
  },
  senderName: { 
    fontSize: 12, 
    color: "rgba(255, 255, 255, 0.8)", 
    marginBottom: 4, 
    fontWeight: "600" 
  },
  messageImage: { 
    width: 200, 
    height: 150, 
    borderRadius: 8, 
    marginBottom: 8,
    resizeMode: "cover" 
  },
  messageText: { 
    fontSize: 16, 
    color: "#fff", 
    lineHeight: 20 
  },
  userText: { color: "#fff" },
  otherUserText: { color: "#fff" },
  messageTimestamp: { 
    fontSize: 11, 
    color: "rgba(255, 255, 255, 0.6)", 
    marginTop: 4, 
    alignSelf: "flex-end" 
  },
  userTimestamp: { color: "rgba(255, 255, 255, 0.7)" },
  otherUserTimestamp: { color: "rgba(255, 255, 255, 0.6)" },
  inputContainer: {
    backgroundColor: "transparent", paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: "center", alignItems: "center", marginRight: 8,
  },
  imagePreviewContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: { 
    width: "100%", 
    height: 200, 
    resizeMode: "cover" 
  },
  removeImageBtn: { 
    position: "absolute", 
    top: 8, 
    right: 8, 
    backgroundColor: "rgba(0, 0, 0, 0.7)", 
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100,
    color: "#fff", fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF',
    justifyContent: "center", alignItems: "center", marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  
  // User Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  userModalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 300,
  },
  userModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  userModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  userModalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  userModalUsername: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  userModalActions: {
    gap: 12,
  },
  userModalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  userModalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
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