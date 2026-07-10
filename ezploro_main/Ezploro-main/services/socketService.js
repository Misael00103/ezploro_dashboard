import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

// Servicio de Socket.IO con compatibilidad hacia la API existente de la app
class SocketService {
  constructor() {
    this.socketInstance = null;
    this.isConnected = false;
    this.listeners = new Map(); // 'newEventMessage', 'newPrivateMessage', etc.
    this.currentUserId = null;
    this._triedAltPath = false;
    this.wsEventSockets = new Map(); // eventId -> WebSocket
  }

  async connect(userId) {
    try {
      if (this.socketInstance && this.isConnected) {
        return this;
      }

      this.currentUserId = userId;
      const token = await AsyncStorage.getItem("token");

      // Asegurarse de que la URL sea válida (sin dobles slashes)
      const serverUrl = SOCKET_URL?.replace(/\/$/, "");
      console.log(`🔌 SOCKET_URL from config: ${SOCKET_URL}`);
      console.log(`🔌 Attempting socket connection to: ${serverUrl}`);

      // Verificar que la URL sea válida
      if (!serverUrl || serverUrl === "undefined" || serverUrl === "null") {
        console.warn("⚠️ Invalid server URL for socket connection:", serverUrl);
        return this;
      }

      // Configuración específica para Android con mejor compatibilidad
      const baseOptions = {
        transports: ["polling"], // Solo polling para máxima compatibilidad
        reconnection: true,
        reconnectionAttempts: 2, // Reducir para evitar spam
        reconnectionDelay: 10000, // Delay más largo para Android
        reconnectionDelayMax: 30000,
        timeout: 30000, // Timeout muy largo para conexiones lentas
        forceNew: true,
        autoConnect: true,
        upgrade: false, // Nunca hacer upgrade a WebSocket
        rememberUpgrade: false,
        auth: {
          token: token || "",
          userId: String(userId || ""),
        },
        withCredentials: false,
        path: "/socket.io",
        query: {
          token: token || "",
          userId: String(userId || ""),
          platform: Platform.OS || "unknown",
        },
        extraHeaders: {
          "User-Agent": `EventosApp-${Platform.OS}`,
        },
      };

      console.log("🔌 Attempting socket connection to:", serverUrl);
      this.socketInstance = io(serverUrl, baseOptions);

      this._wireBaseEvents();
      return this;
    } catch (error) {
      console.warn("❌ Error initializing socket:", error?.message || error);
      return this;
    }
  }

  disconnect() {
    try {
      if (this.socketInstance) {
        this.socketInstance.removeAllListeners();
        this.socketInstance.disconnect();
        this.socketInstance = null;
      }
    } finally {
      this.isConnected = false;
      this.currentUserId = null;
      this.listeners.clear();
    }
  }

  _wireBaseEvents() {
    if (!this.socketInstance) return;

    this.socketInstance.on("connect", () => {
      this.isConnected = true;
      console.log("🔌 Socket connected:", this.socketInstance.id);
      if (this.currentUserId) {
        // Unir al canal personal para notificaciones/mensajes privados
        this.socketInstance.emit("joinUser", { userId: String(this.currentUserId) });
      }
    });

    this.socketInstance.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("🔌 Socket disconnected:", reason);
    });

    this.socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect_error:", err?.message || err);
      this.isConnected = false;
      
      // Si es un error de CORS o de red, esperar antes de reintentar
      if (err?.message?.includes("xhr poll error") || err?.message?.includes("CORS") || err?.message?.includes("Network")) {
        console.warn("🚫 CORS or network error detected, will retry later");
        
        // Desactivar reconexión automática temporalmente para evitar spam
        if (this.socketInstance) {
          this.socketInstance.io.reconnection(false);
          
          // Reactivar reconexión después de un delay
          setTimeout(() => {
            if (this.socketInstance) {
              this.socketInstance.io.reconnection(true);
            }
          }, 30000); // 30 segundos
        }
        return;
      }
      
      // Para otros errores, intentar path alternativo una sola vez
      if (!this._triedAltPath && this.socketInstance) {
        this._triedAltPath = true;
        const url = this.socketInstance.io.uri;
        const token = this.socketInstance.auth?.token || "";
        const userId = this.currentUserId ? String(this.currentUserId) : "";
        
        console.log("🔄 Trying alternative socket path...");
        
        setTimeout(() => {
          try {
            this.socketInstance?.removeAllListeners();
            this.socketInstance?.disconnect();
            this.socketInstance = io(url, {
              transports: ["polling"],
              reconnection: true,
              reconnectionAttempts: 2,
              reconnectionDelay: 5000,
              timeout: 25000,
              forceNew: true,
              autoConnect: true,
              upgrade: false,
              auth: { token, userId },
              withCredentials: false,
              path: "/api/socket.io",
              query: { token, userId },
            });
            this._wireBaseEvents();
          } catch (retryError) {
            console.warn("❌ Alternative path connection failed:", retryError?.message || retryError);
          }
        }, 2000);
      }
    });

    this.socketInstance.on("reconnect", (attempt) => {
      console.log("✅ Socket reconnected on attempt", attempt);
      this.isConnected = true;
    });

    this.socketInstance.on("reconnect_failed", () => {
      console.warn("❌ Socket reconnection failed after all attempts");
      this.isConnected = false;
    });

    this.socketInstance.on("reconnect_error", (error) => {
      console.warn("⚠️ Socket reconnection error:", error?.message || error);
    });

    // Puentes mejorados para la API existente del app
    this.socketInstance.on("eventMessage", (payload) => {
      console.log("📨 Event message received:", payload);
      const cb = this.listeners.get("newEventMessage");
      if (typeof cb === "function") cb(payload);
    });

    this.socketInstance.on("privateMessage", (payload) => {
      console.log("📨 Private message received:", payload);
      const cb = this.listeners.get("newPrivateMessage");
      if (typeof cb === "function") cb(payload);
    });

    // Nuevos eventos para listas de chats
    this.socketInstance.on("chatListUpdate", (payload) => {
      console.log("📋 Chat list update received:", payload);
      const cb = this.listeners.get("chatListUpdate");
      if (typeof cb === "function") cb(payload);
    });

    this.socketInstance.on("eventChatListUpdate", (payload) => {
      console.log("📋 Event chat list update received:", payload);
      const cb = this.listeners.get("eventChatListUpdate");
      if (typeof cb === "function") cb(payload);
    });

    // Eventos de estado de usuario
    this.socketInstance.on("userOnlineStatus", (payload) => {
      console.log("🟢 User online status update:", payload);
      const cb = this.listeners.get("userOnlineStatus");
      if (typeof cb === "function") cb(payload);
    });

      // Mantener compatibilidad para notificaciones usando socketService.socket?.on('newNotification')
  // No hacemos puente aquí para permitir suscripción directa desde las pantallas.
}

  // Método para verificar si el socket está disponible
  isSocketAvailable() {
    return this.socketInstance && this.isConnected;
  }

  // Método para obtener el estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socketInstance?.id || null,
      serverUrl: this.socketInstance?.io?.uri || null,
    };
  }

  // Método para limpiar y reconectar manualmente
  async reconnect() {
    try {
      console.log("🔄 Manual reconnection attempt...");
      this.disconnect();
      this._triedAltPath = false; // Reset alternative path flag
      if (this.currentUserId) {
        await this.connect(this.currentUserId);
      }
    } catch (error) {
      console.warn("❌ Manual reconnection failed:", error?.message || error);
    }
  }

  // ---- Chats de eventos ----
  joinEventChat(eventId) {
    // Intentar conexión WebSocket nativa al backend (ws) para chats de eventos
    try {
      const stringEventId = String(eventId);
      // Cerrar si ya existe
      const existing = this.wsEventSockets.get(stringEventId);
      if (existing) {
        try { existing.close(); } catch (_) {}
        this.wsEventSockets.delete(stringEventId);
      }

      const createWsUrl = (baseHttpUrl, path) => {
        const tokenQuery = encodeURIComponent(this._lastToken || "");
        const evQuery = encodeURIComponent(stringEventId);
        let wsBase = baseHttpUrl.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
        wsBase = wsBase.replace(/\/$/, "");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${wsBase}${cleanPath}?token=${tokenQuery}&eventId=${evQuery}`;
      };

      // Guardar token para construir URL
      AsyncStorage.getItem("token").then((token) => {
        this._lastToken = token || "";
        const primaryUrl = createWsUrl(BASE_URL_IMAGE, "/api/messages/ws");
        const ws = new WebSocket(primaryUrl);

        ws.onopen = () => {
          // Conectado al WS del evento
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const cb = this.listeners.get("newEventMessage");
            if (typeof cb === "function") {
              const payload = { ...data };
              if (!payload.eventId) payload.eventId = stringEventId;
              cb(payload);
            }
          } catch (_) {
            // Ignorar mensajes no JSON
          }
        };

        ws.onerror = (_e) => {
          // Silencioso; fallback si fuera necesario podría intentarse aquí
        };

        ws.onclose = () => {
          this.wsEventSockets.delete(stringEventId);
        };

        this.wsEventSockets.set(stringEventId, ws);
      });
    } catch (e) {
      // fallback no-op
    }
  }

  leaveEventChat(eventId) {
    const stringEventId = String(eventId);
    const ws = this.wsEventSockets.get(stringEventId);
    if (ws) {
      try { ws.close(); } catch (_) {}
      this.wsEventSockets.delete(stringEventId);
    }
  }

  sendEventMessage(eventId, message) {
    // Si hay socket.io disponible, emitir
    if (this.socketInstance) {
      try {
        this.socketInstance.emit("sendEventMessage", { eventId: String(eventId), message });
        return;
      } catch (_) {}
    }
    // Intentar enviar por WebSocket nativo (si el backend lo soporta)
    const ws = this.wsEventSockets.get(String(eventId));
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type: "message", ...message }));
      } catch (_) {}
    }
  }

  onNewEventMessage(callback) {
    this.listeners.set("newEventMessage", callback);
  }

  // ---- Mensajes privados ----
  joinPrivateChat(userId, otherUserId) {
    if (!this.socketInstance) return;
    console.log("🏠 Uniéndose a chat privado:", userId, "con", otherUserId);
    this.socketInstance.emit("join-private-chat", { 
      userId1: String(userId), 
      userId2: String(otherUserId) 
    });
  }

  leavePrivateChat(userId, otherUserId) {
    if (!this.socketInstance) return;
    console.log("🚪 Saliendo de chat privado:", userId, "con", otherUserId);
    this.socketInstance.emit("leave-private-chat", { 
      userId1: String(userId), 
      userId2: String(otherUserId) 
    });
  }

  sendPrivateMessage(receiverId, message) {
    if (!this.socketInstance) return;
    console.log("📤 Enviando mensaje privado a:", receiverId);
    this.socketInstance.emit("private-message-sent", { 
      receiverId: String(receiverId), 
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Marcar chat como leído
  markChatAsRead(userId, otherUserId) {
    if (!this.socketInstance) return;
    console.log("✅ Marcando chat como leído:", userId, "con", otherUserId);
    this.socketInstance.emit("mark-chat-read", {
      userId: String(userId),
      otherUserId: String(otherUserId)
    });
  }

  // Unirse a sala personal del usuario
  joinUserRoom(userId) {
    if (!this.socketInstance) return;
    console.log("🏠 Uniéndose a sala personal:", userId);
    this.socketInstance.emit("join-user-room", { userId: String(userId) });
  }

  onNewPrivateMessage(callback) {
    this.listeners.set("newPrivateMessage", callback);
  }

  // ---- Listas de chats ----
  onChatListUpdate(callback) {
    this.listeners.set("chatListUpdate", callback);
  }

  onEventChatListUpdate(callback) {
    this.listeners.set("eventChatListUpdate", callback);
  }

  onUserOnlineStatus(callback) {
    this.listeners.set("userOnlineStatus", callback);
  }

  // Solicitar actualización de lista de chats
  requestChatListUpdate() {
    if (this.socketInstance) {
      this.socketInstance.emit("requestChatListUpdate");
    }
  }

  // Solicitar actualización de lista de chats de eventos
  requestEventChatListUpdate() {
    if (this.socketInstance) {
      this.socketInstance.emit("requestEventChatListUpdate");
    }
  }

  // ---- Utilidades ----
  removeAllListeners() {
    // Eliminar listeners de alto nivel que registramos
    this.listeners.clear();
    if (this.socketInstance) {
      // No quitamos los listeners base (connect/disconnect), pero puedes desuscribirte si lo requieres
      this.socketInstance.off("eventMessage");
      this.socketInstance.off("privateMessage");
      this.socketInstance.off("chatListUpdate");
      this.socketInstance.off("eventChatListUpdate");
      this.socketInstance.off("userOnlineStatus");
    }
  }

  // Exponer el socket real para suscripciones directas (e.g., 'newNotification')
  get socket() {
    return this.socketInstance;
  }
}

export default new SocketService();