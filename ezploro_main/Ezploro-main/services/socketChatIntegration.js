// services/socketChatIntegration.js - Integración completa de Socket.IO para chats
import AsyncStorage from "@react-native-async-storage/async-storage"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config"

class SocketChatIntegration {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentUserId = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  // Inicializar conexión
  async initialize(userId) {
    if (this.socket && this.isConnected && this.currentUserId === userId) {
      return this.socket
    }

    this.currentUserId = userId
    await this.connect()
    return this.socket
  }

  // Conectar a Socket.IO
  async connect() {
    try {
      if (this.socket) {
        this.socket.disconnect()
      }

      const token = await AsyncStorage.getItem("token")
      
      console.log("🔌 Conectando a Socket.IO para chats privados...")
      console.log("🔌 URL:", SOCKET_URL)
      console.log("🔌 Usuario:", this.currentUserId)
      console.log("🔌 Token disponible:", !!token)

      // Validar URL antes de conectar
      if (!SOCKET_URL || SOCKET_URL.includes('undefined') || SOCKET_URL.includes('/-')) {
        console.error("❌ SOCKET_URL inválida:", SOCKET_URL)
        throw new Error("URL de socket inválida")
      }

      this.socket = io(SOCKET_URL, {
        transports: ["polling"], // Solo polling para evitar problemas CORS
        auth: {
          token: token || "",
          userId: String(this.currentUserId || ""),
        },
        query: {
          token: token || "",
          userId: String(this.currentUserId || ""),
          type: "private-chat"
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 30000, // Aumentar timeout
        forceNew: true,
        upgrade: false, // No hacer upgrade a WebSocket
        rememberUpgrade: false
      })

      this.setupEventHandlers()

    } catch (error) {
      console.error("❌ Error conectando Socket.IO:", error)
      throw error
    }
  }

  // Configurar manejadores de eventos
  setupEventHandlers() {
    if (!this.socket) return

    // Conexión exitosa
    this.socket.on("connect", () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log("✅ Socket.IO conectado para chats:", this.socket.id)
      
      // Unirse a sala personal del usuario
      if (this.currentUserId) {
        this.socket.emit("join-user-room", { userId: this.currentUserId })
      }
    })

    // Desconexión
    this.socket.on("disconnect", (reason) => {
      this.isConnected = false
      console.log("🔌 Socket.IO desconectado:", reason)
    })

    // Error de conexión
    this.socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión Socket.IO:", error.message || error)
      this.isConnected = false
      this.reconnectAttempts++
      
      // Manejar errores específicos
      if (error.message && error.message.includes("xhr poll error")) {
        console.warn("🌐 Error de red detectado - el servidor puede no estar disponible")
      } else if (error.message && error.message.includes("CORS")) {
        console.warn("🚫 Error CORS - verificar configuración del servidor")
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Máximo de intentos de reconexión alcanzado")
        console.log("💡 Continuando en modo offline - los mensajes se guardarán localmente")
      }
    })

    // Reconexión exitosa
    this.socket.on("reconnect", (attemptNumber) => {
      console.log("✅ Socket.IO reconectado en intento:", attemptNumber)
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Re-unirse a sala personal
      if (this.currentUserId) {
        this.socket.emit("join-user-room", { userId: this.currentUserId })
      }
    })

    // Eventos específicos de chat privado
    this.setupChatEventHandlers()
  }

  // Configurar manejadores específicos de chat
  setupChatEventHandlers() {
    if (!this.socket) return

    // Nuevo mensaje privado recibido
    this.socket.on("privateMessage", (data) => {
      console.log("📨 Mensaje privado recibido:", data)
      this.notifyListeners("newPrivateMessage", data)
    })

    // Nuevo mensaje en chat privado
    this.socket.on("newPrivateMessage", (data) => {
      console.log("💬 Nuevo mensaje en chat:", data)
      this.notifyListeners("newPrivateMessage", data)
    })

    // Lista de chats actualizada
    this.socket.on("chatListUpdate", (data) => {
      console.log("📋 Lista de chats actualizada:", data)
      this.notifyListeners("chatListUpdate", data)
    })

    // Error en lista de chats
    this.socket.on("chatListError", (data) => {
      console.error("❌ Error en lista de chats:", data)
      this.notifyListeners("chatListError", data)
    })

    // Chat marcado como leído
    this.socket.on("chatMarkedRead", (data) => {
      console.log("✅ Chat marcado como leído:", data)
      this.notifyListeners("chatMarkedRead", data)
    })

    // Usuario escribiendo
    this.socket.on("userTyping", (data) => {
      console.log("✍️ Usuario escribiendo:", data)
      this.notifyListeners("userTyping", data)
    })

    // Estado online de usuario
    this.socket.on("userOnlineStatus", (data) => {
      console.log("🟢 Estado online:", data)
      this.notifyListeners("userOnlineStatus", data)
    })

    // Confirmaciones
    this.socket.on("user-room-joined", (data) => {
      console.log("🏠 Sala personal unida:", data)
    })

    this.socket.on("private-chat-joined", (data) => {
      console.log("💬 Chat privado unido:", data)
    })

    this.socket.on("private-chat-left", (data) => {
      console.log("🚪 Chat privado abandonado:", data)
    })
  }

  // Unirse a chat privado
  joinPrivateChat(userId1, userId2) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para unirse a chat privado")
      return
    }

    console.log("🏠 Uniéndose a chat privado:", userId1, "con", userId2)
    this.socket.emit("join-private-chat", {
      userId1: String(userId1),
      userId2: String(userId2)
    })
  }

  // Salir de chat privado
  leavePrivateChat(userId1, userId2) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para salir de chat privado")
      return
    }

    console.log("🚪 Saliendo de chat privado:", userId1, "con", userId2)
    this.socket.emit("leave-private-chat", {
      userId1: String(userId1),
      userId2: String(userId2)
    })
  }

  // Enviar mensaje privado
  sendPrivateMessage(receiverId, message, messageData = null) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para enviar mensaje")
      return
    }

    console.log("📤 Enviando mensaje privado a:", receiverId)
    this.socket.emit("private-message-sent", {
      receiverId: String(receiverId),
      message,
      messageData,
      timestamp: new Date().toISOString()
    })
  }

  // Marcar chat como leído
  markChatAsRead(otherUserId) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para marcar como leído")
      return
    }

    console.log("✅ Marcando chat como leído con:", otherUserId)
    this.socket.emit("mark-chat-read", {
      userId: String(this.currentUserId),
      otherUserId: String(otherUserId)
    })
  }

  // Solicitar actualización de lista de chats
  requestChatListUpdate() {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para solicitar actualización")
      return
    }

    console.log("📋 Solicitando actualización de lista de chats")
    this.socket.emit("request-chat-list-update", {
      userId: String(this.currentUserId)
    })
  }

  // Notificar que usuario está escribiendo
  notifyTyping(otherUserId, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket no conectado para notificar escritura")
      return
    }

    this.socket.emit("user-typing", {
      otherUserId: String(otherUserId),
      isTyping
    })
  }

  // Suscribirse a eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
  }

  // Desuscribirse de eventos
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  // Notificar a listeners
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ Error en callback de ${event}:`, error)
        }
      })
    }
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.currentUserId = null
    this.listeners.clear()
    console.log("🔌 Socket.IO desconectado manualmente")
  }

  // Obtener estado
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentUserId: this.currentUserId,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // Reconectar manualmente
  async reconnect() {
    console.log("🔄 Reconectando Socket.IO manualmente...")
    this.disconnect()
    if (this.currentUserId) {
      await this.connect()
    }
  }
}

export default new SocketChatIntegration()