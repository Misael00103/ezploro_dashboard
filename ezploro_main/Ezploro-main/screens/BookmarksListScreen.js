import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useCallback, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import {
    API_URL_BOOKMARKS,
    BASE_URL
} from "../config"
import { SCREEN_WIDTH as windowWidth } from "../constants/layout"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { normalizeImageUrl } from "../utils/image"

export default function BookmarksListScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  
  // Estados principales
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [localLikedEvents, setLocalLikedEvents] = useState(new Set())
  const [localBookmarkedEvents, setLocalBookmarkedEvents] = useState(new Set())
  const [eventViews, setEventViews] = useState({})

  const makeRequest = useCallback(async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const isLikeRequest = url.includes('/likes/toggle')

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (isLikeRequest && response.status === 500) {
          throw new Error("Like failed")
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      return await response.json()
    } catch (error) {
      if (!isLikeRequest) {
        console.error("Request error:", error)
      }
      throw error
    } finally {
      clearTimeout(id)
    }
  }, [])

  // ==================== VIEW COUNTER FUNCTIONS ====================
  
  const recordView = useCallback(async (objectType, objectId) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/views`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          object_type: objectType,
          object_id: objectId,
          viewer_user_id: user?.user_id || null
        }),
      })

      if (response.ok) {
        console.log(`✅ View recorded for ${objectType} ${objectId}`)
      }
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }, [user?.user_id])

  const getViewCount = useCallback(async (objectType, objectId) => {
    try {
      const response = await fetch(`${BASE_URL}/views/${objectType}/${objectId}/count`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.view_count || 0
      }
    } catch (error) {
      console.error('Error getting view count:', error)
    }
    return 0
  }, [])

  const loadEventViews = useCallback(async (events) => {
    const viewCounts = {}
    
    // Cargar vistas para todos los eventos en paralelo
    const viewPromises = events.map(async (event) => {
      const eventId = event.object_id || event.event_id || event.id
      if (eventId) {
        const count = await getViewCount('event', eventId)
        viewCounts[eventId] = count
      }
    })

    await Promise.all(viewPromises)
    setEventViews(viewCounts)
  }, [getViewCount])

  // Función para limpiar bookmarks incorrectos
  const cleanupBadBookmarks = useCallback(async () => {
    if (!user?.user_id) return
    
    try {
      console.log("🧹 Iniciando limpieza de bookmarks incorrectos...")
      const token = await AsyncStorage.getItem("token")
      
      // Obtener todos los bookmarks
      const response = await fetch(`${API_URL_BOOKMARKS}?limit=100&offset=0`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const bookmarks = data.bookmarks || []
      
      console.log("📋 Bookmarks encontrados:", bookmarks.length)
      
      // Identificar bookmarks con object_id incorrectos
      const badBookmarks = bookmarks.filter(bookmark => 
        bookmark.object_id === "123" || 
        bookmark.object_id === "0" ||
        bookmark.object_id === "" ||
        bookmark.object_id === null ||
        bookmark.object_id === undefined
      )
      
      console.log("❌ Bookmarks incorrectos encontrados:", badBookmarks.length)
      
      if (badBookmarks.length === 0) {
        console.log("✅ No hay bookmarks incorrectos para limpiar")
        return
      }
      
      // Eliminar cada bookmark incorrecto
      for (const bookmark of badBookmarks) {
        try {
          console.log(`🗑️ Eliminando bookmark incorrecto: ${bookmark.bookmark_id} (object_id: ${bookmark.object_id})`)
          
          const deleteResponse = await fetch(`${API_URL_BOOKMARKS}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              object_type: "event",
              object_id: bookmark.object_id,
            }),
          })
          
          if (deleteResponse.ok) {
            console.log(`✅ Bookmark ${bookmark.bookmark_id} eliminado exitosamente`)
          } else {
            console.error(`❌ Error eliminando bookmark ${bookmark.bookmark_id}`)
          }
        } catch (error) {
          console.error(`❌ Error eliminando bookmark ${bookmark.bookmark_id}:`, error)
        }
      }
      
      console.log("🧹 Limpieza completada")
      
    } catch (error) {
      console.error("❌ Error durante la limpieza:", error)
    }
  }, [user?.user_id])

  const loadBookmarks = useCallback(async () => {
    if (!user?.user_id) return
    setLoading(true)
    setError("")
    try {
      console.log("🔖 Loading bookmarks for user:", user.user_id)
      
      // First get bookmarks - try different possible response formats
      const data = await makeRequest(`${API_URL_BOOKMARKS}?limit=50&offset=0`)
      console.log("📦 Raw bookmarks response:", data)
      
      // Handle different possible response formats
      let bookmarkData = []
      if (Array.isArray(data)) {
        bookmarkData = data
      } else if (data && Array.isArray(data.bookmarks)) {
        bookmarkData = data.bookmarks
      } else if (data && Array.isArray(data.data)) {
        bookmarkData = data.data
      } else if (data && Array.isArray(data.results)) {
        bookmarkData = data.results
      } else {
        console.warn("⚠️ Unexpected bookmarks response format:", data)
        bookmarkData = []
      }
      
      console.log("📋 Processed bookmark data:", bookmarkData.length, "items")
      
      // Filter event bookmarks
      const eventBookmarks = bookmarkData.filter(item => 
        item.object_type === 'event' || item.type === 'event'
      )
      
      console.log("🎯 Event bookmarks found:", eventBookmarks.length)
      
      if (eventBookmarks.length === 0) {
        setBookmarks([])
        setLocalBookmarkedEvents(new Set())
        console.log("ℹ️ No event bookmarks found")
        return
      }
      
      // Get all events and match with bookmarks
      const allEvents = await makeRequest(`${BASE_URL}/events`)
      const eventsArray = Array.isArray(allEvents) ? allEvents : (allEvents.events || [])
      
      console.log("📅 Total events available:", eventsArray.length)
      
      // Match bookmarks with event details
      const enrichedBookmarks = eventBookmarks.map(bookmark => {
        const eventDetails = eventsArray.find(event => 
          event.event_id == bookmark.object_id || 
          event.id == bookmark.object_id ||
          event.event_id == bookmark.event_id ||
          event.id == bookmark.event_id
        )
        
        if (!eventDetails) {
          console.warn("⚠️ Event not found for bookmark:", bookmark.object_id)
        }
        
        return {
          ...bookmark,
          title: eventDetails?.title || `Event ${bookmark.object_id}`,
          description: eventDetails?.description || eventDetails?.resume || 'No description available',
          cover_image: eventDetails?.cover_image || eventDetails?.banner || eventDetails?.image_url,
          likes: eventDetails?.likes_count || eventDetails?.likes || 0,
          event: eventDetails,
          event_id: eventDetails?.event_id || eventDetails?.id || bookmark.object_id
        }
      }).filter(bookmark => bookmark.event) // Only include bookmarks with valid events
      
      // Update local bookmarked events
      const bookmarkedEventIds = new Set(enrichedBookmarks.map(item => Number(item.object_id)))
      setLocalBookmarkedEvents(bookmarkedEventIds)
      setBookmarks(enrichedBookmarks)
      
      console.log("✅ Bookmarks loaded successfully:", enrichedBookmarks.length)
      console.log("📊 Sample enriched bookmark:", enrichedBookmarks[0])
    } catch (error) {
      console.error("❌ Error loading bookmarks:", error)
      setError(`Failed to load bookmarks: ${error.message}`)
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, makeRequest])

  // Debug function to test bookmarks endpoint directly
  const debugBookmarksEndpoint = useCallback(async () => {
    if (!user?.user_id) return
    try {
      console.log("🔍 Debug: Testing bookmarks endpoint directly...")
      const token = await AsyncStorage.getItem("token")
      
      const response = await fetch(`${API_URL_BOOKMARKS}?limit=50&offset=0`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log("🔍 Debug: Response status:", response.status)
      console.log("🔍 Debug: Response headers:", response.headers)
      
      const data = await response.json()
      console.log("🔍 Debug: Response data:", data)
      
      return data
    } catch (error) {
      console.error("🔍 Debug: Error testing endpoint:", error)
    }
  }, [user?.user_id])

  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        // Primero limpiar bookmarks incorrectos, luego cargar
        cleanupBadBookmarks().then(() => {
          loadBookmarks()
        })
        // Uncomment the line below to debug the endpoint
        // debugBookmarksEndpoint()
      }
    }, [user?.user_id, loadBookmarks, cleanupBadBookmarks]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadBookmarks()
    } catch (error) {
      console.error("Refresh error:", error)
      setError("Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }, [loadBookmarks])

  const handleLikeEvent = useCallback(
    async (eventId) => {
      const numericEventId = parseInt(eventId)
      const numericUserId = parseInt(user?.user_id)
      if (isNaN(numericEventId) || isNaN(numericUserId)) return

      // Check if user is guest
      if (user?.role === 'guest' || user?.is_guest || user?.user_id?.toString().startsWith('guest_')) {
        console.log('👤 Usuario guest intentando dar like, mostrando restricción');
        Alert.alert('Acción restringida', 'Debes iniciar sesión para dar like a eventos');
        return;
      }

      setLocalLikedEvents(prev => {
        const newSet = new Set(prev)
        if (newSet.has(numericEventId)) {
          newSet.delete(numericEventId)
        } else {
          newSet.add(numericEventId)
        }
        return newSet
      })

      try {
        await interactionService.toggleEventLike(numericEventId, numericUserId);
      } catch (error) {
        console.error('Error toggling event like:', error);
        setLocalLikedEvents(prev => {
          const newSet = new Set(prev)
          if (newSet.has(numericEventId)) {
            newSet.delete(numericEventId)
          } else {
            newSet.add(numericEventId)
          }
          return newSet
        })
        Alert.alert("Error", "Failed to toggle like")
      }
    },
    [user?.user_id],
  )

  const handleBookmarkEvent = useCallback(
    async (eventId) => {
      const numericEventId = Number(eventId)
      if (!numericEventId || isNaN(numericEventId)) {
        Alert.alert("Error", "Invalid event ID")
        return
      }
      try {
        const token = await AsyncStorage.getItem("token")
        const isBookmarked = localBookmarkedEvents.has(numericEventId)
        const method = isBookmarked ? "DELETE" : "POST"
        
        // Use POST /bookmarks or DELETE /bookmarks
        const response = await fetch(`${API_URL_BOOKMARKS}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            object_type: "event",
            object_id: numericEventId,
          }),
        })
        
        if (response.ok) {
          setLocalBookmarkedEvents(prev => {
            const newSet = new Set(prev)
            if (newSet.has(numericEventId)) {
              newSet.delete(numericEventId)
            } else {
              newSet.add(numericEventId)
            }
            return newSet
          })
          // Recargar bookmarks después de agregar/eliminar
          await loadBookmarks()
          Alert.alert("Success", isBookmarked ? "Bookmark removed" : "Bookmark added")
        } else {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      } catch (error) {
        console.error("Error toggling bookmark:", error.message)
        Alert.alert("Error", `Failed to toggle bookmark: ${error.message}`)
      }
    },
    [user?.user_id, localBookmarkedEvents, loadBookmarks],
  )

  const EventImageSquare = ({ item, onPress, onAction, isActive, actionType = "like" }) => {
    const eventId = Number(item.object_id || item.event_id || item.id)
    const isLocallyActive = actionType === "bookmark" 
      ? localBookmarkedEvents.has(eventId) || isActive
      : localLikedEvents.has(eventId) || isActive

    const getActionIcon = () => {
      if (actionType === "bookmark") {
        return isLocallyActive ? "bookmark" : "bookmark-outline"
      }
      return isLocallyActive ? "heart" : "heart-outline"
    }

    const getActionColor = () => {
      if (actionType === "bookmark") {
        return isLocallyActive ? "#FFD700" : "#fff"
      }
      return isLocallyActive ? "#FF4757" : "#fff"
    }

    // Función para manejar el press con registro de vista
    const handlePress = () => {
      // Registrar vista antes de navegar
      recordView('event', eventId)
      onPress()
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.eventCard, darkMode && styles.eventCardDark]}
      >
        <Image
          source={{ uri: normalizeImageUrl(item.cover_image || item.image || "/placeholder.svg?height=300&width=300") }}
          style={styles.eventImage}
        />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.eventOverlay}>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title || "Untitled Event"}
            </Text>
            <View style={styles.eventActions}>
              <TouchableOpacity onPress={onAction} style={styles.eventActionButton}>
                <Ionicons name={getActionIcon()} size={20} color={getActionColor()} />
                <Text style={styles.eventActionText}>{actionType === "bookmark" ? "" : (item.likes || 0)}</Text>
              </TouchableOpacity>
              <View style={styles.eventStats}>
                <Ionicons name="eye" size={16} color="#fff" />
                <Text style={styles.eventStatsText}>{eventViews[eventId] || "0"}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const renderBookmarkItem = useCallback(
    ({ item }) => {
      // Map the bookmark item to match the expected EventImageSquare props
      const eventItem = {
        ...item,
        event_id: item.object_id,
        title: item.title || "Untitled Event", // Ensure title is present
        cover_image: item.cover_image || item.image, // Handle image
        likes: item.likes || 0, // Ensure likes is present
      }

      return (
        <EventImageSquare
          item={eventItem}
          onPress={() => navigation.navigate("EventDetails", { event: eventItem })}
          onAction={() => handleBookmarkEvent(item.object_id || item.event_id || item.id)}
          isActive={localBookmarkedEvents.has(Number(item.object_id || item.event_id || item.id))}
          actionType="bookmark"
        />
      )
    },
    [navigation, handleBookmarkEvent, localBookmarkedEvents, recordView],
  )

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={darkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradientContainer}
      >
        <View style={[styles.container, darkMode && styles.containerDark]}>
          <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color="#6200EE" />
            <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>Loading...</Text>
          </View>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={darkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
      style={styles.gradientContainer}
    >
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>My Bookmarks</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          style={styles.scrollContainer}
          data={bookmarks}
          numColumns={2}
          keyExtractor={(item, index) => (item?.bookmark_id || item?.id || `item-${index}`).toString()}
          renderItem={renderBookmarkItem}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200EE" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="bookmark-outline"
                size={48}
                color={darkMode ? "#555" : "#ccc"}
              />
              <Text style={[styles.emptyText, darkMode && styles.emptyTextDark]}>
                No bookmarks yet
              </Text>
              <Text style={[styles.emptySubtext, darkMode && styles.emptySubtextDark]}>
                Save events you're interested in by tapping the bookmark icon
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  )
}

// Styles remain the same as provided
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerDark: {
    backgroundColor: "#181A20",
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerDark: {
    borderBottomColor: "#333644",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  headerTitleDark: {
    color: "#fff",
  },
  placeholder: {
    width: 32,
  },
  cleanupButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  eventCard: {
    width: (windowWidth - 40) / 2,
    aspectRatio: 0.8,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventCardDark: {
    backgroundColor: "#333644",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 12,
  },
  eventContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  eventActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  eventStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventStatsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyTextDark: {
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  emptySubtextDark: {
    color: "#888",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    marginTop: 8,
    fontSize: 14,
  },
  loadingTextDark: {
    color: "#fff",
  },
})