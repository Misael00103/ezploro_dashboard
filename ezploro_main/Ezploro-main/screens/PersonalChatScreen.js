"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  StatusBar,
  RefreshControl,
  Modal,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import RealtimeToast from "../components/RealtimeToast"
import PersonalChatHeader from "../components/chat/PersonalChatHeader"
import PersonalMessageBubble from "../components/chat/PersonalMessageBubble"
import PersonalMessageInput from "../components/chat/PersonalMessageInput"
import { useUserBlock } from "../hooks/useUserBlock"
import ChatLoadingState from "../components/chat/ChatLoadingState"
import NetworkDiagnostic from "../components/debug/NetworkDiagnostic"
import { BASE_URL } from "../config"
import { normalizeImageUrl } from "../utils/image"
import socketService from "../services/socketService"
import userBlockService from "../services/userBlockService"
import * as ImagePicker from "expo-image-picker"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSocketConnection } from "../hooks/useSocket"
import imageService from "../services/imageService"

// Modern dark theme color palette
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
  userBubble: "#007AFF",
  otherBubble: "#2A2A2A",
  inputBackground: "#1A1A1A",
}

// Predefined colors for user avatars
const AVATAR_COLORS = ["#007AFF", "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]

export default function PersonalChatScreen({ navigation, route }) {
  const { darkMode } = useTheme()
  const { user, token } = useAuth()
  const { 
    getPrivateMessages, 
    sendPrivateMessage, 
    getChatUserInfo, 
    loading,
    formatMessage,
    getUserDisplayName,
    getUserProfilePicture,
    validateMessage
  } = useChat()
  const { recipient, recipientId } = route.params

  // Debug: Log what we received from navigation
  console.log("[PersonalChatScreen] Navigation params received:", {
    recipient: typeof recipient === 'object' ? recipient : `STRING: ${recipient}`,
    recipientId: recipientId,
    recipientType: typeof recipient,
    recipientKeys: typeof recipient === 'object' ? Object.keys(recipient || {}) : 'N/A'
  });

  // Hook para notificaciones toast
  const { toasts, showMessage, hideToast } = useToast()

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [recipientInfo, setRecipientInfo] = useState(recipient)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const { confirmBlockUser } = useUserBlock()
  const flatListRef = useRef(null)
  const lastFetchRef = useRef(0)

  // Hook para actualizaciones en tiempo real del chat privado
  const { isConnected: socketConnected } = useRealTimeUpdates({
    onNewMessage: (messageData) => {
      console.log("💬 PersonalChatScreen: Nuevo mensaje privado recibido", messageData)

      // Solo agregar si es entre los usuarios correctos
      const isRelevantMessage = (
        (messageData.sender?.id === recipient?.id && messageData.receiver?.id === user?.user_id) ||
        (messageData.sender?.id === user?.user_id && messageData.receiver?.id === recipient?.id)
      )

      if (isRelevantMessage) {
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg.id === messageData.id)
          if (exists) return prev

          return [...prev, messageData].sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt))
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

  // Helper to get full image URL
  const getImageUrl = useCallback((path) => {
    if (!path) return null
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path.replace("http://localhost:3000", "http://10.0.0.2:3000")
    }
    return normalizeImageUrl(path)
  }, [])

  // Get avatar color based on name
  const getAvatarColor = useCallback((name) => {
    const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }, [])

  // Get user initials
  const getUserInitials = useCallback((name, lastname) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : ""
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : ""
    return firstInitial + lastInitial || "U"
  }, [])

  // Record view when opening chat
  const recordView = useCallback(async () => {
    if (!recipient?.id || !user?.user_id) return
    try {
      const token = await AsyncStorage.getItem("token")
      await fetch(`${BASE_URL}/api/views`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object_type: "profile",
          object_id: Number.parseInt(recipient?.id || recipientId),
          viewer_user_id: Number.parseInt(user.user_id),
        }),
      })
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }, [recipient?.id, recipientId, user?.user_id])

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant permission to access your photo library")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const removeSelectedImage = () => setSelectedImage(null)

  // OPTIMIZED fetch messages with debouncing
  const fetchMessages = useCallback(async () => {
    const targetRecipientId = recipient?.id || recipientId;
    
    if (!user?.user_id || !targetRecipientId || !token) {
      console.warn("[PersonalChatScreen] Missing user ID, recipient ID, or token", {
        userId: user?.user_id,
        recipientId: targetRecipientId,
        hasToken: !!token
      })
      setError("Authentication required or recipient missing.")
      setRefreshing(false)
      return
    }

    if (user.user_id === targetRecipientId) {
      console.warn("[PersonalChatScreen] Cannot fetch messages for self-conversation")
      setError("You cannot send messages to yourself in a personal chat.")
      setRefreshing(false)
      return
    }

    // Debouncing - prevent too frequent calls
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) {
      console.log("[PersonalChatScreen] Debouncing fetch messages call")
      return
    }
    lastFetchRef.current = now

    try {
      setRefreshing(true)
      setError(null)
      console.log(`[PersonalChatScreen] Fetching messages for senderId: ${user.user_id}, receiverId: ${targetRecipientId}`)

      // Siempre fetch user info para obtener datos actualizados
      try {
        console.log(`[PersonalChatScreen] Fetching complete user info for recipient: ${targetRecipientId}`)

        // Use the getChatUserInfo function from context
        const userData = await getChatUserInfo(targetRecipientId)
        console.log(`[PersonalChatScreen] Fetched user data:`, userData)

        if (userData) {
          const updatedRecipient = {
            ...recipient,
            // Preservar la información original si el backend no tiene datos completos
            name: userData.name || userData.display_name || userData.username || recipient.name || recipient.display_name || recipient.username || "Unknown",
            display_name: userData.display_name || userData.name || recipient.display_name || recipient.name || "",
            username: userData.username || recipient.username || "",
            lastname: userData.lastname || recipient.lastname || "",
            profile_picture: userData.profile_picture || recipient.profile_picture,
          }

          console.log(`[PersonalChatScreen] Updated recipient info:`, updatedRecipient)
          setRecipientInfo(updatedRecipient)
        } else {
          console.warn(`[PersonalChatScreen] No valid user data received, using original recipient data`)
          // Asegurar que recipient tenga la estructura correcta
          const fallbackRecipient = {
            ...recipient,
            name: recipient.name || recipient.display_name || recipient.username || `User ${recipient.id}`,
            display_name: recipient.display_name || recipient.name || "",
            username: recipient.username || "",
            lastname: recipient.lastname || "",
            profile_picture: recipient.profile_picture || null,
          }
          setRecipientInfo(fallbackRecipient)
        }
      } catch (userError) {
        console.warn("[PersonalChatScreen] Could not fetch user info:", userError)
        setRecipientInfo(recipient)
      }

      console.log(`[PersonalChatScreen] Calling getPrivateMessages with senderId: ${user.user_id}, receiverId: ${targetRecipientId}`)
      const data = await getPrivateMessages(user.user_id, targetRecipientId)
      console.log(`[PersonalChatScreen] getPrivateMessages returned:`, data)
      console.log(`[PersonalChatScreen] Data type:`, typeof data)
      console.log(`[PersonalChatScreen] Is array:`, Array.isArray(data))

      if (Array.isArray(data)) {
        console.log(`[PersonalChatScreen] Found ${data.length} messages`)
        
        // Formatear mensajes usando el servicio
        const formattedMessages = data.map(message => formatMessage(message))
        
        // Ordenar por fecha de creación
        const sortedMessages = formattedMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
        
        setMessages(sortedMessages)
        setError(data.length === 0 ? "No messages yet. Send a message to start the conversation." : null)

        // Record view
        await recordView()
      } else {
        console.warn("[PersonalChatScreen] getPrivateMessages did not return an array:", data)
        setMessages([])
        setError("Invalid message data received from server.")
      }
    } catch (err) {
      console.error("[PersonalChatScreen] Error fetching messages:", err)
      console.error("[PersonalChatScreen] Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      })

      if (err.message && err.message.includes('404')) {
        console.log("[PersonalChatScreen] No messages found (404) - this is normal for new conversations")
        setMessages([])
        setError("No messages yet. Send a message to start the conversation.")
      } else if (err.message && err.message.includes('401')) {
        setError("Authentication required. Please log in again.")
      } else {
        setError(err.message || "Could not connect to the server. Check your connection.")
      }
    } finally {
      setRefreshing(false)
    }
  }, [user, recipient, token, getPrivateMessages, getChatUserInfo, recordView])

  // Función para obtener información del recipient cuando no la tenemos
  const fetchRecipientInfo = useCallback(async () => {
    if (!recipientId || !token) {
      console.warn('[PersonalChatScreen] Missing recipientId or token for fetchRecipientInfo');
      return;
    }

    try {
      console.log('[PersonalChatScreen] Fetching recipient info for ID:', recipientId);
      const userInfo = await getChatUserInfo(recipientId);
      
      if (userInfo) {
        console.log('[PersonalChatScreen] Recipient info fetched successfully:', userInfo);
        setRecipientInfo(userInfo);
        
        // También actualizar el recipient si es null
        if (!recipient || recipient === null) {
          // Crear un objeto recipient compatible
          const recipientData = {
            id: userInfo.id,
            name: userInfo.name,
            lastname: userInfo.lastname,
            profile_picture: userInfo.profile_picture,
            display_name: userInfo.display_name,
            username: userInfo.username
          };
          console.log('[PersonalChatScreen] Setting recipient data:', recipientData);
          // Nota: No podemos usar setRecipient aquí porque recipient viene de navigation params
          // Pero recipientInfo se usará para mostrar el nombre
        }
      } else {
        console.warn('[PersonalChatScreen] No user info received for ID:', recipientId);
      }
    } catch (error) {
      console.error('[PersonalChatScreen] Error fetching recipient info:', error);
    }
  }, [recipientId, token, getChatUserInfo]);

  // Initial load of messages
  useEffect(() => {
    console.log("[PersonalChatScreen] Component mounted, fetching messages")
    fetchMessages()
  }, [fetchMessages])

  // Obtener información del recipient si no la tenemos
  useEffect(() => {
    if (recipientId && (!recipient || recipient === null)) {
      console.log('[PersonalChatScreen] No recipient info, fetching from backend for ID:', recipientId);
      fetchRecipientInfo();
    }
  }, [recipientId, recipient])

  const handlePrivateMessage = useCallback(
    (newMessage) => {
      const targetRecipientId = recipient?.id || recipientId;
      if (
        (newMessage.senderId === user.user_id && newMessage.receiverId === targetRecipientId) ||
        (newMessage.senderId === targetRecipientId && newMessage.receiverId === user.user_id)
      ) {
        const formattedMessage = {
          id: newMessage.id || Date.now().toString(),
          content: newMessage.content,
          image: newMessage.image || [],
          createdAt: newMessage.createdAt || newMessage.created_at || new Date().toISOString(),
          sender: {
            id: newMessage.senderId,
            name: newMessage.sender?.name || (newMessage.senderId === user.user_id ? user.name : recipientInfo?.name),
            lastname:
              newMessage.sender?.lastname ||
              (newMessage.senderId === user.user_id ? user.lastname : recipientInfo?.lastname),
            profile_picture:
              newMessage.sender?.profile_picture ||
              (newMessage.senderId === user.user_id ? user.profile_picture : recipientInfo?.profile_picture),
          },
          receiver: {
            id: newMessage.receiverId,
            name:
              newMessage.receiver?.name || (newMessage.receiverId === user.user_id ? user.name : recipientInfo?.name),
            lastname:
              newMessage.receiver?.lastname ||
              (newMessage.receiverId === user.user_id ? user.lastname : recipientInfo?.lastname),
            profile_picture:
              newMessage.receiver?.profile_picture ||
              (newMessage.receiverId === user.user_id ? user.profile_picture : recipientInfo?.profile_picture),
          },
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === formattedMessage.id)
          if (!exists) {
            const newMessages = [...prev, formattedMessage]
            return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          }
          return prev
        })

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    },
    [user, recipient, recipientInfo],
  )

  useSocketConnection(socketService, {
    userId: user?.user_id,
    recipientId: recipient?.id,
    onPrivateMessage: handlePrivateMessage,
    enabled: !!(recipient?.id && user?.user_id),
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  // OPTIMIZED send message with new chat service
  const handleSend = useCallback(async () => {
    if (!message.trim() && !selectedImage) return
    
    const targetRecipientId = recipient?.id || recipientId;
    
    if (!user?.user_id || !targetRecipientId || !token) {
      Alert.alert("Error", "User not authenticated or recipient missing.")
      return
    }
    if (user.user_id === targetRecipientId) {
      Alert.alert("Error", "Cannot send messages to yourself.")
      return
    }

    // Validar mensaje antes de enviarlo
    const images = selectedImage ? [selectedImage] : []
    const validation = validateMessage(message.trim(), images)
    if (!validation.valid) {
      Alert.alert("Error", validation.error)
      return
    }

    if (sendingMessage) return
    setSendingMessage(true)

    const tempId = `temp_${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      content: message.trim(),
      image: selectedImage?.uri ? [selectedImage.uri] : [],
      createdAt: new Date(),
      sender: {
        id: user.user_id,
        profile_picture: getUserProfilePicture(user),
        name: getUserDisplayName(user),
        lastname: user.lastname || "",
      },
      receiver: {
        id: targetRecipientId,
        profile_picture: getUserProfilePicture(recipientInfo),
        name: getUserDisplayName(recipientInfo),
        lastname: recipientInfo?.lastname || "",
      },
    }

    // Agregar mensaje optimista a la UI
    setMessages((prev) => [...prev, optimisticMessage])
    setMessage("")
    setSelectedImage(null)
    flatListRef.current?.scrollToEnd({ animated: true })

    try {
      // Preparar imágenes para envío
      let imagesToSend = []
      if (selectedImage?.uri) {
        const imageObject = {
          uri: selectedImage.uri,
          name: selectedImage.fileName || `image-${Date.now()}.jpg`,
          type: selectedImage.type || "image/jpeg",
        }
        imagesToSend = [imageObject]
      }

      console.log(`📤 Sending private message to ${targetRecipientId}:`, {
        content: optimisticMessage.content,
        hasImages: imagesToSend.length > 0
      })

      // Enviar mensaje usando el nuevo servicio
      const savedMessage = await sendPrivateMessage(
        user.user_id, 
        targetRecipientId, 
        optimisticMessage.content, 
        imagesToSend
      )

      console.log(`✅ Message sent successfully:`, savedMessage)

      // Reemplazar mensaje temporal con el real
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? formatMessage(savedMessage) : m))
      )

      // Notificar via Socket.IO si está disponible
      if (socketService.isSocketAvailable()) {
        socketService.sendPrivateMessage(targetRecipientId, {
          senderId: user.user_id,
          receiverId: targetRecipientId,
          content: savedMessage.content,
          messageId: savedMessage.id,
          timestamp: new Date().toISOString(),
        })
      }

      // Mostrar toast de éxito
      showMessage("Mensaje enviado", 2000)

    } catch (err) {
      console.error("❌ Error sending message:", {
        error: err.message,
        stack: err.stack,
        name: err.name,
        targetRecipientId,
        userId: user.user_id,
        hasToken: !!token,
        messageContent: optimisticMessage.content,
        hasImages: imagesToSend.length > 0
      })
      Alert.alert("Error", err.message || "Could not send message. Please try again.")
      
      // Remover mensaje optimista en caso de error
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      
      // Restaurar el mensaje en el input si falló
      setMessage(optimisticMessage.content)
      if (imagesToSend.length > 0) {
        setSelectedImage(imagesToSend[0])
      }
    } finally {
      setSendingMessage(false)
    }
  }, [
    message, 
    selectedImage, 
    user, 
    recipient, 
    recipientInfo, 
    token, 
    sendingMessage, 
    sendPrivateMessage,
    validateMessage,
    formatMessage,
    getUserDisplayName,
    getUserProfilePicture,
    showMessage
  ])

  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchMessages()
    }
  }, [fetchMessages, refreshing])

  // Options Modal Component
  const OptionsModal = () => (
    <Modal
      visible={showOptionsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowOptionsModal(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.optionsModalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.optionsHeader}>
            <Text style={styles.optionsTitle}>User Options</Text>
            <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.optionButton} onPress={navigateToProfile}>
            <Ionicons name="person-outline" size={24} color="#007AFF" />
            <Text style={styles.optionText}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, styles.dangerOption]} onPress={blockUser}>
            <Ionicons name="ban-outline" size={24} color="#FF453A" />
            <Text style={[styles.optionText, styles.dangerText]}>Block User</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )

  const navigateToProfile = () => {
    setShowOptionsModal(false)
    const targetRecipientId = recipient?.id || recipientId;
    navigation.navigate("OtherProfile", {
      userId: targetRecipientId,
      user: recipientInfo,
    })
  }

  const blockUser = async () => {
    setShowOptionsModal(false)

    Alert.alert("Block User", `Are you sure you want to block ${recipientInfo?.name || "this user"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block User",
        style: "destructive",
        onPress: async () => {
          try {
            const targetRecipientId = recipient?.id || recipientId;
            await userBlockService.blockUser(token, user.user_id, targetRecipientId, "Blocked from chat")
            Alert.alert("User Blocked", `${recipientInfo?.name || "User"} has been blocked successfully.`)
            navigation.goBack()
          } catch (error) {
            console.error("Error blocking user:", error)
            Alert.alert("Block Failed", `Failed to block user: ${error.message}`)
          }
        },
      },
    ])
  }

  const renderMessage = ({ item }) => {
    const isUser = String(item.sender.id) === String(user?.user_id)

    let senderName
    if (isUser) {
      senderName = user?.name || user?.display_name || user?.username || "Tú"
    } else {
      senderName = recipientInfo?.name || recipientInfo?.display_name || recipientInfo?.username || "Usuario"
      if (item.sender?.name && item.sender.name !== "Unknown") {
        senderName = item.sender.name
      }
    }

    const avatarColor = getAvatarColor(senderName)
    const initials = getUserInitials(senderName, isUser ? user?.lastname : recipientInfo?.lastname)
    const displayAvatar = getImageUrl(isUser ? user?.profile_picture : recipientInfo?.profile_picture)

    return (
      <PersonalMessageBubble
        message={item}
        isUser={isUser}
        senderName={senderName}
        avatarColor={avatarColor}
        initials={initials}
        displayAvatar={displayAvatar}
        onUserPress={() => { }} // Puedes agregar lógica aquí si necesitas
      />
    )
  }

  const showInitialLoading = loading && messages.length === 0 && !refreshing
  const currentRecipient = recipientInfo || recipient

  const getRecipientNameFromMessages = () => {
    // Función helper para validar si un nombre es válido
    const isValidName = (name) => {
      return name && 
             typeof name === 'string' && 
             name.trim() !== "" && 
             name !== "Unknown" && 
             name !== "Unknown User" &&
             !name.startsWith("User ");
    }

    console.log("[PersonalChatScreen] Getting recipient name:", {
      recipient: typeof recipient === 'object' ? recipient : `STRING: ${recipient}`,
      recipientId: recipientId,
      recipientInfo: typeof recipientInfo === 'object' ? recipientInfo : `STRING: ${recipientInfo}`,
      recipientType: typeof recipient,
      recipientInfoType: typeof recipientInfo
    });

    // 1. Check recipientInfo first (this should have the most up-to-date info)
    if (isValidName(recipientInfo?.name)) {
      return recipientInfo.name;
    }
    if (isValidName(recipientInfo?.display_name)) {
      return recipientInfo.display_name;
    }
    if (isValidName(recipientInfo?.username)) {
      return recipientInfo.username;
    }

    // 2. Check original recipient data (from navigation params)
    if (isValidName(recipient?.name)) {
      return recipient.name;
    }
    if (isValidName(recipient?.display_name)) {
      return recipient.display_name;
    }
    if (isValidName(recipient?.username)) {
      return recipient.username;
    }

    // 3. Try to get name from messages
    if (messages && messages.length > 0) {
      const targetId = recipient?.id || recipientId;
      const recipientMessage = messages.find(
        (msg) => String(msg.sender?.id) === String(targetId) && isValidName(msg.sender?.name)
      );
      if (recipientMessage) {
        return recipientMessage.sender.name;
      }
    }

    // 4. Last resort: create a readable fallback
    console.warn("[PersonalChatScreen] Could not determine recipient name, using fallback", {
      recipientInfo: recipientInfo?.name,
      recipient: recipient?.name,
      recipientId: recipientId
    });
    
    return recipient?.name || recipient?.display_name || recipient?.username || recipientInfo?.name || recipientInfo?.display_name || `User ${recipientId || 'Unknown'}`;
  }

  const finalRecipientName = getRecipientNameFromMessages()
  const recipientColor = getAvatarColor(finalRecipientName)
  const recipientInitials = getUserInitials(currentRecipient?.name, currentRecipient?.lastname)

  if (showInitialLoading) {
    return <ChatLoadingState message="Loading private chat..." darkMode={true} />
  }

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <SafeAreaView style={styles.safeArea}>
        <PersonalChatHeader
          recipientName={finalRecipientName}
          recipientAvatar={currentRecipient?.profile_picture}
          recipientColor={recipientColor}
          recipientInitials={recipientInitials}
          onBack={() => navigation.goBack()}
          onOptionsPress={() => setShowOptionsModal(true)}
          getImageUrl={getImageUrl}
        />

        {error && error !== "No messages yet. Send a message to start the conversation." && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.retryButton, styles.diagnosticButton]} 
                onPress={() => setShowDiagnostic(true)}
              >
                <Text style={styles.retryText}>Diagnóstico</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {messages.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color="#fff" />
            </View>
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyText}>Send a message to {finalRecipientName} to begin your chat</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={20}
          />
        )}

        <PersonalMessageInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
          onImagePick={pickImage}
          selectedImage={selectedImage}
          onRemoveImage={removeSelectedImage}
          sendingMessage={sendingMessage}
        />

        <OptionsModal />

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

        {/* Diagnóstico de red */}
        <NetworkDiagnostic 
          visible={showDiagnostic} 
          onClose={() => setShowDiagnostic(false)} 
        />
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 16,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  headerTextContainer: { alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 2 },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-end" },
  userRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  avatarContainer: { marginHorizontal: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  bubble: {
    maxWidth: "70%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  userBubble: { backgroundColor: "rgba(255, 255, 255, 0.15)", borderBottomRightRadius: 6 },
  otherBubble: { backgroundColor: "rgba(255, 255, 255, 0.08)", borderBottomLeftRadius: 6 },
  senderName: { fontSize: 12, color: "rgba(255, 255, 255, 0.7)", marginBottom: 4, fontWeight: "500" },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8, resizeMode: "cover" },
  messageText: { fontSize: 16, color: "#fff", lineHeight: 22 },
  userText: { color: "#fff" },
  otherText: { color: "#fff" },
  timestamp: { fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginTop: 4, alignSelf: "flex-end" },
  userTimestamp: { color: "rgba(255, 255, 255, 0.6)" },
  otherTimestamp: { color: "rgba(255, 255, 255, 0.6)" },
  inputContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  imagePreviewContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: 200, resizeMode: "cover" },
  removeImageBtn: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.7)", borderRadius: 12 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  diagnosticButton: {
    backgroundColor: '#FF9500',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },BtnDisabled: { backgroundColor: "rgba(255, 255, 255, 0.3)" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 16, fontSize: 16 },
  errorContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  errorText: { color: "#FF6B6B", fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 16, color: "rgba(255, 255, 255, 0.7)", textAlign: "center", lineHeight: 24 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsModalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 300,
  },
  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  optionsTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  dangerOption: { backgroundColor: "rgba(255, 69, 58, 0.1)" },
  optionText: { fontSize: 16, fontWeight: "500", color: "#007AFF" },
  dangerText: { color: "#FF453A" },
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