import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { useCallback, useEffect, useState } from "react"
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native"
import RealtimeToast from "../components/RealtimeToast"
import {
    BASE_URL,
    BASE_URL_IMAGE
} from "../config"
import { useAuth } from "../context/AuthContext"
import { useEvents } from "../context/EventContext"
import { useTheme } from "../context/ThemeContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import { useGuestRestrictions } from "../hooks/useGuestRestrictions"
import useImageUpload from "../hooks/useImageUpload"
import {
    eventService,
    gamificationService,
    interactionService,
    socialService
} from "../services"
import imageService from "../services/imageService"
import { normalizeImageUrl } from "../utils/image"

// Import components
import {
    CreatePostModal,
    EditProfileModal,
    ProfileHeaderSelf,
    StatusModal,
} from '../components/profile/self'
import {
    CommentsModal,
    EmptyState,
    EventImageSquare,
    PostCard,
    ProfileTabs,
    UserAvatar,
    UserBanner
} from '../components/profile/shared'

// Consistent color palette
const ACCENT_COLOR = '#8B5CF6'

const TABS = [
  { key: "myEvents", icon: "grid-outline", label: "My Events" },
  { key: "posts", icon: "image-outline", label: "Posts" },
  { key: "pastEvents", icon: "time-outline", label: "Past Events" },
  { key: "subscribedEvents", icon: "calendar-outline", label: "Subscribed" },
]

export default function ProfileScreen({ navigation, route }) {
  const { darkMode } = useTheme()
  const { user, fetchUserProfile, updateUser, isGuest } = useAuth()
  const { likedEvents } = useEvents()
  const { toasts, showNotification, showSuccess, hideToast } = useToast()
  const { checkGuestRestriction } = useGuestRestrictions()
  const { pickImageFromGallery } = useImageUpload()
  
  // Estados principales
  const [activeTab, setActiveTab] = useState("myEvents")
  const [editModal, setEditModal] = useState(false)
  const [imageModal, setImageModal] = useState(false)
  const [commentModal, setCommentModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [testModal, setTestModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editBio, setEditBio] = useState("")
  const [newImageTitle, setNewImageTitle] = useState("")
  const [newImageDescription, setNewImageDescription] = useState("")
  const [newImageUri, setNewImageUri] = useState(null)
  const [newComment, setNewComment] = useState("")
  const [selectedPost, setSelectedPost] = useState(null)
  const [statusText, setStatusText] = useState("")
  const [myEvents, setMyEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [subscribedEventsData, setSubscribedEventsData] = useState([])
  const [postComments, setPostComments] = useState([])
  const [points, setPoints] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [friendRequests, setFriendRequests] = useState([])
  const [showSubscribedEvents, setShowSubscribedEvents] = useState(true)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [localLikedEvents, setLocalLikedEvents] = useState(new Set())
  const [localBookmarkedEvents, setLocalBookmarkedEvents] = useState(new Set())
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [initialLoad, setInitialLoad] = useState(false)
  const [eventViews, setEventViews] = useState({})
  const [postViews, setPostViews] = useState({})

  // Hook para actualizaciones en tiempo real
  const { isConnected: socketConnected } = useRealTimeUpdates({
    onNewEvent: (eventData) => {
      if (eventData.creator_id === user?.user_id) {
        setMyEvents(prev => [eventData, ...prev])
        showSuccess(`🆕 Tu evento "${eventData.title}" ha sido publicado`)
      }
    },
    onEventUpdated: (eventData) => {
      setMyEvents(prev => prev.map(event => 
        event.event_id === eventData.event_id ? { ...event, ...eventData } : event
      ))
      setPastEvents(prev => prev.map(event => 
        event.event_id === eventData.event_id ? { ...event, ...eventData } : event
      ))
      setSubscribedEventsData(prev => prev.map(event => 
        event.event_id === eventData.event_id ? { ...event, ...eventData } : event
      ))
    },
    onEventDeleted: (eventId) => {
      setMyEvents(prev => prev.filter(event => event.event_id !== eventId))
      setPastEvents(prev => prev.filter(event => event.event_id !== eventId))
      setSubscribedEventsData(prev => prev.filter(event => event.event_id !== eventId))
    },
    onLikeUpdated: (data) => {
      if (data.userId === user?.user_id) {
        setLocalLikedEvents(prev => {
          const newSet = new Set(prev)
          if (data.action === 'added') {
            newSet.add(parseInt(data.eventId))
          } else if (data.action === 'removed') {
            newSet.delete(parseInt(data.eventId))
          }
          return newSet
        })
      }
    },
    onNewNotification: (notification) => {
      showNotification(notification.message || "Nueva notificación recibida")
    },
    autoJoinUserRoom: true
  })

  const makeRequest = useCallback(async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const isLikeRequest = url.includes('/likes/toggle')

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      
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
      if (!isLikeRequest) console.error("Request error:", error)
      throw error
    } finally {
      clearTimeout(id)
    }
  }, [])

  // VIEW COUNTER FUNCTIONS
  const recordView = useCallback(async (objectType, objectId) => {
    try {
      const token = await AsyncStorage.getItem("token")
      await fetch(`${BASE_URL}/api/views`, {
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
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }, [user?.user_id])

  const getViewCount = useCallback(async (objectType, objectId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/views/${objectType}/${objectId}/count`, {
        headers: { 'Content-Type': 'application/json' },
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
    const viewPromises = events.map(async (event) => {
      const eventId = event.event_id || event.id
      if (eventId) {
        const count = await getViewCount('event', eventId)
        viewCounts[eventId] = count
      }
    })
    await Promise.all(viewPromises)
    setEventViews(viewCounts)
  }, [getViewCount])

  const loadPostViews = useCallback(async (posts) => {
    const viewCounts = {}
    const viewPromises = posts.map(async (post) => {
      const postId = post.post_id || post.id
      if (postId) {
        const count = await getViewCount('post', postId)
        viewCounts[postId] = count
      }
    })
    await Promise.all(viewPromises)
    setPostViews(viewCounts)
  }, [getViewCount])

  useEffect(() => {
    if (user?.user_id) {
      setEditName(user.display_name || user.name || "")
      setEditUsername(user.username || "")
      setEditBio(user.bio || "")
      setShowSubscribedEvents(user.show_subscribed_events !== false)
    }
  }, [user?.online_status, user?.display_name, user?.username, user?.bio, user?.show_subscribed_events])

  // Debug: monitorear cambios en el estado de los modales
  useEffect(() => {
    console.log('🔍 Estado del modal imageModal cambió:', imageModal)
  }, [imageModal])

  useEffect(() => {
    console.log('🔍 Estado del modal editModal cambió:', editModal)
  }, [editModal])

  const loadAllData = useCallback(async () => {
    if (!user?.user_id) return
    setLoading(true)
    try {
      await Promise.all([
        loadMyEvents(),
        loadPosts(),
        loadPastEvents(),
        loadSubscribedEventsData(),
        fetchUserPoints(),
        fetchFollowersCount(),
        fetchFollowingCount(),
        fetchFriendRequests(),
        loadLikedPosts(),
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }, [user?.user_id])

  useFocusEffect(
    useCallback(() => {
      if (user?.user_id && !initialLoad) {
        setFollowersCount(user.followers || 0)
        setFollowingCount(user.following || 0)
        loadAllData()
        setInitialLoad(true)
      }
    }, [user?.user_id, initialLoad]),
  )

  const loadMyEvents = useCallback(async () => {
    if (!user?.user_id) return
    try {
      console.log("👤 ProfileScreen: Cargando eventos creados por el usuario:", user.user_id)
      
      // Usar el endpoint correcto para eventos creados por el usuario
      const response = await eventService.getUserEvents(user.user_id, 'created')
      console.log("👤 ProfileScreen: Respuesta de getUserEvents (created):", {
        response,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasEvents: !!response?.events,
        keys: response ? Object.keys(response) : 'no response'
      })
      
      let eventsData = []
      if (Array.isArray(response)) {
        eventsData = response
      } else if (response?.data && Array.isArray(response.data)) {
        eventsData = response.data
      } else if (response?.events && Array.isArray(response.events)) {
        eventsData = response.events
      }
      
      // Filtrar solo eventos creados por este usuario
      const myCreatedEvents = eventsData.filter(event => 
        Number(event.organizer_id) === Number(user.user_id) || 
        Number(event.user_id) === Number(user.user_id) ||
        Number(event.created_by) === Number(user.user_id)
      )
      
      console.log("👤 ProfileScreen: Eventos creados por mí:", {
        total: eventsData.length,
        myEvents: myCreatedEvents.length,
        events: myCreatedEvents.map(e => ({ 
          id: e.event_id || e.id, 
          title: e.title,
          organizer_id: e.organizer_id 
        }))
      })
      
      setMyEvents(myCreatedEvents)
      if (myCreatedEvents.length > 0) await loadEventViews(myCreatedEvents)
    } catch (error) {
      console.error("❌ Error loading my events:", error)
      setMyEvents([])
    }
  }, [user?.user_id, loadEventViews])

  const loadPosts = useCallback(async () => {
    if (!user?.user_id) return
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/posts/user/${user.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        const postsData = Array.isArray(data.data) ? data.data : []
        setPosts(postsData)
        if (postsData.length > 0) await loadPostViews(postsData)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      setPosts([])
    }
  }, [user?.user_id, loadPostViews])

  const loadSubscribedEventsData = useCallback(async () => {
    if (!user?.user_id) return
    try {
      console.log("👤 ProfileScreen: Cargando eventos suscritos del usuario:", user.user_id)
      
      // Usar eventService para obtener eventos suscritos
      const response = await eventService.getUserEvents(user.user_id, 'subscribed')
      console.log("👤 ProfileScreen: Respuesta completa de eventos suscritos:", {
        response,
        type: typeof response,
        isArray: Array.isArray(response),
        keys: response ? Object.keys(response) : 'no response',
        hasData: !!response?.data,
        hasEvents: !!response?.events,
        hasSubscriptions: !!response?.subscriptions
      })
      
      let eventsData = []
      if (Array.isArray(response)) {
        eventsData = response
      } else if (response?.data && Array.isArray(response.data)) {
        eventsData = response.data
      } else if (response?.events && Array.isArray(response.events)) {
        eventsData = response.events
      } else if (response?.subscriptions && Array.isArray(response.subscriptions)) {
        // Extraer eventos de las suscripciones
        eventsData = response.subscriptions.map(sub => sub.event || sub).filter(Boolean)
      } else if (response?.results && Array.isArray(response.results)) {
        eventsData = response.results
      }
      
      console.log("👤 ProfileScreen: Eventos extraídos:", {
        eventsData,
        count: eventsData.length,
        firstEvent: eventsData[0] ? {
          id: eventsData[0].event_id || eventsData[0].id,
          title: eventsData[0].title,
          date: eventsData[0].date_time || eventsData[0].date
        } : 'no events'
      })
      
      // Filtrar solo eventos futuros para subscribed events
      const now = new Date()
      const futureEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date_time || event.date)
        return eventDate >= now
      })
      
      console.log("👤 ProfileScreen: Eventos suscritos futuros:", {
        total: eventsData.length,
        future: futureEvents.length,
        futureEvents: futureEvents.map(e => ({
          id: e.event_id || e.id,
          title: e.title,
          date: e.date_time || e.date
        }))
      })
      
      setSubscribedEventsData(futureEvents)
      if (futureEvents.length > 0) await loadEventViews(futureEvents)
    } catch (error) {
      console.error("❌ Error loading subscribed events:", error)
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      })
      setSubscribedEventsData([])
    }
  }, [user?.user_id, loadEventViews])

  const loadPastEvents = useCallback(async () => {
    if (!user?.user_id) return
    try {
      console.log("👤 ProfileScreen: Cargando eventos pasados del usuario:", user.user_id)
      
      // Obtener eventos suscritos del usuario
      const response = await eventService.getUserEvents(user.user_id, 'subscribed')
      console.log("👤 ProfileScreen: Respuesta de eventos para filtrar pasados:", response)
      
      let eventsData = []
      if (Array.isArray(response)) {
        eventsData = response
      } else if (response?.data && Array.isArray(response.data)) {
        eventsData = response.data
      } else if (response?.events && Array.isArray(response.events)) {
        eventsData = response.events
      }
      
      // Filtrar solo eventos pasados a los que me suscribí
      const today = new Date()
      const pastEventsData = eventsData.filter(event => {
        const eventEndDate = new Date(event.end_date_time || event.date_time || event.date)
        return eventEndDate < today
      })
      
      console.log("👤 ProfileScreen: Eventos pasados suscritos:", {
        total: eventsData.length,
        past: pastEventsData.length
      })
      
      setPastEvents(pastEventsData)
      if (pastEventsData.length > 0) await loadEventViews(pastEventsData)
    } catch (error) {
      console.error("❌ Error loading past events:", error)
      setPastEvents([])
    }
  }, [user?.user_id, loadEventViews])

  const loadLikedPosts = useCallback(async () => {
    if (!user?.user_id) return
    
    // No hacer llamadas API para usuarios guest
    if (isGuest || user?.role === 'guest' || user?.is_guest) {
      console.log('👤 Usuario guest: estableciendo liked posts vacíos')
      setLikedPosts(new Set())
      return
    }
    
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/posts/user/${user.user_id}/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        const likedPostIds = Array.isArray(data.data) ? data.data.map(post => post.post_id) : []
        setLikedPosts(new Set(likedPostIds))
      }
    } catch (error) {
      console.error("Error loading liked posts:", error)
      setLikedPosts(new Set())
    }
  }, [user?.user_id, isGuest, user?.role, user?.is_guest])

  const fetchUserPoints = useCallback(async () => {
    if (!user?.user_id) return
    
    // No hacer llamadas API para usuarios guest
    if (isGuest || user?.role === 'guest' || user?.is_guest) {
      console.log('👤 Usuario guest: estableciendo puntos en 0')
      setPoints(0)
      return
    }
    
    try {
      const pointsData = await gamificationService.getUserPoints(user.user_id)
      const pointsValue = typeof pointsData === 'object' ? pointsData.total_points || pointsData.points || 0 : pointsData || 0
      setPoints(pointsValue)
    } catch (error) {
      console.error("Error fetching points:", error)
      setPoints(0)
    }
  }, [user?.user_id, isGuest, user?.role, user?.is_guest])

  const fetchFollowersCount = useCallback(async () => {
    if (!user?.user_id) return
    
    // No hacer llamadas API para usuarios guest
    if (isGuest || user?.role === 'guest' || user?.is_guest) {
      console.log('👤 Usuario guest: estableciendo followers en 0')
      setFollowersCount(0)
      return
    }
    
    try {
      const count = await socialService.getFollowersCount(user.user_id)
      setFollowersCount(count)
    } catch (error) {
      console.error("Error fetching followers:", error)
      setFollowersCount(user.followers || 0)
    }
  }, [user?.user_id, user?.followers, isGuest, user?.role, user?.is_guest])

  const fetchFollowingCount = useCallback(async () => {
    if (!user?.user_id) return
    
    // No hacer llamadas API para usuarios guest
    if (isGuest || user?.role === 'guest' || user?.is_guest) {
      console.log('👤 Usuario guest: estableciendo following en 0')
      setFollowingCount(0)
      return
    }
    
    try {
      const count = await socialService.getFollowingCount(user.user_id)
      setFollowingCount(count)
    } catch (error) {
      console.error("Error fetching following:", error)
      setFollowingCount(user.following || 0)
    }
  }, [user?.user_id, user?.following, isGuest, user?.role, user?.is_guest])

  const fetchFriendRequests = useCallback(async () => {
    if (!user?.user_id) return
    
    // No hacer llamadas API para usuarios guest
    if (isGuest || user?.role === 'guest' || user?.is_guest) {
      console.log('👤 Usuario guest: estableciendo friend requests vacías')
      setFriendRequests([])
      return
    }
    
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL_IMAGE}/api/friend-request/received?status=pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFriendRequests(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
      } else {
        setFriendRequests([])
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error)
      setFriendRequests([])
    }
  }, [user?.user_id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (user?.user_id) await fetchUserProfile(user.user_id)
      await loadAllData()
    } catch (error) {
      console.error("Refresh error:", error)
      setError("Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }, [user?.user_id, fetchUserProfile, loadAllData])

  const pickProfileImage = async () => {
    try {
      setLoadingImage(true)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission required", "We need camera roll permissions!")
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        const upload = await imageService.uploadProfileImage(asset.uri, user.user_id)
        if (!upload?.success) throw new Error(upload?.error || "Failed to upload image")
        await fetchUserProfile(user.user_id)
        Alert.alert("Success", "Profile image updated!")
      }
    } catch (error) {
      console.error("Error picking profile image:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoadingImage(false)
    }
  }

  const pickBannerImage = async () => {
    try {
      setLoadingImage(true)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission required", "We need camera roll permissions!")
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        const upload = await imageService.uploadBannerImage(asset.uri, user.user_id)
        if (!upload?.success) throw new Error(upload?.error || "Failed to upload image")
        await fetchUserProfile(user.user_id)
        Alert.alert("Success", "Banner image updated!")
      }
    } catch (error) {
      console.error("Error picking banner image:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoadingImage(false)
    }
  }

  const uploadNewImage = async () => {
    console.log('📷 uploadNewImage iniciado')
    try {
      setLoadingImage(true)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission required", "We need camera roll permissions!")
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri
        console.log('✅ Imagen seleccionada:', imageUri)
        setNewImageUri(imageUri)
        console.log('🔄 Abriendo modal... estado actual imageModal:', imageModal)
        setImageModal(true)
        console.log('🔓 Modal abierto - setImageModal(true) ejecutado')
      } else {
        console.log('❌ Selección de imagen cancelada o sin assets')
      }
    } catch (error) {
      console.error("Error selecting new image:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoadingImage(false)
    }
  }

  const selectImageForPost = async () => {
    console.log('🔍 selectImageForPost iniciado')
    const asset = await pickImageFromGallery()
    if (asset) {
      console.log('✅ Imagen seleccionada en selectImageForPost:', asset.uri)
      setNewImageUri(asset.uri)
      console.log('🔄 newImageUri actualizado a:', asset.uri)
    } else {
      console.log('❌ No se seleccionó imagen en selectImageForPost')
    }
  }

  const submitNewImage = async () => {
    console.log('🚀 submitNewImage iniciado')
    console.log('📋 Datos iniciales:', {
      hasImageUri: !!newImageUri,
      imageUri: newImageUri,
      title: newImageTitle,
      description: newImageDescription
    })

    if (checkGuestRestriction('crear posts', navigation)) {
      return
    }

    if (!newImageUri || !newImageTitle.trim()) {
      console.log('❌ Validación fallida - falta imagen o título')
      Alert.alert("Image and Title Required", "Please select an image and enter a title for your post")
      return
    }
    
    try {
      console.log('⏳ Iniciando proceso de creación...')
      setLoadingImage(true)
      
      // Crear FormData para el post
      const formData = new FormData()
      
      // Agregar la imagen
      formData.append('image', {
        uri: newImageUri,
        type: 'image/jpeg',
        name: `post_${Date.now()}.jpg`,
      })
      
      // Agregar los datos del post
      formData.append('title', newImageTitle.trim())
      if (newImageDescription.trim()) {
        formData.append('description', newImageDescription.trim())
      }
      
      console.log('📤 Creando post con FormData...')
      
      // Debug: mostrar FormData keys
      console.log('📋 FormData keys:', Array.from(formData.keys()))
      
      // Usar el endpoint correcto de posts
      const token = await AsyncStorage.getItem("token")
      const url = `${BASE_URL}/posts`
      console.log('🔗 URL del post:', url)
      console.log('🔗 BASE_URL:', BASE_URL)
      console.log('🔑 Token disponible:', !!token)
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN')
      
      console.log('📡 Enviando petición...')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No establecer Content-Type para FormData
        },
        body: formData,
      })
      
      console.log('📥 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Post creado exitosamente:', result)
        
        await loadPosts()
        setImageModal(false)
        setNewImageTitle("")
        setNewImageDescription("")
        setNewImageUri(null)
        Alert.alert("Success", "Post created successfully!")
      } else {
        const errorText = await response.text()
        console.error('❌ Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Error completo en submitNewImage:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      Alert.alert("Error", error.message || "Failed to create post")
    } finally {
      console.log('🏁 Finalizando submitNewImage, loading = false')
      setLoadingImage(false)
    }
  }

  const saveProfile = async () => {
    if (checkGuestRestriction('actualizar tu perfil', navigation)) {
      return;
    }
    try {
      setLoadingEdit(true)
      const result = await updateUser({
        display_name: editName || null,
        username: editUsername || null,
        bio: editBio || null,
      })
      if (result.success) {
        setEditModal(false)
        Alert.alert("Success", "Profile updated successfully!")
      } else {
        throw new Error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoadingEdit(false)
    }
  }

  const updateStatusWithText = async () => {
    if (!statusText.trim()) {
      Alert.alert("Status Required", "Please enter a status message")
      return
    }
    try {
      Alert.alert("Success", `Status updated: "${statusText}"`)
      setStatusText("")
      setStatusModal(false)
    } catch (error) {
      Alert.alert("Error", "Failed to update status")
    }
  }

  const toggleSubscribedEventsVisibility = async () => {
    try {
      const newValue = !showSubscribedEvents
      const result = await updateUser({ show_subscribed_events: newValue })
      if (result.success) {
        setShowSubscribedEvents(newValue)
        Alert.alert("Success", `Subscribed events are now ${newValue ? "visible" : "hidden"}`)
      } else {
        throw new Error(result.error || "Failed to update privacy setting")
      }
    } catch (error) {
      console.error("Error updating privacy setting:", error)
      Alert.alert("Error", error.message)
    }
  }

  const handleLikeEvent = useCallback(async (eventId) => {
    const numericEventId = parseInt(eventId)
    const numericUserId = parseInt(user?.user_id)
    if (isNaN(numericEventId) || isNaN(numericUserId)) return

    // Check if user is guest
    if (user?.role === 'guest' || user?.is_guest || user?.user_id?.toString().startsWith('guest_')) {
      console.log('👤 Usuario guest intentando dar like, mostrando restricción');
      // You might want to show a guest restriction modal here
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
      // Revert the local state on error
      setLocalLikedEvents(prev => {
        const newSet = new Set(prev)
        if (newSet.has(numericEventId)) {
          newSet.delete(numericEventId)
        } else {
          newSet.add(numericEventId)
        }
        return newSet
      })
      
      // Show error message if it's not a guest restriction
      if (!error.message.includes('iniciar sesión')) {
        Alert.alert('Error', 'No se pudo actualizar el like del evento');
      }
    }
  }, [user?.user_id, user?.role, user?.is_guest])

  const handleLikePost = useCallback(async (postId) => {
    const numericPostId = parseInt(postId)
    if (isNaN(numericPostId)) return

    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(numericPostId)) {
        newSet.delete(numericPostId)
      } else {
        newSet.add(numericPostId)
      }
      return newSet
    })

    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/posts/likes/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: numericPostId }),
      })
      if (!response.ok) {
        setLikedPosts(prev => {
          const newSet = new Set(prev)
          if (newSet.has(numericPostId)) {
            newSet.delete(numericPostId)
          } else {
            newSet.add(numericPostId)
          }
          return newSet
        })
      }
    } catch (error) {
      setLikedPosts(prev => {
        const newSet = new Set(prev)
        if (newSet.has(numericPostId)) {
          newSet.delete(numericPostId)
        } else {
          newSet.add(numericPostId)
        }
        return newSet
      })
    }
  }, [])

  const loadPostComments = async (postId) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const url = `${BASE_URL}/posts/comments/${postId}`
      console.log('🔗 Cargando comentarios desde:', url)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      console.log('📥 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Comentarios recibidos:', data)
        setPostComments(Array.isArray(data.data) ? data.data : [])
      } else {
        const errorText = await response.text()
        console.error('❌ Error cargando comentarios:', response.status, errorText)
        setPostComments([])
      }
    } catch (error) {
      console.error('❌ Error en loadPostComments:', error)
      setPostComments([])
    }
  }

  const sendPostComment = async () => {
    if (!newComment.trim() || !selectedPost || !selectedPost.post_id) {
      Alert.alert("Error", "Comment required")
      return
    }
    try {
      const token = await AsyncStorage.getItem("token")
      const url = `${BASE_URL}/posts/comments`
      const payload = {
        post_id: selectedPost.post_id,
        content: newComment,
      }
      
      console.log('📤 Enviando comentario a:', url)
      console.log('📦 Payload:', payload)
      
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      console.log('📥 Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Comentario enviado exitosamente:', result)
        setNewComment("")
        loadPostComments(selectedPost.post_id)
        Alert.alert("Success", "Comment added!")
      } else {
        const errorText = await response.text()
        console.error('❌ Error enviando comentario:', response.status, errorText)
        Alert.alert("Error", `Failed to send comment: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error en sendPostComment:", error)
      Alert.alert("Error", error.message)
    }
  }

  const handleFriendRequest = useCallback(async (userId, action) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const endpoint = action === "accept" 
        ? `${BASE_URL_IMAGE}/api/friend-request/accept`
        : `${BASE_URL_IMAGE}/api/friend-request/toggle`
      const body = action === "accept" 
        ? { senderId: userId }
        : { receiverId: userId }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        await fetchFriendRequests()
        Alert.alert("Success", `Request ${action === "accept" ? "accepted" : "declined"}`)
      }
    } catch (error) {
      console.error("Error handling friend request:", error)
      Alert.alert("Error", error.message)
    }
  }, [fetchFriendRequests])

  const getActiveTabData = useCallback(() => {
    switch (activeTab) {
      case "myEvents":
        return myEvents
      case "posts":
        return posts
      case "pastEvents":
        return pastEvents
      case "subscribedEvents":
        return subscribedEventsData
      default:
        return []
    }
  }, [myEvents, posts, pastEvents, subscribedEventsData, activeTab])

  const renderTabItem = useCallback(({ item }) => {
    if (activeTab === "myEvents" || activeTab === "subscribedEvents" || activeTab === "pastEvents") {
      const eventId = Number(item.event_id || item.id)
      return (
        <EventImageSquare
          item={item}
          darkMode={darkMode}
          onPress={() => {
            recordView('event', eventId)
            navigation.navigate("EventDetails", { event: item })
          }}
          onAction={() => handleLikeEvent(eventId)}
          liked={localLikedEvents.has(eventId) || likedEvents.includes(eventId)}
          views={eventViews[eventId] || 0}
        />
      )
    } else if (activeTab === "posts") {
      const postId = item.post_id || item.id
      return (
        <PostCard
          item={item}
          darkMode={darkMode}
          isLiked={likedPosts.has(postId)}
          onLike={() => handleLikePost(postId)}
          onComment={(post) => {
            recordView('post', postId)
            setSelectedPost(post)
            setCommentModal(true)
            loadPostComments(post.post_id)
          }}
          views={postViews[postId] || 0}
          normalizeImageUrl={normalizeImageUrl}
        />
      )
    }
    return null
  }, [activeTab, navigation, likedEvents, handleLikeEvent, handleLikePost, likedPosts, recordView, eventViews, postViews])

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={ACCENT_COLOR} />
          <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <FlatList
        data={getActiveTabData()}
        numColumns={activeTab === "posts" ? 1 : 2}
        key={activeTab}
        keyExtractor={(item, index) => (item?.event_id || item?.post_id || item?.id || `item-${index}`).toString()}
        renderItem={renderTabItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200EE" />}
        getItemLayout={(data, index) => {
          const itemHeight = activeTab === 'posts' ? 300 : 260
          return { length: itemHeight, offset: itemHeight * index, index }
        }}
        onScrollToIndexFailed={({ index, highestMeasuredFrameIndex, averageItemLength, distance }) => {
          try {
            const fallbackOffset = (averageItemLength || 260) * (highestMeasuredFrameIndex || 0)
            // @ts-ignore: use ref-less fallback via scrollToOffset on FlatList's underlying list
            // FlatList will retry automatically after measuring more items
          } catch (e) {}
        }}
        ListHeaderComponent={
          <>
            <View style={styles.bannerContainer}>
              <UserBanner user={user} onPress={pickBannerImage} disabled={loadingImage} />
            </View>
            <ProfileHeaderSelf
              user={user}
              darkMode={darkMode}
              followersCount={followersCount}
              followingCount={followingCount}
              eventsCount={myEvents.length}
              points={points}
              onPressEdit={() => {
                console.log('✏️ Botón Edit presionado')
                if (checkGuestRestriction('editar tu perfil', navigation)) {
                  console.log('🚫 Usuario guest intentando editar perfil')
                  return;
                }
                console.log('✅ Usuario autenticado, abriendo modal de edición')
                setEditModal(true)
                console.log('✏️ setEditModal(true) ejecutado')
              }}
              onPressSettings={() => navigation.navigate("Settings")}
              onPressStatus={() => setStatusModal(true)}
              onPressCreatePost={() => {
                console.log('📷 Botón Create Post presionado')
                if (checkGuestRestriction('crear posts', navigation)) {
                  console.log('🚫 Usuario guest intentando crear post')
                  return
                }
                console.log('✅ Usuario autenticado, abriendo modal de creación de post')
                setImageModal(true)
              }}
              friendRequests={friendRequests}
              onAcceptFriend={(senderId) => handleFriendRequest(senderId, "accept")}
              onDeclineFriend={(senderId) => handleFriendRequest(senderId, "decline")}
              Styles={styles}
              AvatarComponent={(props) => <UserAvatar {...props} size={120} onPress={pickProfileImage} />}
            />
            <View style={[styles.tabContainer, darkMode && styles.tabContainerDark]}>
              <ProfileTabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                accentColor={ACCENT_COLOR}
                darkMode={darkMode}
              />
            </View>
            {activeTab === "subscribedEvents" && (
              <View style={[styles.privacyContainer, darkMode && styles.privacyContainerDark]}>
                <View style={styles.privacyRow}>
                  <Text style={[styles.privacyText, darkMode && styles.privacyTextDark]}>
                    Show subscribed events to others
                  </Text>
                  <Switch
                    value={showSubscribedEvents}
                    onValueChange={toggleSubscribedEventsVisibility}
                    trackColor={{ false: "#767577", true: ACCENT_COLOR }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </View>
            )}
            {!loading && getActiveTabData().length === 0 && (
              <EmptyState activeTab={activeTab} darkMode={darkMode} />
            )}
          </>
        }
      />

      <EditProfileModal
        visible={editModal}
        onClose={() => {
          console.log('❌ EditProfileModal cerrado por onClose')
          setEditModal(false)
        }}
        onSave={saveProfile}
        loadingEdit={loadingEdit}
        editName={editName}
        setEditName={setEditName}
        editUsername={editUsername}
        setEditUsername={setEditUsername}
        editBio={editBio}
        setEditBio={setEditBio}
        darkMode={darkMode}
        Styles={styles}
      />

      {console.log('🔍 Renderizando CreatePostModal con visible:', imageModal)}
      {console.log('🔍 Renderizando EditProfileModal con visible:', editModal)}
      <CreatePostModal
        visible={imageModal}
        onClose={() => {
          console.log('❌ Modal cerrado por onClose')
          setImageModal(false)
        }}
        onSubmit={submitNewImage}
        onSelectImage={selectImageForPost}
        darkMode={darkMode}
        Styles={styles}
        newImageUri={newImageUri}
        setNewImageUri={setNewImageUri}
        newImageTitle={newImageTitle}
        setNewImageTitle={setNewImageTitle}
        newImageDescription={newImageDescription}
        setNewImageDescription={setNewImageDescription}
        loadingImage={loadingImage}
      />

      <StatusModal
        visible={statusModal}
        onClose={() => setStatusModal(false)}
        onUpdate={updateStatusWithText}
        statusText={statusText}
        setStatusText={setStatusText}
        darkMode={darkMode}
        Styles={styles}
      />

      <CommentsModal
        visible={commentModal}
        onClose={() => setCommentModal(false)}
        darkMode={darkMode}
        selectedPost={selectedPost}
        likedPosts={likedPosts}
        postViews={postViews}
        postComments={postComments}
        newComment={newComment}
        setNewComment={setNewComment}
        onToggleLike={handleLikePost}
        onSendComment={sendPostComment}
        currentUser={user}
        normalizeImageUrl={normalizeImageUrl}
      />

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

      {/* Modal de prueba simple */}
      <Modal
        visible={testModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setTestModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#8B5CF6',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20
          }}>
            ¡Modal de Prueba Funcionando!
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('❌ Cerrando modal de prueba')
              setTestModal(false)
              // Ahora intentar abrir el modal real
              console.log('📷 Intentando abrir modal real...')
              uploadNewImage()
            }}
            style={{
              backgroundColor: '#fff',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#8B5CF6', fontWeight: 'bold' }}>
              Cerrar y Abrir Modal Real
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerDark: {
    backgroundColor: "#181A20",
  },
  bannerContainer: {
    width: "100%",
    height: 200,
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
  tabContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
  },
  tabContainerDark: {
    backgroundColor: "#181A20",
  },
  privacyContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
  },
  privacyContainerDark: {
    backgroundColor: "#23243a",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  privacyText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  privacyTextDark: {
    color: "#fff",
  },
  // Resto de estilos necesarios para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "60%",
  },
  modalContainerDark: {
    backgroundColor: "#23243a",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  modalTitleDark: {
    color: "#fff",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: ACCENT_COLOR,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputLabelDark: {
    color: "#fff",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#000",
  },
  textInputDark: {
    backgroundColor: "#333644",
    borderColor: "#44475A",
    color: "#fff",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusPresets: {
    marginTop: 20,
  },
  presetButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  presetButtonDark: {
    backgroundColor: "#333644",
  },
  presetText: {
    fontSize: 14,
    color: "#333",
  },
  presetTextDark: {
    color: "#fff",
  },
  profileSection: {
    backgroundColor: "#fff",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  profileSectionDark: {
    backgroundColor: "#1F222A",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -60,
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  nameTextDark: {
    color: "#fff",
  },
  bioText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  bioTextDark: {
    color: "#aaa",
  },
  usernameText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
  },
  usernameTextDark: {
    color: "#bbb",
  },
  onlineStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  onlineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 12,
    color: "#666",
  },
  onlineStatusTextDark: {
    color: "#aaa",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  statNumberDark: {
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statLabelDark: {
    color: "#aaa",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  createPostButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
  },
  createPostGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  friendRequestsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  friendRequestsContainerDark: {
    backgroundColor: "#333644",
  },
  friendRequestsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  friendRequestsTitleDark: {
    color: "#fff",
  },
  friendRequestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  friendRequestName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  friendRequestNameDark: {
    color: "#fff",
  },
  friendRequestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  declineButton: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  declineButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
})
