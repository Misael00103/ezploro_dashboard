"use client"

import { useEffect, useRef, useCallback } from "react"

/**
 * @typedef {Object} SocketHookOptions
 * @property {string|number} [userId]
 * @property {string|number} [eventId]
 * @property {string|number} [recipientId]
 * @property {function} [onMessage]
 * @property {function} [onPrivateMessage]
 * @property {function} [onEventMessage]
 * @property {function} [onChatUpdate]
 * @property {boolean} [enabled]
 */

export function useSocketConnection(socketService, options) {
  const {
    userId,
    eventId,
    recipientId,
    onMessage,
    onPrivateMessage,
    onEventMessage,
    onChatUpdate,
    enabled = true,
  } = options

  const isConnectedRef = useRef(false)
  const listenersSetupRef = useRef(false)
  const cleanupFunctionsRef = useRef([])

  const connectSocket = useCallback(() => {
    if (!enabled || !userId || isConnectedRef.current) return

    console.log("[useSocket] Connecting socket for user:", userId)
    socketService.connect(userId)
    isConnectedRef.current = true
  }, [socketService, userId, enabled])

  const setupListeners = useCallback(() => {
    if (!socketService.socket || listenersSetupRef.current) return

    console.log("[useSocket] Setting up socket listeners")
    listenersSetupRef.current = true

    // Private message handler
    if (onPrivateMessage) {
      const privateMessageHandler = (message) => {
        console.log("[useSocket] Private message received:", message)
        onPrivateMessage(message)
      }
      socketService.onNewPrivateMessage(privateMessageHandler)
      cleanupFunctionsRef.current.push(() => {
        socketService.socket?.off("privateMessage", privateMessageHandler)
      })
    }

    // Event message handler
    if (onEventMessage) {
      const eventMessageHandler = (message) => {
        console.log("[useSocket] Event message received:", message)
        onEventMessage(message)
      }
      socketService.onNewEventMessage(eventMessageHandler)
      cleanupFunctionsRef.current.push(() => {
        socketService.socket?.off("new-message", eventMessageHandler)
      })
    }

    // General message handler
    if (onMessage) {
      const messageHandler = (message) => {
        console.log("[useSocket] General message received:", message)
        onMessage(message)
      }
      socketService.socket.on("new-message", messageHandler)
      cleanupFunctionsRef.current.push(() => {
        socketService.socket?.off("new-message", messageHandler)
      })
    }

    // Chat update handler
    if (onChatUpdate) {
      const chatUpdateHandler = (data) => {
        console.log("[useSocket] Chat update received:", data)
        onChatUpdate(data)
      }
      socketService.socket.on("chat-update", chatUpdateHandler)
      cleanupFunctionsRef.current.push(() => {
        socketService.socket?.off("chat-update", chatUpdateHandler)
      })
    }
  }, [socketService, onMessage, onPrivateMessage, onEventMessage, onChatUpdate])

  const joinRooms = useCallback(() => {
    if (!socketService.socket || !userId) return

    // Join user's personal chat room
    socketService.socket.emit("join-user-chat", userId)

    // Join private chat if recipient specified
    if (recipientId) {
      console.log("[useSocket] Joining private chat:", userId, recipientId)
      socketService.joinPrivateChat(userId, recipientId)
    }

    // Join event chat if event specified
    if (eventId) {
      console.log("[useSocket] Joining event chat:", eventId)
      socketService.joinEventChat(eventId)
    }
  }, [socketService, userId, recipientId, eventId])

  useEffect(() => {
    if (!enabled || !userId) return

    connectSocket()

    // Small delay to ensure connection is established
    const setupTimer = setTimeout(() => {
      setupListeners()
      joinRooms()
    }, 100)

    return () => {
      clearTimeout(setupTimer)

      // Clean up all listeners
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup())
      cleanupFunctionsRef.current = []

      // Reset refs
      isConnectedRef.current = false
      listenersSetupRef.current = false

      console.log("[useSocket] Cleaned up socket connection")
    }
  }, [enabled, userId, connectSocket, setupListeners, joinRooms])

  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        cleanupFunctionsRef.current.forEach((cleanup) => cleanup())
        socketService.removeAllListeners?.()
        isConnectedRef.current = false
        listenersSetupRef.current = false
      }
    }
  }, [socketService])

  return {
    isConnected: isConnectedRef.current,
    socket: socketService.socket,
  }
}

export function useThrottledCallback(callback, delay) {
  const timeoutRef = useRef(null)
  const lastCallRef = useRef<number>(0)

  const throttledCallback = useCallback(
    (...args) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCallRef.current

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callback(...args)
        }, delay - timeSinceLastCall)
      }
    },
    [callback, delay],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}
