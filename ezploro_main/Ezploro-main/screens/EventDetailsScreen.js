import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { useCallback, useEffect, useState } from "react"
import { Alert, Modal, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { AboutTab } from "../components/AboutTab"
import { EventHeader } from "../components/EventHeader"
import { EventTabs } from "../components/EventTabs"
import { LocationTab } from "../components/LocationTab"
import { MembersTab } from "../components/MembersTab"
import { ScheduleTab } from "../components/ScheduleTab"
import EventManagementActions from "../components/events/EventManagementActions"
import { API_URL_EVENTS, API_URL_USERS_BY_ID } from "../config"
import { useAuth } from "../context/AuthContext"
import { useEvents } from "../context/EventContext"
import useGuestRestrictions from "../hooks/useGuestRestrictions"

export default function EventDetailsScreen({ route, navigation }) {
  const { user } = useAuth()
  const { likeEvent, subscribeToEvent, getEventLikes, likedEvents, subscribedEvents } = useEvents()
  const { restrictedActions, isGuestUser } = useGuestRestrictions()
  const [modalText, setModalText] = useState("")
  const [fullEvent, setFullEvent] = useState({})
  const [loading, setLoading] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [subscribersCount, setSubscribersCount] = useState(0)
  const [likes, setLikes] = useState(0)
  const [activeTab, setActiveTab] = useState("About")
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [userProfiles, setUserProfiles] = useState({})

  let { event, eventId } = route.params || {}

  // Si no hay evento pero hay eventId, crear un objeto evento básico
  if (!event && eventId) {
    event = { event_id: eventId, id: eventId }
  }

  if (event) {
    // Normalizar el ID del evento
    if (!event.event_id && event.id) {
      event = { ...event, event_id: event.id }
    } else if (!event.id && event.event_id) {
      event = { ...event, id: event.event_id }
    }
  }

  // Check if event is valid
  const isValidEvent = event && (event.event_id || event.id) && (event.event_id !== 'undefined' && event.id !== 'undefined')
  const isSubscribed = subscribedEvents.includes(event?.event_id)
  const isLiked = likedEvents.includes(event?.event_id)

  const isOnlineEvent = (eventObj) => {
    if (!eventObj) return false
    if (eventObj.online === true) return true
    if (eventObj.location_description && typeof eventObj.location_description === "string") {
      const locationLower = eventObj.location_description.toLowerCase().trim()
      return (
        locationLower === "online" ||
        locationLower === "virtual" ||
        locationLower.includes("online") ||
        locationLower.includes("virtual")
      )
    }
    if (eventObj.location && typeof eventObj.location === "string") {
      const locationLower = eventObj.location.toLowerCase().trim()
      return locationLower === "online" || locationLower.includes("online") || locationLower.includes("virtual")
    }
    return false
  }

  const hasVideoUrl = (eventObj) => {
    if (!eventObj) return false
    const videoUrl = eventObj?.video_url || eventObj?.videoUrl || eventObj?.event_link
    if (videoUrl && typeof videoUrl === "string") {
      return videoUrl.trim() !== "" && videoUrl !== "null" && videoUrl !== "undefined"
    }
    return false
  }

  const fetchUserProfile = async (userId) => {
    if (!userId || userId === "undefined" || userId === "null") return null
    if (userProfiles[userId]) return userProfiles[userId]

    try {
      const url = API_URL_USERS_BY_ID.replace(":userId", userId)
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const userData = await response.json()
        const profile = userData.data || userData
        setUserProfiles((prev) => ({ ...prev, [userId]: profile }))
        return profile
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
    return null
  }

  const loadEventLikes = useCallback(async () => {
    const eventId = fullEvent?.event_id || fullEvent?.id || event?.event_id || event?.id
    if (!eventId) return

    if (isGuestUser) {
      const fallbackLikes = fullEvent?.likes_count || fullEvent?.likes || event?.likes_count || event?.likes || 0
      setLikes(fallbackLikes)
      return
    }

    try {
      console.log('🔄 Loading likes for event:', eventId)
      
      // Usar el servicio de interacciones que ya está configurado
      const likesCount = await getEventLikes(eventId)
      console.log('👍 Likes count received:', likesCount)
      
      if (typeof likesCount === 'number') {
        setLikes(likesCount)
      } else {
        // Fallback: usar datos del evento
        const fallbackLikes = fullEvent?.likes_count || fullEvent?.likes || event?.likes_count || event?.likes || 0
        console.log('👍 Using fallback likes:', fallbackLikes)
        setLikes(fallbackLikes)
      }
    } catch (error) {
      console.warn('⚠️ Error loading likes:', error)
      // Fallback: usar datos del evento
      const fallbackLikes = fullEvent?.likes_count || fullEvent?.likes || event?.likes_count || event?.likes || 0
      console.log('👍 Using fallback likes after error:', fallbackLikes)
      setLikes(fallbackLikes)
    }
  }, [
    event?.event_id,
    event?.id,
    event?.likes,
    event?.likes_count,
    fullEvent?.event_id,
    fullEvent?.id,
    fullEvent?.likes,
    fullEvent?.likes_count,
    getEventLikes,
    isGuestUser,
  ])

  const loadEventSubscribers = useCallback(async () => {
    const eventId = fullEvent?.event_id || fullEvent?.id
    if (!eventId) return

    if (isGuestUser) {
      const fallbackSubscribers = fullEvent?.subscribers_count || fullEvent?.attendees_count || 0
      setSubscribersCount(fallbackSubscribers)
      setSubscribers([])
      return
    }

    try {
      console.log('🔄 Loading subscribers for event:', eventId)
      
      // 1. Usar datos del evento para el conteo
      const subscribersCount = fullEvent?.subscribers_count || fullEvent?.attendees_count || 0
      console.log('📊 Subscribers count from event data:', subscribersCount)
      setSubscribersCount(subscribersCount)

      // 2. Si hay suscriptores, intentar obtener la lista
      if (subscribersCount > 0) {
        try {
          const token = await AsyncStorage.getItem("token")
          const subscribersUrl = `${API_URL_EVENTS}/${eventId}/subscribers`
          console.log('📋 Fetching subscribers from:', subscribersUrl)
          
          const response = await fetch(subscribersUrl, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          })

          console.log('📡 Subscribers response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('📋 Subscribers data:', data)
            
            // Manejar diferentes estructuras de respuesta
            let subsArray = []
            if (Array.isArray(data)) {
              subsArray = data
            } else if (data.subscribers && Array.isArray(data.subscribers)) {
              subsArray = data.subscribers
            } else if (data.data && Array.isArray(data.data)) {
              subsArray = data.data
            }

            console.log('👥 Raw subscribers array:', subsArray.length)

            // Procesar solo los primeros 6 para mostrar
            const subscribersToShow = subsArray.slice(0, 6)
            const subscribersWithProfiles = []

            for (const subscriber of subscribersToShow) {
              try {
                let userId = subscriber.user?.user_id || subscriber.user_id
                if (userId) {
                  const profile = await fetchUserProfile(userId)
                  if (profile) {
                    subscribersWithProfiles.push({ 
                      ...subscriber, 
                      user: profile 
                    })
                  }
                }
              } catch (profileError) {
                console.warn('⚠️ Error fetching profile:', profileError)
                // Agregar con datos básicos si falla
                if (subscriber.user || subscriber.user_id) {
                  subscribersWithProfiles.push(subscriber)
                }
              }
            }
            
            console.log('✅ Processed subscribers:', subscribersWithProfiles.length)
            setSubscribers(subscribersWithProfiles)
            
          } else {
            console.warn('⚠️ Failed to fetch subscribers list, using empty array')
            setSubscribers([])
          }
        } catch (listError) {
          console.warn('⚠️ Error fetching subscribers list:', listError)
          setSubscribers([])
        }
      } else {
        console.log('📭 No subscribers for this event')
        setSubscribers([])
      }
      
    } catch (error) {
      console.error('❌ Error loading subscribers:', error)
      setSubscribersCount(fullEvent?.subscribers_count || fullEvent?.attendees_count || 0)
      setSubscribers([])
    }
  }, [
    event?.event_id,
    event?.id,
    fullEvent?.attendees_count,
    fullEvent?.event_id,
    fullEvent?.id,
    fullEvent?.subscribers_count,
    isGuestUser,
  ])

  const fetchEventDetails = async () => {
    const eventId = event?.event_id || event?.id
    if (!eventId) return

    setLoading(true)

    const applyFallbackEvent = () => {
      const fallback = {
        ...(event || {}),
        ...fullEvent,
      }

      if (!fallback.description && event?.description) {
        fallback.description = event.description
      }

      // Log para depurar faqs en fallback
      console.log('EventDetailsScreen: fallback fullEvent.faqs =', fallback.faqs, 'Type:', typeof fallback.faqs)

      setFullEvent(fallback)
    }

    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${API_URL_EVENTS}/${eventId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("🎯 Event data received:", {
          eventId: data.event_id || data.id,
          title: data.title,
          organizer: data.organizer,
          organizer_id: data.organizer_id,
          user_id: data.user_id,
          created_by: data.created_by
        })
        
        // Try multiple fields for organizer information
        let organizerData = data.organizer
        
        if (!organizerData && (data.organizer_id || data.user_id || data.created_by)) {
          const organizerId = data.organizer_id || data.user_id || data.created_by
          console.log("🔍 Fetching organizer profile for ID:", organizerId)
          const organizerProfile = await fetchUserProfile(organizerId)
          if (organizerProfile) {
            organizerData = organizerProfile
            console.log("✅ Organizer profile fetched:", organizerProfile)
          }
        } else if (organizerData?.user_id) {
          console.log("🔍 Fetching detailed organizer profile for:", organizerData.user_id)
          const organizerProfile = await fetchUserProfile(organizerData.user_id)
          if (organizerProfile) {
            organizerData = organizerProfile
            console.log("✅ Detailed organizer profile fetched:", organizerProfile)
          }
        }
        
        // Set organizer data
        if (organizerData) {
          data.organizer = organizerData
          console.log("✅ Final organizer set:", data.organizer)
        } else {
          console.log("⚠️ No organizer data found for event")
        }
        
        // Debug location data
        console.log("🗺️ Event location data:", {
          location: data.location,
          coordinates: data.coordinates,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          online: data.online,
          video_url: data.video_url,
          event_link: data.event_link
        });
        
        // Debug: mostrar datos completos del evento
        console.log("🔍 Event data complete:", {
          eventId: data.event_id || data.id,
          title: data.title,
          hasFaqs: !!data.faqs,
          faqsType: typeof data.faqs,
          faqsValue: data.faqs,
          faqsLength: Array.isArray(data.faqs) ? data.faqs.length : 'not array',
          allKeys: Object.keys(data)
        });

        // Procesar FAQs con más detalle
        let processedFaqs = [];
        
        if (data.faqs) {
          if (Array.isArray(data.faqs)) {
            processedFaqs = data.faqs;
            console.log("🔍 FAQs are already array:", processedFaqs);
          } else if (typeof data.faqs === 'string') {
            try {
              processedFaqs = JSON.parse(data.faqs);
              console.log("🔍 FAQs parsed from string:", processedFaqs);
            } catch (parseError) {
              console.error("❌ Error parsing FAQs string:", parseError);
              processedFaqs = [];
            }
          } else {
            console.warn("⚠️ FAQs in unexpected format:", typeof data.faqs, data.faqs);
            processedFaqs = [];
          }
        } else {
          console.log("🔍 No FAQs found in event data");
        }

        // Ensure faqs is always an array
        const processedData = {
          ...data,
          faqs: processedFaqs
        };
        
        console.log("🔍 Event faqs final processed:", {
          originalFaqs: data.faqs,
          processedFaqs: processedData.faqs,
          isArray: Array.isArray(processedData.faqs),
          length: processedData.faqs.length,
          sample: processedData.faqs.slice(0, 2)
        });
        
        setFullEvent(processedData)
        await loadEventLikes()
        await loadEventSubscribers()
      } else {
        console.error("EventDetailsScreen: Failed to fetch event details, status:", response.status)
        applyFallbackEvent()
      }
    } catch (error) {
      console.error("EventDetailsScreen: error fetching event details", error)
      applyFallbackEvent()
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    // Verificar restricciones de invitado
    if (restrictedActions.likeEvent(navigation)) {
      return
    }

    if (!user?.user_id) {
      Alert.alert("Error", "Debes iniciar sesión para dar like")
      return
    }

    const eventId = event?.event_id || event?.id
    if (!eventId) {
      Alert.alert("Error", "ID de evento no válido")
      return
    }

    try {
      console.log('👍 Toggling like for event:', eventId, 'user:', user.user_id)
      
      // 1. Actualizar UI optimísticamente
      const wasLiked = likedEvents.includes(eventId)
      const newLikesCount = wasLiked ? likes - 1 : likes + 1
      setLikes(newLikesCount)
      
      // 2. Llamar al contexto para sincronizar con el backend
      const result = await likeEvent(eventId)
      console.log('👍 Context like result:', result)
      
      // 3. Actualizar con el resultado real del servidor
      if (result && typeof result.like_count !== 'undefined') {
        setLikes(result.like_count)
      } else if (result && typeof result.likes_count !== 'undefined') {
        setLikes(result.likes_count)
      } else if (result && typeof result.count !== 'undefined') {
        setLikes(result.count)
      } else {
        // 4. Si no hay contador en la respuesta, recargar desde el servidor
        setTimeout(() => loadEventLikes(), 500)
      }
      
      console.log('✅ Like updated successfully')
      console.log('👍 Current like state:', { 
        isLiked: likedEvents.includes(eventId),
        likesCount: likes,
        eventId: eventId 
      })
      
    } catch (error) {
      console.error('❌ Error in handleLike:', error)
      // Revertir cambio optimista en caso de error
      const wasLiked = likedEvents.includes(eventId)
      const revertedCount = wasLiked ? likes + 1 : likes - 1
      setLikes(revertedCount)
      Alert.alert("Error", error.message || "No se pudo actualizar el like")
    }
  }

  const handleJoin = async () => {
    // Verificar restricciones de invitado
    if (restrictedActions.subscribeToEvent(navigation)) {
      return
    }

    if (!user?.user_id) {
      Alert.alert("Error", "Debes iniciar sesión para unirte")
      return
    }

    try {
      setLoading(true)
      const result = await subscribeToEvent(event.event_id)
      let modalMessage = ""
      if (result.message === "Suscripción eliminada") {
        modalMessage = "Te has desuscrito exitosamente"
        setSubscribersCount((prev) => Math.max(0, prev - 1))
        setSubscribers((prev) => prev.filter((sub) => sub.user?.user_id !== user.user_id))
      } else if (result.message === "Suscripción agregada") {
        modalMessage = "Te has suscrito exitosamente"
        setSubscribersCount((prev) => prev + 1)
        if (!subscribers.some((sub) => sub.user?.user_id === user.user_id)) {
          const userProfile = await fetchUserProfile(user.user_id)
          setSubscribers((prev) =>
            [...prev, { user: userProfile || { user_id: user.user_id, display_name: user.display_name } }].slice(0, 6),
          )
        }
      }
      if (modalMessage) {
        setModalText(modalMessage)
        setShowJoinModal(true)
        setTimeout(() => setShowJoinModal(false), 2000)
      }
      await loadEventSubscribers()
    } catch (error) {
      Alert.alert("Error", error.message || "Ocurrió un error al unirte al evento")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const eventUrl = `https://yourapp.com/events/${event.event_id}`
      const message = `Check out this event: ${fullEvent.title}\n${eventUrl}`
      await Share.share({ message, url: eventUrl, title: fullEvent.title })
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el evento")
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  useEffect(() => {
    const eventId = event?.event_id || event?.id
    if (event && eventId) {
      fetchEventDetails()
    }
  }, [event?.event_id, event?.id])

  // Solo cargar likes y subscribers una vez cuando se obtienen los detalles completos
  useEffect(() => {
    const eventId = fullEvent?.event_id || fullEvent?.id
    if (eventId && fullEvent.title) { // Verificar que tenemos datos completos
      loadEventLikes()
      loadEventSubscribers()
    }
  }, [fullEvent?.event_id, fullEvent?.id, fullEvent?.title])

  // Efecto separado para sincronizar likes cuando cambie el estado del contexto (solo una vez)
  useEffect(() => {
    const eventId = fullEvent?.event_id || fullEvent?.id || event?.event_id || event?.id
    if (eventId && likedEvents.length >= 0) { // Cambiar > 0 por >= 0
      console.log('🔄 Likes context changed, reloading likes for event:', eventId)
      loadEventLikes()
    }
  }, [likedEvents.length]) // Solo cuando cambie la cantidad de likes

  const handleProfileNavigation = (userId, username) => {
    // Si es el propio usuario, navegar al tab Profile
    if (userId === user?.user_id) {
      navigation.navigate("MainApp", { screen: "Profile" })
    } else {
      // Si es otro usuario, navegar a OtherProfile
      navigation.navigate("OtherProfile", { userId, username })
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "About":
        return <AboutTab event={fullEvent} isOnlineEvent={isOnlineEvent} />
      case "Schedule":
        return <ScheduleTab event={fullEvent} formatTime={formatTime} />
      case "Location":
        return <LocationTab event={fullEvent} isOnlineEvent={isOnlineEvent} hasVideoUrl={hasVideoUrl} />
      case "Members":
        return (
          <MembersTab
            subscribers={subscribers}
            subscribersCount={subscribersCount}
            onMemberPress={handleProfileNavigation}
          />
        )
      default:
        return null
    }
  }

  if (!isValidEvent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: El evento no tiene un ID válido.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <EventHeader
          event={fullEvent}
          likes={likes}
          isLiked={isLiked}
          subscribersCount={subscribersCount}
          subscribers={subscribers}
          onBack={() => navigation.goBack()}
          onLike={handleLike}
          onShare={handleShare}
          formatDate={formatDate}
          formatTime={formatTime}
          isOnlineEvent={isOnlineEvent}
          onCreatorPress={handleProfileNavigation}
          onMemberPress={handleProfileNavigation}
        />

        <View style={styles.bottomSheet}>
          <EventTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <View style={styles.tabContentContainer}>{renderTabContent()}</View>
          
          <EventManagementActions event={fullEvent} />
          
          <View style={styles.joinButtonContainer}>
            <TouchableOpacity
              style={[styles.joinButton, isSubscribed && styles.joinedButton]}
              onPress={handleJoin}
              disabled={loading}
            >
              <LinearGradient
                colors={isSubscribed ? ["#4CAF50", "#45A049"] : ["#8B5CF6", "#7C3AED"]}
                style={styles.joinButtonGradient}
              >
                <Ionicons name={isSubscribed ? "checkmark-circle" : "add-circle"} size={20} color="#fff" />
                <Text style={styles.joinButtonText}>
                  {loading ? "Loading..." : isSubscribed ? "Joined" : "Join Event"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={showJoinModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={styles.modalText}>{modalText}</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F23",
    padding: 20,
  },
  errorText: {
    color: "#FF4757",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    padding: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
  },
  errorButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -30,
  },
  tabContentContainer: {
    flex: 1,
  },
  joinButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  joinButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  joinedButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    color: "#333",
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

