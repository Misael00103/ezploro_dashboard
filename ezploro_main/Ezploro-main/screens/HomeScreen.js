"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { View, ScrollView, StyleSheet, Text, Platform, StatusBar, RefreshControl, FlatList } from "react-native"
import { useEvents } from "../context/EventContext"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import useRealTimeUpdates from "../hooks/useRealTimeUpdates"
import useToast from "../hooks/useToast"
import * as Location from "expo-location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import offerService from "../services/offerService"
import { useLocationContext } from "../context/LocationContext"

import LocationSelector from "../components/LocationSelector"
import SearchBarComponent from "../components/SearchBarComponent"
import FiltersBar from "../components/FiltersBar"
import EventsCounter from "../components/EventsCounter"
import SectionHeader from "../components/SectionHeader"
import OfferCard from "../components/OfferCard"
import HorizontalEventCard from "../components/HorizontalEventCard"
import CarouselCard from "../components/CarouselCard"
import WeekEventCard from "../components/WeekEventCard"
import EventCard from "../components/EventCard"
import FilterModal from "../components/FilterModal"
import DateFilterModal from "../components/DateFilterModal"
import RealtimeToast from "../components/RealtimeToast"
import GuestBanner from "../components/GuestBanner"

import { HORIZONTAL_CARD_WIDTH, CAROUSEL_ITEM_WIDTH, ITEM_SPACING } from "../constants/layout"
import { FILTER_CATEGORIES } from "../constants/filterCategories"
import { filterEvents, getActiveFilterLabel } from "../utils/eventFilters"
import debugLogger from "../utils/debugLogger"

const FALLBACK_CAROUSEL_ITEMS = [
  {
    id: "location-1",
    type: "location",
    title: "Explora eventos cerca de ti",
    subtitle: "Descubre lo que pasa en tu ciudad",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
  },
  {
    id: "explore-1",
    type: "explore",
    title: "Encuentra tu próxima aventura",
    subtitle: "Miles de eventos esperándote",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
  },
  {
    id: "community-1",
    type: "community",
    title: "Únete a la comunidad",
    subtitle: "Conecta con personas como tú",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
  },
]

const HomeScreen = React.memo(function HomeScreen({ navigation }) {
  const themeContext = useTheme()
  const authContext = useAuth()
  const eventContext = useEvents()

  const darkMode = themeContext?.darkMode || false
  const user = authContext?.user || null
  const events = eventContext?.events || []
  const likedEvents = eventContext?.likedEvents || []
  const loading = eventContext?.loading || false
  const fetchEvents = eventContext?.fetchEvents || (() => {})
  const likeEvent = eventContext?.likeEvent || (() => {})

  // Hook para notificaciones toast
  const { toasts, showNewEvent, showNotification, hideToast } = useToast()
  const {
    location: sharedLocation,
    cityName: sharedCityName,
    isManualLocation: sharedIsManualLocation,
    isUpdatingLocation,
    refreshEventsWithLocation,
    setManualLocation,
    useCurrentLocation: contextUseCurrentLocation,
    setLocationFromCoordinates,
  } = useLocationContext()

  // Hook para actualizaciones en tiempo real
  const { isConnected: socketConnected } = useRealTimeUpdates({
    onNewEvent: (eventData) => {
      console.log("🏠 HomeScreen: Nuevo evento recibido", eventData)
      showNewEvent(
        `🆕 Nuevo evento: ${eventData.title}`,
        4000,
        () => navigation.navigate("EventDetails", { event: eventData, user })
      )
    },
    onEventUpdated: (eventData) => {
      console.log("🏠 HomeScreen: Evento actualizado", eventData)
      // El EventContext ya maneja esto
    },
    onEventDeleted: (eventId) => {
      console.log("🏠 HomeScreen: Evento eliminado", eventId)
      // El EventContext ya maneja esto
    },
    onLikeUpdated: (data) => {
      console.log("🏠 HomeScreen: Like actualizado", data)
      // El EventContext ya maneja esto
    },
    onNewNotification: (notification) => {
      console.log("🏠 HomeScreen: Nueva notificación", notification)
      showNotification(
        notification.message || "Nueva notificación recibida",
        3000
      )
    }
  })

  const [userLocation, setUserLocation] = useState({
    latitude: 18.492972574394607,
    longitude: -69.90878456827315,
  })
  const [cityName, setCityName] = useState("Santo Domingo, Dominican Republic")
  const [isManualLocation, setIsManualLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all_events")
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef(null)
  const [localLikedEvents, setLocalLikedEvents] = useState(new Set())
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [realOffers, setRealOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(false)
  const [locationChanging, setLocationChanging] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [hasDateFilter, setHasDateFilter] = useState(false)
  const isInitializedRef = useRef(false)
  const lastLocationRef = useRef({ latitude: null, longitude: null })
  const locationUpdateTimeoutRef = useRef(null)

  useEffect(() => {
    if (!sharedLocation || typeof sharedLocation.latitude !== "number" || typeof sharedLocation.longitude !== "number") {
      return
    }
    const sameLat = Math.abs(sharedLocation.latitude - userLocation.latitude) < 1e-4
    const sameLon = Math.abs(sharedLocation.longitude - userLocation.longitude) < 1e-4
    if (!sameLat || !sameLon) {
      setUserLocation({
        latitude: sharedLocation.latitude,
        longitude: sharedLocation.longitude,
      })
    }
  }, [sharedLocation, userLocation.latitude, userLocation.longitude])

  useEffect(() => {
    if (sharedCityName && sharedCityName !== cityName) {
      setCityName(sharedCityName)
    }
  }, [sharedCityName, cityName])

  useEffect(() => {
    if (sharedIsManualLocation !== undefined && sharedIsManualLocation !== isManualLocation) {
      setIsManualLocation(sharedIsManualLocation)
    }
  }, [sharedIsManualLocation, isManualLocation])

  useEffect(() => {
    setLocationChanging(isUpdatingLocation)
  }, [isUpdatingLocation])

  
  // Función para calcular distancia entre dos puntos
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distancia en km
  }

  // Inicialización única al montar el componente
  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      if (!isInitializedRef.current && isMounted) {
        isInitializedRef.current = true
        console.log("🏠 HomeScreen: Inicializando componente...")
        
        // Inicializar la referencia de ubicación con la ubicación por defecto
        lastLocationRef.current = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }
        
        try {
          await initializeLocation()
          if (isMounted) await loadOffers()
          
          // Solo cargar eventos si el componente sigue montado y no hay eventos
          if (isMounted && events.length === 0) {
            console.log("🏠 HomeScreen: Carga inicial de eventos")
            fetchEvents()
          }
        } catch (error) {
          console.error("🏠 HomeScreen: Error en inicialización:", error)
        }
      }
    }
    
    initialize()
    
    return () => {
      isMounted = false
    }
  }, []) // Sin dependencias para evitar re-ejecución

  // Función estable para recargar eventos con debouncing
  const debouncedFetchEvents = useCallback(() => {
    if (locationUpdateTimeoutRef.current) {
      clearTimeout(locationUpdateTimeoutRef.current)
    }
    
    locationUpdateTimeoutRef.current = setTimeout(() => {
      console.log("🔄 HomeScreen: Ejecutando fetchEvents con debounce...")
      // Solo llamar fetchEvents si no está ya cargando
      if (!loading) {
        fetchEvents()
      } else {
        console.log("⏸️ HomeScreen: Evitando fetchEvents - ya está cargando")
      }
    }, 1000) // Aumentar debounce a 1 segundo para evitar spam
  }, [fetchEvents, loading])

  // TEMPORALMENTE DESHABILITADO - Recargar eventos cuando cambie la ubicación significativamente
  // Este useEffect está causando bucles infinitos, se deshabilita hasta encontrar una solución
  /*
  useEffect(() => {
    // Solo procesar si ya está inicializado y tenemos coordenadas válidas
    if (!isInitializedRef.current || !userLocation.latitude || !userLocation.longitude) {
      return
    }

    const lastLat = lastLocationRef.current?.latitude
    const lastLon = lastLocationRef.current?.longitude
    
    // Calcular distancia solo si tenemos ubicación previa válida
    let distance = 0
    let shouldReload = false
    
    if (lastLat && lastLon) {
      distance = calculateDistance(lastLat, lastLon, userLocation.latitude, userLocation.longitude)
      // Aumentar umbral a 50km para evitar recargas frecuentes
      shouldReload = distance > 50
    } else {
      // Primera vez que tenemos ubicación válida - NO recargar automáticamente
      shouldReload = false
    }
    
    if (shouldReload) {
      console.log("🌍 HomeScreen: Cambio significativo de ubicación detectado", {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        city: cityName,
        lastLocation: { lat: lastLat, lon: lastLon },
        distanceFromLast: `${distance.toFixed(2)}km`,
        shouldReload
      })
      
      // Actualizar la última ubicación conocida ANTES de hacer la llamada
      lastLocationRef.current = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }
      
      // Solo usar debounce para evitar múltiples llamadas
      debouncedFetchEvents()
    } else {
      // Actualizar la referencia sin recargar eventos
      lastLocationRef.current = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }
    }
  }, [userLocation.latitude, userLocation.longitude]) // Remover dependencias problemáticas
  */

  // Cleanup para evitar memory leaks
  useEffect(() => {
    return () => {
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current)
      }
    }
  }, [])

  // Actualizar ubicación periódicamente (deshabilitado temporalmente para evitar múltiples llamadas)
  // useEffect(() => {
  //   if (!isManualLocation) {
  //     const locationInterval = setInterval(() => {
  //       console.log("🔄 HomeScreen: Actualizando ubicación automáticamente...")
  //       updateCurrentLocation()
  //     }, 10 * 60 * 1000) // 10 minutos
  //
  //     return () => clearInterval(locationInterval)
  //   }
  // }, [isManualLocation])

  const initializeLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation")
      const savedCity = await AsyncStorage.getItem("cityName")
      const savedIsManual = await AsyncStorage.getItem("isManualLocation")

      if (savedLocation && savedCity) {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        setCityName(savedCity)
        setIsManualLocation(savedIsManual === "true")
        await setLocationFromCoordinates(location, {
          city: savedCity,
          manual: savedIsManual === "true",
          persist: false,
          triggerFetch: false,
        })
      } else {
        await requestLocationPermission()
      }
    } catch (error) {
      console.error("Error loading saved location:", error)
      await requestLocationPermission()
    }
  }

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        await updateCurrentLocation()
      }
    } catch (error) {
      console.error("Error requesting location:", error)
    }
  }

  const updateCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 300000, // 5 minutos
      })
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      // Usar la referencia para evitar dependencias circulares
      const currentLat = lastLocationRef.current?.latitude || userLocation.latitude
      const currentLon = lastLocationRef.current?.longitude || userLocation.longitude
      const distance = calculateDistance(currentLat, currentLon, newLocation.latitude, newLocation.longitude)
      
      if (distance > 1) { // Solo actualizar si se movió más de 1km
        console.log("📍 HomeScreen: Ubicación actualizada automáticamente", {
          oldLocation: { lat: currentLat, lon: currentLon },
          newLocation,
          distance: `${distance.toFixed(2)}km`
        })
        
        // Actualizar la referencia primero para evitar bucles
        lastLocationRef.current = newLocation
        setUserLocation(newLocation)

        const [result] = await Location.reverseGeocodeAsync(newLocation)
        if (result) {
          const city = `${result.city || result.subregion || "Unknown"}, ${result.country || ""}`
          setCityName(city)
          await AsyncStorage.setItem("cityName", city)
          await AsyncStorage.setItem("userLocation", JSON.stringify(newLocation))
          await setLocationFromCoordinates(newLocation, {
            city,
            manual: false,
            persist: false,
            triggerFetch: false,
          })
        }
      } else {
        console.log("📍 HomeScreen: Ubicación sin cambios significativos", {
          distance: `${distance.toFixed(2)}km`
        })
      }
    } catch (error) {
      console.error("❌ Error updating location:", error)
    }
  }, []) // Remover dependencias para evitar bucle infinito

  const loadOffers = async () => {
    try {
      setOffersLoading(true)
      const offers = await offerService.getOffers()
      setRealOffers(Array.isArray(offers) ? offers : [])
    } catch (error) {
      console.error("Error loading offers:", error)
      setRealOffers([])
    } finally {
      setOffersLoading(false)
    }
  }

  const handleLocationChange = useCallback(async (location) => {
    console.log("📍 HomeScreen: Cambio manual de ubicación", location)
    
    // Mostrar indicador de cambio de ubicación
    setLocationChanging(true)
    
    // Actualizar UI inmediatamente para feedback visual
    setUserLocation(location.coordinates)
    setCityName(location.name)
    setIsManualLocation(true)
    
    // Guardar en AsyncStorage
    await AsyncStorage.setItem("userLocation", JSON.stringify(location.coordinates))
    await AsyncStorage.setItem("cityName", location.name)
    await AsyncStorage.setItem("isManualLocation", "true")
    
    // Actualizar el contexto de ubicación compartido
    await setLocationFromCoordinates(location.coordinates, {
      city: location.name,
      manual: true,
      persist: false,
      triggerFetch: false,
    })
    
    // Mostrar loading y recargar eventos con un pequeño delay para suavizar la transición
    console.log("🔄 HomeScreen: Recargando eventos por cambio manual de ubicación")
    
    // Pequeño delay para que el usuario vea el cambio de ubicación antes de que cambien los eventos
    setTimeout(async () => {
      await refreshEventsWithLocation({}, { coordinates: location.coordinates })
      setLocationChanging(false) // Ocultar indicador después de cargar
    }, 800) // 800ms de delay para suavizar la transición
  }, [refreshEventsWithLocation, setLocationFromCoordinates])

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      console.log("📍 HomeScreen: Solicitando ubicación actual...")
      setLocationChanging(true)
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({})
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        
        // Actualizar UI inmediatamente
        setUserLocation(newLocation)
        setIsManualLocation(false)

        const [result] = await Location.reverseGeocodeAsync(newLocation)
        if (result) {
          const city = `${result.city || result.subregion || "Unknown"}, ${result.country || ""}`
          setCityName(city)
          await AsyncStorage.setItem("cityName", city)
          await AsyncStorage.setItem("userLocation", JSON.stringify(newLocation))
          await AsyncStorage.setItem("isManualLocation", "false")
          
          // Actualizar la referencia para evitar bucles
          lastLocationRef.current = newLocation
          await setLocationFromCoordinates(newLocation, {
            city,
            manual: false,
            persist: false,
            triggerFetch: false,
          })
          
          // Recargar eventos con delay suave
          setTimeout(async () => {
            await refreshEventsWithLocation({}, { coordinates: newLocation })
            setLocationChanging(false)
          }, 800)
        }
      } else {
        setLocationChanging(false)
      }
    } catch (error) {
      console.error("Error getting current location:", error)
      setLocationChanging(false)
    }
  }, [refreshEventsWithLocation, setLocationFromCoordinates])

  const handleLikeEvent = useCallback(
    (eventId) => {
      const numericId = Number(eventId)
      setLocalLikedEvents((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(numericId)) {
          newSet.delete(numericId)
        } else {
          newSet.add(numericId)
        }
        return newSet
      })
      likeEvent(eventId)
    },
    [likeEvent],
  )



  const processedEvents = useMemo(() => {
    // Asegurar que events sea un array válido
    const safeEvents = Array.isArray(events) ? events : []
    
    let filtered = filterEvents(
      safeEvents, 
      selectedFilter, 
      searchQuery, 
      hasDateFilter ? selectedDate : null
    )
    
    // Asegurar que filtered sea un array válido
    if (!Array.isArray(filtered)) {
      filtered = []
    }
    
    // Filtrar por proximidad en el frontend (ya que el backend no tiene PostGIS)
    if (userLocation.latitude && userLocation.longitude && filtered.length > 0) {
      filtered = filtered.map((event) => {
        // Extraer coordenadas de diferentes formatos (igual que en MapScreen)
        let eventLat, eventLon;
        
        if (event.latitude && event.longitude) {
          eventLat = event.latitude;
          eventLon = event.longitude;
        } else if (event.lat && event.lon) {
          eventLat = event.lat;
          eventLon = event.lon;
        } else if (event.coordinates?.latitude && event.coordinates?.longitude) {
          eventLat = event.coordinates.latitude;
          eventLon = event.coordinates.longitude;
        } else if (event.location?.coordinates && Array.isArray(event.location.coordinates)) {
          // Formato GeoJSON: [longitude, latitude]
          eventLon = event.location.coordinates[0];
          eventLat = event.location.coordinates[1];
        } else {
          // Coordenadas por defecto (Santo Domingo)
          eventLat = 18.4861;
          eventLon = -69.9312;
        }
        
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventLat,
          eventLon,
        );
        
        // Debug: log de eventos con coordenadas GeoJSON
        if (event.location?.coordinates) {
          console.log("🗺️ HomeScreen: Evento con GeoJSON detectado:", {
            eventId: event.event_id || event.id,
            title: event.title,
            geoJSON: event.location.coordinates,
            extractedCoords: { lat: eventLat, lon: eventLon },
            distance: `${distance.toFixed(2)}km`
          });
        }
        
        return {
          ...event,
          latitude: eventLat, // Asegurar que tenga coordenadas normalizadas
          longitude: eventLon,
          distance,
        }
      })
      .filter((event) => event.distance <= 200) // Mostrar eventos dentro de 200km
      .sort((a, b) => a.distance - b.distance) // Ordenar por proximidad
    }
    
    // Usar debugLogger para evitar spam de logs
    debugLogger.logOnChange('processedEvents', "🎯 HomeScreen: Eventos procesados", {
      totalEvents: safeEvents.length,
      filteredEvents: filtered.length,
      selectedFilter,
      searchQuery,
      userLocation: { lat: userLocation.latitude, lon: userLocation.longitude },
      city: cityName,
      nearbyEventsCount: filtered.filter(e => e.distance && e.distance <= 50).length,
      eventsWithGeoJSON: filtered.filter(e => e.location?.coordinates).length,
      sampleEvents: filtered.slice(0, 3).map(e => ({
        id: e.event_id || e.id,
        title: e.title,
        hasGeoJSON: !!e.location?.coordinates,
        distance: e.distance ? `${e.distance.toFixed(2)}km` : 'no distance'
      }))
    })
    
    return filtered
  }, [events, searchQuery, selectedFilter, hasDateFilter, selectedDate, userLocation.latitude, userLocation.longitude, cityName])

  const popularEvents = useMemo(() => {
    if (!Array.isArray(processedEvents)) return []
    return [...processedEvents].sort((a, b) => (b.interested_count || 0) - (a.interested_count || 0)).slice(0, 10)
  }, [processedEvents])

  const nearbyEvents = useMemo(() => {
    if (!Array.isArray(processedEvents)) return []
    return [...processedEvents]
      .map((event) => {
        // Usar coordenadas del evento si están disponibles, sino usar ubicación por defecto
        const eventLat = event.latitude || event.lat || 18.4861 // Santo Domingo por defecto
        const eventLon = event.longitude || event.lon || -69.9312
        
        return {
          ...event,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            eventLat,
            eventLon,
          ),
        }
      })
      .filter((event) => event.distance <= 100) // Filtrar eventos dentro de 100km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
  }, [processedEvents, userLocation])

  const recommendedEvents = useMemo(() => {
    if (!Array.isArray(processedEvents)) return []
    return [...processedEvents].sort(() => Math.random() - 0.5).slice(0, 10)
  }, [processedEvents])

  const thisWeekEvents = useMemo(() => {
    if (!Array.isArray(processedEvents)) return []
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return processedEvents
      .filter((event) => {
        const eventDate = new Date(event.date_time)
        return eventDate >= now && eventDate <= weekFromNow
      })
      .slice(0, 10)
  }, [processedEvents])

  const shuffledPopularEvents = useMemo(() => {
    if (!Array.isArray(popularEvents) || popularEvents.length === 0) {
      return FALLBACK_CAROUSEL_ITEMS
    }
    return [...popularEvents].sort(() => Math.random() - 0.5).slice(0, 5)
  }, [popularEvents])

  const offersAndPromotions = useMemo(() => {
    return Array.isArray(realOffers) ? realOffers.slice(0, 10) : []
  }, [realOffers])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Cargar eventos SIN filtros geoespaciales para evitar error PostGIS
      await refreshEventsWithLocation({}, { coordinates: userLocation, showLoader: true })
      await loadOffers()
    } catch (error) {
      console.error("Error refreshing:", error)
    } finally {
      setRefreshing(false)
    }
  }, [fetchEvents])

  // Usar la función unificada de getActiveFilterLabel

  const handleFilterApply = (filter, category, subcategory) => {
    setSelectedFilter(filter)
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)
    setExpandedCategory(null)
    setShowFilterModal(false)
  }

  const handleDateFilterApply = (date) => {
    setSelectedDate(date)
    setHasDateFilter(!!date)
    setShowDateFilter(false)
  }

  return (
    <View style={styles.blackContainer}>
      {/* Círculos decorativos */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <View style={styles.middleLeftBubble} />
      <View style={styles.middleRightBubble} />
      <View style={styles.smallTopRightBubble} />
      <View style={styles.smallBottomLeftBubble} />
      <View style={styles.tinyTopLeftBubble} />
      <View style={styles.tinyMiddleBubble} />
      <View style={styles.tinyBottomRightBubble} />
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      <ScrollView
        style={[styles.mainScrollView, { backgroundColor: "#0F0F23" }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8B5CF6"]} tintColor="#8B5CF6" />
        }
      >
        <View style={styles.header}>
          <LocationSelector
            cityName={cityName}
            onLocationChange={handleLocationChange}
            onUseCurrentLocation={handleUseCurrentLocation}
            isManualLocation={isManualLocation}
            processedEvents={processedEvents}
            isChangingLocation={locationChanging}
          />
        </View>

        <GuestBanner navigation={navigation} />

        <View style={styles.carouselContainer}>
          <FlatList
            data={shuffledPopularEvents}
            renderItem={({ item }) => (
              <CarouselCard
                item={item}
                onPress={() => {
                  if (item.type) {
                    navigation.navigate("EventsList", { events: processedEvents, title: item.title })
                  } else {
                    navigation.navigate("EventDetails", { event: item, user })
                  }
                }}
              />
            )}
            keyExtractor={(item, index) => `carousel-${item.event_id || item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CAROUSEL_ITEM_WIDTH + ITEM_SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: ITEM_SPACING }}
            ref={flatListRef}
            getItemLayout={(data, index) => ({
              length: CAROUSEL_ITEM_WIDTH + ITEM_SPACING,
              offset: (CAROUSEL_ITEM_WIDTH + ITEM_SPACING) * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              console.warn('ScrollToIndex failed:', info);
            }}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (CAROUSEL_ITEM_WIDTH + ITEM_SPACING))
              setActiveIndex(index)
            }}
            scrollEventThrottle={16}
          />
          <View style={styles.dotsContainer}>
            {shuffledPopularEvents.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        <SearchBarComponent
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={() => setShowFilterModal(true)}
        />

        <FiltersBar
          selectedFilter={selectedFilter}
          expandedCategory={expandedCategory}
          hasDateFilter={hasDateFilter}
          onFilterSelect={(filter) => {
            setSelectedFilter(filter)
            setExpandedCategory(null)
            setSelectedCategory(null)
            setSelectedSubcategory(null)
          }}
          onCategoryExpand={setExpandedCategory}
          onDateFilterPress={() => setShowDateFilter(true)}
          filterCategories={FILTER_CATEGORIES}
        />

        <EventsCounter
          count={processedEvents.length}
          filterLabel={selectedFilter !== "all_events" ? getActiveFilterLabel(selectedFilter) : null}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <SectionHeader
          title="Ofertas y Promociones"
          count={offersAndPromotions.length}
          onSeeAll={() =>
            navigation.navigate("OffersList", { offers: offersAndPromotions, title: "Offers and Promotions" })
          }
        />
        <FlatList
          data={offersAndPromotions}
          renderItem={({ item }) => <OfferCard offer={item} onPress={() => {}} />}
          keyExtractor={(item, index) => `offer-${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersList}
          snapToInterval={HORIZONTAL_CARD_WIDTH + 10}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: HORIZONTAL_CARD_WIDTH + 10,
            offset: (HORIZONTAL_CARD_WIDTH + 10) * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            console.warn('ScrollToIndex failed:', info);
          }}
          ListEmptyComponent={<Text style={styles.noEventsText}>No offers found</Text>}
        />

        <SectionHeader
          title="Popular"
          count={popularEvents.length}
          onSeeAll={() => navigation.navigate("EventsList", { events: popularEvents, title: "Popular Events" })}
        />
        <FlatList
          data={popularEvents}
          renderItem={({ item }) => (
            <HorizontalEventCard
              event={item}
              isLiked={likedEvents.includes(item.event_id) || localLikedEvents.has(Number(item.event_id))}
              onPress={() => navigation.navigate("EventDetails", { event: item, user })}
              onLike={() => handleLikeEvent(item.event_id)}
            />
          )}
          keyExtractor={(item, index) => `popular-${item.event_id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        <SectionHeader
          title="Events Near You"
          count={nearbyEvents.length}
          onSeeAll={() => navigation.navigate("EventsList", { events: nearbyEvents, title: "Events Near You" })}
        />
        <FlatList
          data={nearbyEvents}
          renderItem={({ item }) => (
            <HorizontalEventCard
              event={item}
              isLiked={likedEvents.includes(item.event_id) || localLikedEvents.has(Number(item.event_id))}
              onPress={() => navigation.navigate("EventDetails", { event: item, user })}
              onLike={() => handleLikeEvent(item.event_id)}
            />
          )}
          keyExtractor={(item, index) => `nearby-${item.event_id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        <SectionHeader
          title="Recomendados para ti"
          count={recommendedEvents.length}
          onSeeAll={() => navigation.navigate("EventsList", { events: recommendedEvents, title: "Recommended Events" })}
        />
        <FlatList
          data={recommendedEvents}
          renderItem={({ item }) => (
            <HorizontalEventCard
              event={item}
              isLiked={likedEvents.includes(item.event_id) || localLikedEvents.has(Number(item.event_id))}
              onPress={() => navigation.navigate("EventDetails", { event: item, user })}
              onLike={() => handleLikeEvent(item.event_id)}
            />
          )}
          keyExtractor={(item, index) => `recommended-${item.event_id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        <SectionHeader
          title="Eventos de esta semana"
          count={thisWeekEvents.length}
          onSeeAll={() => navigation.navigate("EventsList", { events: thisWeekEvents, title: "This Week Events" })}
        />
        <FlatList
          data={thisWeekEvents}
          renderItem={({ item }) => (
            <WeekEventCard
              event={item}
              isLiked={likedEvents.includes(item.event_id) || localLikedEvents.has(Number(item.event_id))}
              onPress={() => navigation.navigate("EventDetails", { event: item, user })}
              onLike={() => handleLikeEvent(item.event_id)}
            />
          )}
          keyExtractor={(item, index) => `week-${item.event_id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekEventsList}
          snapToInterval={HORIZONTAL_CARD_WIDTH + 10}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: HORIZONTAL_CARD_WIDTH + 10,
            offset: (HORIZONTAL_CARD_WIDTH + 10) * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            console.warn('ScrollToIndex failed:', info);
          }}
        />

        <View style={styles.eventsCountContainer}>
          <Text style={styles.eventsCount}>{processedEvents.length.toLocaleString()} Events</Text>
        </View>

        {processedEvents.length === 0 ? (
          <Text style={styles.noEventsText}>No events found</Text>
        ) : (
          processedEvents.map((event, index) => (
            <EventCard
              key={`event-${event.event_id}-${index}`}
              event={event}
              isLiked={likedEvents.includes(event.event_id) || localLikedEvents.has(Number(event.event_id))}
              onPress={() => navigation.navigate("EventDetails", { event, user })}
              onLike={() => handleLikeEvent(event.event_id)}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        selectedCategory={selectedCategory}
        onApply={handleFilterApply}
        filterCategories={FILTER_CATEGORIES}
      />

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        selectedDate={selectedDate}
        onApply={handleDateFilterApply}
      />

      {/* Toasts de notificaciones en tiempo real */}
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
    </View>
  )
})

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  topBubble: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    zIndex: -1,
  },
  bottomBubble: {
    position: "absolute",
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    zIndex: -1,
  },
  middleLeftBubble: {
    position: "absolute",
    top: "40%",
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    zIndex: -1,
  },
  middleRightBubble: {
    position: "absolute",
    top: "60%",
    right: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    zIndex: -1,
  },
  smallTopRightBubble: {
    position: "absolute",
    top: 100,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
    zIndex: -1,
  },
  smallBottomLeftBubble: {
    position: "absolute",
    bottom: 200,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.17)",
    zIndex: -1,
  },
  tinyTopLeftBubble: {
    position: "absolute",
    top: 200,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.25)",
    zIndex: -1,
  },
  tinyMiddleBubble: {
    position: "absolute",
    top: "50%",
    right: 30,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(139, 92, 246, 0.28)",
    zIndex: -1,
  },
  tinyBottomRightBubble: {
    position: "absolute",
    bottom: 100,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(139, 92, 246, 0.20)",
    zIndex: -1,
  },
  mainScrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#8B5CF6",
    width: 24,
  },
  offersList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  horizontalList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  weekEventsList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  eventsCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  eventsCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  noEventsText: {
    textAlign: "center",
    color: "#B8B8B8",
    fontSize: 16,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#FF4757",
    fontSize: 14,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 100,
  },
})

export default HomeScreen
