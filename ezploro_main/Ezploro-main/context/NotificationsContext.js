
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { notificationService } from "../services/notificationService"
import { useAuth } from "./AuthContext"

const NotificationsContext = createContext()

// Removed fetchWithRetry - using notificationService instead

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, token } = useAuth()

  // Initialize notification service when user logs in
  useEffect(() => {
    const initializeNotifications = async () => {
      if (user && token) {
        console.log("🚀 Initializing notifications for user:", user.user_id)
        
        try {
          // Initialize notification service
          await notificationService.initialize()
          
          // Register device
          await notificationService.registerDevice(user.user_id)
          
          // Load notifications and preferences
          await Promise.all([
            fetchNotifications(),
            getPreferences(),
            getStats()
          ])
          
        } catch (error) {
          console.error("❌ Error initializing notifications:", error)
          setError("Failed to initialize notifications")
        }
      }
    }

    initializeNotifications()
  }, [user, token])

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!token) return []
    
    setLoading(true)
    setError(null)
    
    try {
      console.log("🔔 Fetching notifications...")
      const notificationsData = await notificationService.getNotifications()
      setNotifications(notificationsData)
      
      // Update unread count
      const unread = notificationsData.filter(n => !n.read).length
      setUnreadCount(unread)
      
      console.log("✅ Notifications loaded:", notificationsData.length, "unread:", unread)
      return notificationsData
    } catch (error) {
      console.error("❌ Error fetching notifications:", error)
      setError("Failed to load notifications")
      return []
    } finally {
      setLoading(false)
    }
  }, [token])

  // Register device for push notifications
  const registerDevice = useCallback(async () => {
    if (!user?.user_id) return null
    
    try {
      console.log("📱 Registering device...")
      const result = await notificationService.registerDevice(user.user_id)
      console.log("✅ Device registered successfully")
      return result
    } catch (error) {
      console.error("❌ Error registering device:", error)
      setError("Failed to register device")
      return null
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.log("👁️ Marking notification as read:", notificationId)
      const success = await notificationService.markAsRead(notificationId)
      
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        console.log("✅ Notification marked as read")
      }
      
      return success
    } catch (error) {
      console.error("❌ Error marking notification as read:", error)
      setError("Failed to mark notification as read")
      return false
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      console.log("👁️ Marking all notifications as read...")
      const success = await notificationService.markAllAsRead()
      
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        console.log("✅ All notifications marked as read")
      }
      
      return success
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error)
      setError("Failed to mark all notifications as read")
      return false
    }
  }, [])

  // Get notification preferences
  const getPreferences = useCallback(async () => {
    try {
      console.log("⚙️ Getting notification preferences...")
      const prefs = await notificationService.getPreferences()
      setPreferences(prefs)
      console.log("✅ Preferences loaded")
      return prefs
    } catch (error) {
      console.error("❌ Error getting preferences:", error)
      setError("Failed to load preferences")
      return null
    }
  }, [])

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      console.log("⚙️ Updating notification preferences...")
      const success = await notificationService.updatePreferences(newPreferences)
      
      if (success) {
        setPreferences(newPreferences)
        console.log("✅ Preferences updated")
      }
      
      return success
    } catch (error) {
      console.error("❌ Error updating preferences:", error)
      setError("Failed to update preferences")
      return false
    }
  }, [])

  // Get notification statistics
  const getStats = useCallback(async () => {
    try {
      const stats = await notificationService.getStats()
      setUnreadCount(stats.unread || 0)
      return stats
    } catch (error) {
      console.error("❌ Error getting notification stats:", error)
      return { total: 0, unread: 0 }
    }
  }, [])

  // Send local notification
  const sendLocalNotification = useCallback(async (title, body, data = {}) => {
    try {
      return await notificationService.sendLocalNotification(title, body, data)
    } catch (error) {
      console.error("❌ Error sending local notification:", error)
      return null
    }
  }, [])

  // Schedule notification
  const scheduleNotification = useCallback(async (title, body, triggerDate, data = {}) => {
    try {
      return await notificationService.scheduleNotification(title, body, triggerDate, data)
    } catch (error) {
      console.error("❌ Error scheduling notification:", error)
      return null
    }
  }, [])

  const value = {
    notifications,
    loading,
    error,
    preferences,
    unreadCount,
    fetchNotifications,
    registerDevice,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    getPreferences,
    getStats,
    sendLocalNotification,
    scheduleNotification,
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider")
  return context
}
