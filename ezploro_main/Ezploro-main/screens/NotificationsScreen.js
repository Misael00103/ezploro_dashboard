import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useNotifications } from "../context/NotificationsContext"
import { notificationService } from "../services/notificationService"
import messageNotificationService from "../services/messageNotificationService"
import socketService from "../services/socketService"

// Consistent color palette with ChatMainScreen
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#0F0F23';
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
  warning: "#FF9F0A",
  error: "#FF453A",
}

const NOTIFICATION_TYPES = {
  like: { icon: "heart", color: "#FF453A" },
  comment: { icon: "chatbubble", color: "#007AFF" },
  follow: { icon: "person-add", color: "#30D158" },
  event: { icon: "calendar", color: "#FF9F0A" },
  message: { icon: "mail", color: "#007AFF" },
}

export default function NotificationsScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  
  const [refreshing, setRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleRefreshNotifications = useCallback(async () => {
    if (!user?.user_id || !isMountedRef.current) {
      console.log("Cannot fetch notifications: user_id or component not mounted")
      return
    }
    
    try {
      console.log("🔄 Refreshing notifications for user:", user.user_id)
      await fetchNotifications()
      
      // Set debug info
      if (notifications.length === 0) {
        setDebugInfo(`No notifications found. User ID: ${user.user_id}`)
      } else {
        setDebugInfo(`Found ${notifications.length} notifications`)
      }
    } catch (err) {
      console.error("❌ Error refreshing notifications:", err)
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [user?.user_id, fetchNotifications, notifications.length])

  useEffect(() => {
    console.log("NotificationsScreen useEffect triggered, user:", user?.user_id)
    
    if (user?.user_id) {
      // Conectar socket para notificaciones en tiempo real
      socketService.connect(user.user_id).then(() => {
        console.log("✅ Socket connected for notifications")
        
        // Escuchar nuevas notificaciones
        if (socketService.socket) {
          socketService.socket.on('newNotification', (notification) => {
            console.log("📱 New notification received via socket:", notification)
            // Refrescar las notificaciones desde el servidor
            fetchNotifications()
          })
          
          socketService.socket.on('notificationRead', (data) => {
            console.log("👁️ Notification marked as read via socket:", data)
            // Refrescar para actualizar el estado
            fetchNotifications()
          })
        }
      }).catch((error) => {
        console.error("❌ Error connecting socket for notifications:", error)
      })
      
      return () => {
        if (socketService.socket) {
          socketService.socket.off('newNotification')
          socketService.socket.off('notificationRead')
        }
      }
    }
  }, [user?.user_id, fetchNotifications])

  const onRefresh = useCallback(() => {
    if (isMountedRef.current) {
      setRefreshing(true)
      handleRefreshNotifications()
    }
  }, [handleRefreshNotifications])

  // markAsRead and markAllAsRead now come from useNotifications context

  const sendTestNotification = useCallback(async () => {
    try {
      console.log('🧪 Sending test notification...')
      const result = await messageNotificationService.sendTestNotification(
        'test',
        'Notificación de Prueba',
        'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.'
      )
      
      if (result) {
        console.log('✅ Test notification sent successfully')
        // Refrescar notificaciones después de un breve delay
        setTimeout(() => {
          fetchNotifications()
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error)
    }
  }, [fetchNotifications])

  const scheduleTestReminder = useCallback(async () => {
    try {
      console.log('⏰ Scheduling test reminder...')
      const result = await messageNotificationService.scheduleTestReminder(5) // 5 segundos
      
      if (result) {
        console.log('✅ Test reminder scheduled for 5 seconds')
      }
    } catch (error) {
      console.error('❌ Error scheduling test reminder:', error)
    }
  }, [])

  const renderNotification = ({ item }) => {
    const typeConfig = NOTIFICATION_TYPES[item.type] || NOTIFICATION_TYPES.message
    
    // Format time
    const formatTime = (timestamp) => {
      if (!timestamp) return 'Just now'
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={async () => {
          // Mark as read
          await markAsRead(item.id)
          
          // Navigate based on notification type and data
          try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data
            
            if (data?.deepLink) {
              const [screen, id] = data.deepLink.split('/')
              switch (screen) {
                case 'event':
                  navigation.navigate('EventDetails', { eventId: id })
                  break
                case 'profile':
                  navigation.navigate('OtherProfile', { userId: id })
                  break
                case 'chat':
                  navigation.navigate('Chat', { conversationId: id })
                  break
                default:
                  console.log('Unknown deep link:', data.deepLink)
              }
            } else if (data?.eventId) {
              navigation.navigate('EventDetails', { eventId: data.eventId })
            } else if (data?.userId) {
              navigation.navigate('OtherProfile', { userId: data.userId })
            }
          } catch (error) {
            console.error('Error parsing notification data:', error)
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.color }]}>
          <Ionicons name={typeConfig.icon} size={20} color="#fff" />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title || 'Notification'}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message || item.body || 'No message'}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(item.created_at || item.timestamp || item.time)}
          </Text>
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-outline" size={48} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>You're all caught up!</Text>
    </View>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.blackContainer}>
        {/* Purple bubbles decoration */}
        <View style={styles.topBubble} />
        <View style={styles.bottomBubble} />
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerAction} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={handleRefreshNotifications}>
              <Ionicons name="refresh" size={24} color={COLORS.accent} />
            </TouchableOpacity>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.headerAction} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefreshNotifications}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => `notification-${item.id || Math.random()}`}
            renderItem={renderNotification}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.accent}
                colors={[COLORS.accent]}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}

        {/* Floating Action Button for Testing (only in development) */}
        {__DEV__ && (
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fab} onPress={sendTestNotification}>
              <Ionicons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={scheduleTestReminder}>
              <Ionicons name="alarm" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_DARK,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  debugContainer: {
    backgroundColor: COLORS.warning,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  debugText: {
    color: "#000",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadNotification: {
    backgroundColor: COLORS.card,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "column",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    backgroundColor: COLORS.warning,
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: 12,
  },
  topBubble: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    zIndex: 0,
  },
})