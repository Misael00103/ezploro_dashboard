// services/chatIntegrationService.js - Servicio integrado para conectar todos los chats

class ChatIntegrationService {
    constructor() {
        this.isInitialized = false
        this.currentUserId = null
        this.privateChatService = null
        this.socketIntegration = null
        this.listeners = new Map()
    }

    // Inicializar todos los servicios de chat
    async initialize(userId) {
        if (this.isInitialized && this.currentUserId === userId) {
            return
        }

        this.currentUserId = userId
        console.log("🚀 Inicializando ChatIntegrationService para usuario:", userId)

        try {
            // Inicializar servicio de chat privado
            const { default: privateChatService } = await import("./privateChatService")
            this.privateChatService = privateChatService
            await this.privateChatService.initialize(userId)

            // Inicializar integración de Socket.IO
            try {
                const { default: socketChatIntegration } = await import("./socketChatIntegration")
                this.socketIntegration = socketChatIntegration
                await this.socketIntegration.initialize(userId)
                console.log("✅ Socket.IO inicializado correctamente")
            } catch (socketError) {
                console.warn("⚠️ Socket.IO no disponible:", socketError.message)
                console.log("🔄 Continuando en modo offline")
            }

            this.isInitialized = true
            console.log("✅ ChatIntegrationService inicializado correctamente")

        } catch (error) {
            console.error("❌ Error inicializando ChatIntegrationService:", error)
            throw error
        }
    }

    // Obtener chats del usuario
    async getUserChats(userId) {
        if (!this.privateChatService) {
            await this.initialize(userId)
        }

        return await this.privateChatService.getUserChats(userId)
    }

    // Obtener mensajes entre usuarios
    async getMessagesBetweenUsers(senderId, receiverId) {
        if (!this.privateChatService) {
            await this.initialize(senderId)
        }

        return await this.privateChatService.getMessagesBetweenUsers(senderId, receiverId)
    }

    // Enviar mensaje privado
    async sendPrivateMessage(senderId, receiverId, content, images = []) {
        if (!this.privateChatService) {
            await this.initialize(senderId)
        }

        return await this.privateChatService.sendPrivateMessage(senderId, receiverId, content, images)
    }

    // Obtener información de usuario para chat
    async getChatUserInfo(userId) {
        if (!this.privateChatService) {
            await this.initialize(this.currentUserId || userId)
        }

        return await this.privateChatService.getChatUserInfo(userId)
    }

    // Suscribirse a mensajes de un chat específico
    subscribeToMessages(userId1, userId2, callback) {
        if (this.privateChatService) {
            this.privateChatService.subscribeToMessages(userId1, userId2, callback)
        }
    }

    // Desuscribirse de mensajes de un chat
    unsubscribeFromMessages(userId1, userId2) {
        if (this.privateChatService) {
            this.privateChatService.unsubscribeFromMessages(userId1, userId2)
        }
    }

    // Suscribirse a actualizaciones de lista de chats
    subscribeToChatList(callback) {
        if (this.privateChatService) {
            this.privateChatService.subscribeToChatList(callback)
        }
    }

    // Desuscribirse de actualizaciones de lista de chats
    unsubscribeFromChatList(callback) {
        if (this.privateChatService) {
            this.privateChatService.unsubscribeFromChatList(callback)
        }
    }

    // Marcar chat como leído
    markChatAsRead(otherUserId) {
        if (this.privateChatService) {
            this.privateChatService.markChatAsRead(otherUserId)
        }
    }

    // Notificar que usuario está escribiendo
    notifyTyping(otherUserId, isTyping) {
        if (this.privateChatService) {
            this.privateChatService.notifyTyping(otherUserId, isTyping)
        }
    }

    // Obtener estado de conexión
    getConnectionStatus() {
        if (this.privateChatService) {
            return this.privateChatService.getConnectionStatus()
        }
        return { isConnected: false }
    }

    // Reconectar manualmente
    async reconnect() {
        if (this.privateChatService) {
            await this.privateChatService.reconnect()
        }
    }

    // Limpiar servicio
    cleanup() {
        if (this.privateChatService) {
            this.privateChatService.cleanup()
        }
        
        this.isInitialized = false
        this.currentUserId = null
        this.privateChatService = null
        this.socketIntegration = null
        this.listeners.clear()
        
        console.log("🧹 ChatIntegrationService limpiado")
    }
}

export default new ChatIntegrationService()