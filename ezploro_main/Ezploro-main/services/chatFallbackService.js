// services/chatFallbackService.js - Servicio de fallback para chat cuando el backend no está disponible
import AsyncStorage from "@react-native-async-storage/async-storage"

class ChatFallbackService {
  constructor() {
    this.localMessages = new Map() // chatId -> messages
    this.localChats = new Map() // userId -> chats
    this.isInitialized = false
  }

  // Inicializar servicio de fallback
  async initialize() {
    if (this.isInitialized) return

    try {
      // Cargar datos locales del storage
      await this.loadLocalData()
      this.isInitialized = true
      console.log("📦 ChatFallbackService inicializado")
    } catch (error) {
      console.error("❌ Error inicializando ChatFallbackService:", error)
    }
  }

  // Cargar datos locales
  async loadLocalData() {
    try {
      const [messagesData, chatsData] = await Promise.all([
        AsyncStorage.getItem("fallback_messages"),
        AsyncStorage.getItem("fallback_chats")
      ])

      if (messagesData) {
        const messages = JSON.parse(messagesData)
        this.localMessages = new Map(Object.entries(messages))
      }

      if (chatsData) {
        const chats = JSON.parse(chatsData)
        this.localChats = new Map(Object.entries(chats))
      }

      console.log("📦 Datos locales cargados:", {
        messages: this.localMessages.size,
        chats: this.localChats.size
      })
    } catch (error) {
      console.warn("⚠️ Error cargando datos locales:", error)
    }
  }

  // Guardar datos locales
  async saveLocalData() {
    try {
      const messagesObj = Object.fromEntries(this.localMessages)
      const chatsObj = Object.fromEntries(this.localChats)

      await Promise.all([
        AsyncStorage.setItem("fallback_messages", JSON.stringify(messagesObj)),
        AsyncStorage.setItem("fallback_chats", JSON.stringify(chatsObj))
      ])

      console.log("💾 Datos locales guardados")
    } catch (error) {
      console.error("❌ Error guardando datos locales:", error)
    }
  }

  // Obtener mensajes entre usuarios (fallback)
  async getMessagesBetweenUsers(senderId, receiverId) {
    await this.initialize()

    const chatId = this.getChatId(senderId, receiverId)
    const messages = this.localMessages.get(chatId) || []

    console.log(`📦 Fallback: Obteniendo ${messages.length} mensajes para chat ${chatId}`)
    return messages
  }

  // Crear mensaje privado (fallback)
  async createPrivateMessage(senderId, receiverId, content, images = []) {
    await this.initialize()

    const chatId = this.getChatId(senderId, receiverId)
    const messageId = Date.now()

    const message = {
      id: messageId,
      content: content,
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      createdAt: new Date().toISOString(),
      image: images.map(img => img.uri || img),
      sender: {
        id: parseInt(senderId),
        name: "Tú",
        lastname: "",
        profile_picture: ""
      },
      receiver: {
        id: parseInt(receiverId),
        name: `Usuario ${receiverId}`,
        lastname: "",
        profile_picture: ""
      },
      isLocal: true,
      fallback: true
    }

    // Agregar mensaje a la lista local
    const messages = this.localMessages.get(chatId) || []
    messages.push(message)
    this.localMessages.set(chatId, messages)

    // Actualizar chat en la lista
    await this.updateChatInList(senderId, receiverId, content)

    // Guardar datos
    await this.saveLocalData()

    console.log("📦 Fallback: Mensaje creado localmente:", messageId)
    return message
  }

  // Obtener chats del usuario (fallback)
  async getUserChats(userId) {
    await this.initialize()

    const chats = this.localChats.get(String(userId)) || []
    console.log(`📦 Fallback: Obteniendo ${chats.length} chats para usuario ${userId}`)
    return chats
  }

  // Actualizar chat en la lista
  async updateChatInList(senderId, receiverId, lastMessage) {
    const senderChats = this.localChats.get(String(senderId)) || []
    const receiverChats = this.localChats.get(String(receiverId)) || []

    const now = new Date().toISOString()

    // Actualizar chat del remitente
    let senderChatIndex = senderChats.findIndex(chat => chat.userId === parseInt(receiverId))
    if (senderChatIndex === -1) {
      senderChats.push({
        userId: parseInt(receiverId),
        name: `Usuario ${receiverId}`,
        lastname: "",
        username: "",
        display_name: `Usuario ${receiverId}`,
        profile_picture: "",
        lastMessage: lastMessage,
        lastMessageTime: now,
        lastMessageDate: now,
        unreadCount: 0,
        isLocal: true
      })
    } else {
      senderChats[senderChatIndex].lastMessage = lastMessage
      senderChats[senderChatIndex].lastMessageTime = now
      senderChats[senderChatIndex].lastMessageDate = now
    }

    // Actualizar chat del receptor
    let receiverChatIndex = receiverChats.findIndex(chat => chat.userId === parseInt(senderId))
    if (receiverChatIndex === -1) {
      receiverChats.push({
        userId: parseInt(senderId),
        name: `Usuario ${senderId}`,
        lastname: "",
        username: "",
        display_name: `Usuario ${senderId}`,
        profile_picture: "",
        lastMessage: lastMessage,
        lastMessageTime: now,
        lastMessageDate: now,
        unreadCount: 1,
        isLocal: true
      })
    } else {
      receiverChats[receiverChatIndex].lastMessage = lastMessage
      receiverChats[receiverChatIndex].lastMessageTime = now
      receiverChats[receiverChatIndex].lastMessageDate = now
      receiverChats[receiverChatIndex].unreadCount = (receiverChats[receiverChatIndex].unreadCount || 0) + 1
    }

    // Ordenar por fecha más reciente
    senderChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    receiverChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))

    // Guardar listas actualizadas
    this.localChats.set(String(senderId), senderChats)
    this.localChats.set(String(receiverId), receiverChats)
  }

  // Obtener información del usuario (fallback)
  async getChatUserInfo(userId) {
    await this.initialize()

    // Devolver información básica
    return {
      id: parseInt(userId),
      user_id: parseInt(userId),
      name: `Usuario ${userId}`,
      lastname: "",
      username: `user${userId}`,
      display_name: `Usuario ${userId}`,
      profile_picture: "",
      isLocal: true
    }
  }

  // Marcar chat como leído
  async markChatAsRead(userId, otherUserId) {
    await this.initialize()

    const chats = this.localChats.get(String(userId)) || []
    const chatIndex = chats.findIndex(chat => chat.userId === parseInt(otherUserId))
    
    if (chatIndex !== -1) {
      chats[chatIndex].unreadCount = 0
      this.localChats.set(String(userId), chats)
      await this.saveLocalData()
    }
  }

  // Generar ID de chat
  getChatId(userId1, userId2) {
    const ids = [userId1, userId2].sort()
    return `${ids[0]}_${ids[1]}`
  }

  // Limpiar datos locales
  async clearLocalData() {
    this.localMessages.clear()
    this.localChats.clear()
    
    try {
      await Promise.all([
        AsyncStorage.removeItem("fallback_messages"),
        AsyncStorage.removeItem("fallback_chats")
      ])
      console.log("🧹 Datos locales limpiados")
    } catch (error) {
      console.error("❌ Error limpiando datos locales:", error)
    }
  }

  // Obtener estadísticas
  getStats() {
    return {
      totalChats: Array.from(this.localChats.values()).reduce((sum, chats) => sum + chats.length, 0),
      totalMessages: Array.from(this.localMessages.values()).reduce((sum, messages) => sum + messages.length, 0),
      isInitialized: this.isInitialized
    }
  }

  // Verificar si hay datos locales
  hasLocalData() {
    return this.localMessages.size > 0 || this.localChats.size > 0
  }
}

export default new ChatFallbackService()