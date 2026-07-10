// services/privateChatService.js - Servicio completo para chat privado conectado al backend
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BASE_URL } from "../config"

class PrivateChatService {
    constructor() {
        this.isInitialized = false
        this.currentUserId = null
        this.activeChats = new Map() // userId -> chat data
        this.messageListeners = new Map() // chatId -> callback
        this.chatListListeners = new Set()
        this.messageCache = new Map() // chatId -> messages array
        this.socketIntegration = null
    }

    // Inicializar el servicio
    async initialize(userId) {
        if (this.isInitialized && this.currentUserId === userId) {
            return
        }

        this.currentUserId = userId
        this.isInitialized = true

        console.log("💬 PrivateChatService: Inicializando para usuario", userId)

        try {
            // Ejecutar diagnóstico de conectividad
            const { default: connectivityService } = await import("./connectivityService")
            const diagnostics = await connectivityService.runDiagnostics()
            const recommendations = connectivityService.getRecommendations(diagnostics)

            console.log("📊 Diagnóstico de chat:", diagnostics)
            console.log("💡 Recomendaciones:", recommendations)

            // Solo intentar Socket.IO si hay conectividad
            if (diagnostics.socket && diagnostics.auth) {
                // Inicializar integración de Socket.IO con importación dinámica
                const { default: socketChatIntegration } = await import("./socketChatIntegration")
                this.socketIntegration = socketChatIntegration
                await this.socketIntegration.initialize(userId)

                // Configurar listeners de Socket.IO
                this.setupSocketListeners()
                console.log("✅ Socket.IO inicializado correctamente")
            } else {
                console.log("⚠️ Socket.IO no disponible - usando modo offline")
            }
        } catch (error) {
            console.error("❌ Error inicializando socketChatIntegration:", error)
            console.log("🔄 Continuando en modo offline")
        }
    }

    // Configurar listeners de Socket.IO
    setupSocketListeners() {
        if (!this.socketIntegration) {
            console.warn("⚠️ Socket integration no disponible")
            return
        }

        // Listener para nuevos mensajes privados
        this.socketIntegration.on("newPrivateMessage", (messageData) => {
            console.log("📨 Nuevo mensaje privado recibido:", messageData)
            this.handleNewMessage(messageData)
        })

        // Listener para actualizaciones de lista de chats
        this.socketIntegration.on("chatListUpdate", (data) => {
            console.log("📋 Actualización de lista de chats:", data)
            this.handleChatListUpdate(data)
        })

        // Listener para estado online de usuarios
        this.socketIntegration.on("userOnlineStatus", (statusData) => {
            console.log("🟢 Estado online actualizado:", statusData)
            this.handleUserOnlineStatus(statusData)
        })

        // Listener para chat marcado como leído
        this.socketIntegration.on("chatMarkedRead", (data) => {
            console.log("✅ Chat marcado como leído:", data)
            this.handleChatMarkedRead(data)
        })

        // Listener para usuario escribiendo
        this.socketIntegration.on("userTyping", (data) => {
            console.log("✍️ Usuario escribiendo:", data)
            this.handleUserTyping(data)
        })
    }

    // Obtener lista de chats del usuario
    async getUserChats(userId) {
        try {
            console.log("🔍 Obteniendo chats para usuario:", userId)

            const token = await AsyncStorage.getItem("token")
            if (!token) {
                throw new Error("Token no encontrado")
            }

            const endpoint = `${BASE_URL}/conversations`
            console.log("📡 Obteniendo chats desde:", endpoint)

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (response.ok) {
                const data = await response.json()
                console.log("📋 Chats obtenidos:", data)

                // El backend devuelve un array con la estructura correcta
                const chats = Array.isArray(data) ? data : []

                // Actualizar cache local
                chats.forEach(chat => {
                    if (chat.userId) {
                        this.activeChats.set(chat.userId, chat)
                    }
                })

                return chats
            } else {
                const errorText = await response.text().catch(() => "")

                // Si es HTML de error, significa que la ruta no está registrada en el servidor
                if (errorText.includes('<!DOCTYPE html>') || errorText.includes('Cannot GET')) {
                    console.error("🚨 RUTA NO REGISTRADA EN EL SERVIDOR:")
                    console.error("🚨 La ruta /api/conversations no está registrada")
                    console.error("🚨 SOLUCIÓN: Verificar que las rutas estén correctamente registradas")
                    console.log("🔄 Usando modo fallback...")

                    // Usar fallback service inmediatamente
                    return await this.getUserChatsFallback(userId)
                }

                if (response.status === 404) {
                    console.log("📭 No se encontraron chats (404) - esto es normal si no hay conversaciones")
                    return []
                } else {
                    console.error("❌ Error obteniendo chats:", response.status, errorText.substring(0, 200))
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
            }

        } catch (error) {
            console.error("❌ Error obteniendo chats:", error)

            // Si es error de red, devolver chats del cache
            if (error.message.includes("Network") || error.message.includes("fetch")) {
                console.log("� Usando achats del cache debido a error de red")
                return Array.from(this.activeChats.values())
            }

            // Intentar fallback
            return await this.getUserChatsFallback(userId)
        }
    }

    // Fallback para obtener chats cuando no hay endpoint específico
    async getUserChatsFallback(userId) {
        try {
            console.log("🔄 Usando fallback para obtener chats")
            const { default: chatFallbackService } = await import("./chatFallbackService")
            return await chatFallbackService.getUserChats(userId)
        } catch (error) {
            console.error("❌ Error en fallback de chats:", error)
            return []
        }
    }

    // Obtener mensajes entre dos usuarios
    async getMessagesBetweenUsers(senderId, receiverId) {
        try {
            console.log("💬 Obteniendo mensajes entre:", senderId, "y", receiverId)

            const token = await AsyncStorage.getItem("token")
            if (!token) {
                throw new Error("Token no encontrado")
            }

            const endpoint = `${BASE_URL}/conversation/${receiverId}`
            console.log("📡 Obteniendo mensajes desde:", endpoint)

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (response.ok) {
                const messages = await response.json()
                const messageArray = Array.isArray(messages) ? messages : []
                console.log("📨 Mensajes obtenidos:", messageArray.length)

                // Guardar en cache
                const chatId = this.getChatId(senderId, receiverId)
                this.setCachedMessages(chatId, messageArray)

                return messageArray
            } else {
                const errorText = await response.text().catch(() => "")

                // Si es HTML de error, significa que la ruta no está registrada
                if (errorText.includes('<!DOCTYPE html>') || errorText.includes('Cannot GET')) {
                    console.error("🚨 RUTA DE MENSAJES NO REGISTRADA EN EL SERVIDOR")
                    console.error("🚨 SOLUCIÓN: Verificar que las rutas estén correctamente registradas")
                    console.log("🔄 Usando mensajes del cache...")

                    // Devolver mensajes del cache si existen
                    const chatId = this.getChatId(senderId, receiverId)
                    return this.getCachedMessages(chatId)
                }

                if (response.status === 404) {
                    console.log("📭 No se encontraron mensajes (404) - esto es normal si no hay conversación")
                    return []
                } else {
                    console.error("❌ Error obteniendo mensajes:", response.status, errorText.substring(0, 200))
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
            }

        } catch (error) {
            console.error("❌ Error obteniendo mensajes:", error)

            // Fallback: devolver mensajes del cache
            const chatId = this.getChatId(senderId, receiverId)
            const cachedMessages = this.getCachedMessages(chatId)
            return cachedMessages
        }
    }

    // Enviar mensaje privado
    async sendPrivateMessage(senderId, receiverId, content, images = []) {
        try {
            console.log("📤 Enviando mensaje privado:", { senderId, receiverId, content })

            const token = await AsyncStorage.getItem("token")
            if (!token) {
                throw new Error("Token no encontrado")
            }

            // Crear mensaje optimista para UI inmediata
            const optimisticMessage = {
                id: `temp_${Date.now()}`,
                content: content,
                senderId: senderId,
                receiverId: receiverId,
                createdAt: new Date().toISOString(),
                sender: {
                    id: senderId,
                    name: "Tú"
                },
                receiver: {
                    id: receiverId,
                    name: "Usuario"
                },
                isOptimistic: true
            }

            // Guardar en cache local inmediatamente
            const chatId = this.getChatId(senderId, receiverId)
            this.addMessageToCache(chatId, optimisticMessage)

            const endpoint = `${BASE_URL}/`
            console.log("📡 Enviando mensaje a:", endpoint)

            const formData = new FormData()
            formData.append('senderId', String(senderId))
            formData.append('receiverId', String(receiverId))
            formData.append('content', content)

            // Agregar imágenes si existen
            if (images && images.length > 0) {
                images.forEach((image, index) => {
                    if (image.uri) {
                        formData.append('images', {
                            uri: image.uri,
                            type: image.type || 'image/jpeg',
                            name: image.name || `image_${index}.jpg`,
                        })
                    }
                })
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            })

            if (response.ok) {
                const messageData = await response.json()
                console.log("✅ Mensaje enviado exitosamente:", messageData)

                // Actualizar cache con respuesta del servidor
                this.updateMessageInCache(chatId, optimisticMessage.id, messageData)

                // Emitir via Socket.IO para tiempo real
                if (this.socketIntegration) {
                    this.socketIntegration.sendPrivateMessage(receiverId, { content }, messageData)
                }

                return messageData
            } else {
                const errorText = await response.text().catch(() => "")
                console.error("❌ Error enviando mensaje:", response.status, errorText.substring(0, 200))

                // Usar fallback service para guardar localmente
                const { default: chatFallbackService } = await import("./chatFallbackService")
                const messageData = await chatFallbackService.createPrivateMessage(senderId, receiverId, content, images)

                // Actualizar cache con mensaje del fallback
                this.updateMessageInCache(chatId, optimisticMessage.id, messageData)

                return messageData
            }

        } catch (error) {
            console.error("❌ Error enviando mensaje:", error)

            // Fallback: crear mensaje local básico
            const fallbackMessage = {
                id: Date.now(),
                content: content,
                senderId: senderId,
                receiverId: receiverId,
                createdAt: new Date().toISOString(),
                sender: {
                    id: senderId,
                    name: "Tú"
                },
                receiver: {
                    id: receiverId,
                    name: "Usuario"
                },
                localOnly: true
            }

            const chatId = this.getChatId(senderId, receiverId)
            this.addMessageToCache(chatId, fallbackMessage)

            return fallbackMessage
        }
    }

    // Obtener información de usuario para chat
    async getChatUserInfo(userId) {
        try {
            console.log("👤 Obteniendo info de usuario:", userId)

            const token = await AsyncStorage.getItem("token")
            if (!token) {
                throw new Error("Token no encontrado")
            }

            const response = await fetch(`${BASE_URL}/users/${userId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                // Fallback: usar endpoint general de usuarios
                console.log("🔄 Usando fallback para info de usuario")
                return this.getChatUserInfoFallback(userId)
            }

            const userData = await response.json()
            console.log("👤 Info de usuario obtenida:", userData)

            return userData

        } catch (error) {
            console.error("❌ Error obteniendo info de usuario:", error)
            return this.getChatUserInfoFallback(userId)
        }
    }

    // Fallback para obtener info de usuario
    async getChatUserInfoFallback(userId) {
        try {
            const token = await AsyncStorage.getItem("token")
            const response = await fetch(`${BASE_URL}/users/${userId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const userData = await response.json()

            // Normalizar datos
            return {
                id: userData.user_id || userData.id,
                user_id: userData.user_id || userData.id,
                name: userData.name || userData.display_name || userData.username || 'Usuario',
                lastname: userData.lastname || '',
                username: userData.username || '',
                display_name: userData.display_name || userData.name || userData.username || 'Usuario',
                profile_picture: userData.profile_picture || ''
            }

        } catch (error) {
            console.error("❌ Error en fallback de info de usuario:", error)
            return {
                id: userId,
                user_id: userId,
                name: `Usuario ${userId}`,
                lastname: '',
                username: '',
                display_name: `Usuario ${userId}`,
                profile_picture: ''
            }
        }
    }

    // Manejar nuevo mensaje recibido
    handleNewMessage(messageData) {
        const { sender, receiver, content } = messageData

        // Determinar el ID del chat (el otro usuario)
        const otherUserId = sender?.id === this.currentUserId ? receiver?.id : sender?.id

        if (!otherUserId) return

        // Actualizar chat en cache
        const existingChat = this.activeChats.get(otherUserId)
        const updatedChat = {
            ...existingChat,
            userId: otherUserId,
            name: sender?.id === this.currentUserId ? receiver?.name : sender?.name,
            lastname: sender?.id === this.currentUserId ? receiver?.lastname : sender?.lastname,
            username: sender?.id === this.currentUserId ? receiver?.username : sender?.username,
            display_name: sender?.id === this.currentUserId ? receiver?.display_name : sender?.display_name,
            profile_picture: sender?.id === this.currentUserId ? receiver?.profile_picture : sender?.profile_picture,
            lastMessage: content,
            lastMessageTime: messageData.createdAt || new Date().toISOString(),
            unreadCount: sender?.id !== this.currentUserId ? (existingChat?.unreadCount || 0) + 1 : 0
        }

        this.activeChats.set(otherUserId, updatedChat)

        // Notificar a listeners de mensajes específicos
        const chatId = this.getChatId(this.currentUserId, otherUserId)
        const messageListener = this.messageListeners.get(chatId)
        if (messageListener) {
            messageListener(messageData)
        }

        // Notificar a listeners de lista de chats
        this.notifyChatListListeners()
    }

    // Manejar actualización de lista de chats
    handleChatListUpdate(data) {
        if (data.chats && Array.isArray(data.chats)) {
            // Actualizar cache con nuevos datos
            data.chats.forEach(chat => {
                if (chat.userId) {
                    this.activeChats.set(chat.userId, chat)
                }
            })
        }

        this.notifyChatListListeners()
    }

    // Manejar estado online de usuarios
    handleUserOnlineStatus(statusData) {
        const { userId, isOnline } = statusData

        // Actualizar estado online en cache
        const chat = this.activeChats.get(userId)
        if (chat) {
            this.activeChats.set(userId, { ...chat, isOnline })
        }

        this.notifyChatListListeners()
    }

    // Generar ID único para chat
    getChatId(userId1, userId2) {
        const ids = [userId1, userId2].sort()
        return `chat_${ids[0]}_${ids[1]}`
    }

    // Suscribirse a mensajes de un chat específico
    subscribeToMessages(userId1, userId2, callback) {
        const chatId = this.getChatId(userId1, userId2)
        this.messageListeners.set(chatId, callback)

        // Unirse al chat via Socket.IO
        if (this.socketIntegration) {
            this.socketIntegration.joinPrivateChat(userId1, userId2)
        }

        console.log("🔔 Suscrito a mensajes del chat:", chatId)
    }

    // Desuscribirse de mensajes de un chat
    unsubscribeFromMessages(userId1, userId2) {
        const chatId = this.getChatId(userId1, userId2)
        this.messageListeners.delete(chatId)

        // Salir del chat via Socket.IO
        if (this.socketIntegration) {
            this.socketIntegration.leavePrivateChat(userId1, userId2)
        }

        console.log("🔕 Desuscrito de mensajes del chat:", chatId)
    }

    // Suscribirse a actualizaciones de lista de chats
    subscribeToChatList(callback) {
        this.chatListListeners.add(callback)
        console.log("🔔 Suscrito a actualizaciones de lista de chats")
    }

    // Desuscribirse de actualizaciones de lista de chats
    unsubscribeFromChatList(callback) {
        this.chatListListeners.delete(callback)
        console.log("🔕 Desuscrito de actualizaciones de lista de chats")
    }

    // Notificar a listeners de lista de chats
    notifyChatListListeners() {
        const chats = Array.from(this.activeChats.values())
        this.chatListListeners.forEach(callback => {
            try {
                callback(chats)
            } catch (error) {
                console.error("❌ Error en callback de lista de chats:", error)
            }
        })
    }

    // Solicitar actualización de lista de chats
    requestChatListUpdate() {
        if (this.socketIntegration) {
            this.socketIntegration.requestChatListUpdate()
        }
    }

    // Marcar chat como leído
    markChatAsRead(otherUserId) {
        const chat = this.activeChats.get(otherUserId)
        if (chat) {
            this.activeChats.set(otherUserId, { ...chat, unreadCount: 0 })
            this.notifyChatListListeners()
        }

        // Notificar al servidor via Socket.IO
        if (this.socketIntegration) {
            this.socketIntegration.markChatAsRead(otherUserId)
        }
    }

    // Manejar chat marcado como leído
    handleChatMarkedRead(data) {
        const { userId, otherUserId } = data

        if (userId === this.currentUserId) {
            // El otro usuario marcó nuestro chat como leído
            const chat = this.activeChats.get(otherUserId)
            if (chat) {
                this.activeChats.set(otherUserId, { ...chat, unreadCount: 0 })
                this.notifyChatListListeners()
            }
        }
    }

    // Manejar usuario escribiendo
    handleUserTyping(data) {
        const { userId, isTyping } = data

        // Notificar a listeners específicos si es necesario
        console.log(`✍️ Usuario ${userId} ${isTyping ? 'está escribiendo' : 'dejó de escribir'}`)
    }

    // Notificar que usuario está escribiendo
    notifyTyping(otherUserId, isTyping) {
        if (this.socketIntegration) {
            this.socketIntegration.notifyTyping(otherUserId, isTyping)
        }
    }

    // Obtener estado de conexión
    getConnectionStatus() {
        return this.socketIntegration ? this.socketIntegration.getStatus() : { isConnected: false }
    }

    // Reconectar manualmente
    async reconnect() {
        if (this.socketIntegration) {
            await this.socketIntegration.reconnect()
        }
    }

    // Métodos de cache de mensajes
    getCachedMessages(chatId) {
        return this.messageCache.get(chatId) || []
    }

    addMessageToCache(chatId, message) {
        const messages = this.getCachedMessages(chatId)
        messages.push(message)
        this.messageCache.set(chatId, messages)
    }

    updateMessageInCache(chatId, tempId, realMessage) {
        const messages = this.getCachedMessages(chatId)
        const index = messages.findIndex(msg => msg.id === tempId)
        if (index !== -1) {
            messages[index] = realMessage
            this.messageCache.set(chatId, messages)
        }
    }

    setCachedMessages(chatId, messages) {
        this.messageCache.set(chatId, messages)
    }

    // Limpiar servicio
    cleanup() {
        this.messageListeners.clear()
        this.chatListListeners.clear()
        this.activeChats.clear()
        this.messageCache.clear()
        this.isInitialized = false
        this.currentUserId = null

        // Desconectar Socket.IO
        if (this.socketIntegration) {
            this.socketIntegration.disconnect()
        }

        console.log("🧹 PrivateChatService limpiado")
    }
}

export default new PrivateChatService()