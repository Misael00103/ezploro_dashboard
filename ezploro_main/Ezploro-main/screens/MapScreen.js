import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Dimensions,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { useAuth } from "../context/AuthContext"
import { useEvents } from "../context/EventContext"
import { useLocationContext } from "../context/LocationContext"
import { useGuestRestrictions } from "../hooks/useGuestRestrictions"

import DateFilterModal from "../components/DateFilterModal"
import FilterModal from "../components/FilterModal"
import FiltersBar from "../components/FiltersBar"
import MapEventCard from "../components/MapEventCard"
import MapEventMarker from "../components/MapEventMarker"
import SearchBarComponent from "../components/SearchBarComponent"

import { API_URL_BOOKMARKS } from "../config"
import { FILTER_CATEGORIES } from "../constants/filterCategories"
import { filterEvents } from "../utils/eventFilters"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

const customMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1F222A" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#B8B8D9" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0F0F23" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#3A3F47" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#2A2D35" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8B8B9E" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2A2D35" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1F222A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0F0F23" }],
  },
]

export default function MapScreen({ navigation }) {
  // Usar los mismos hooks que HomeScreen
  const { likedEvents, fetchEvents } = useEvents()
  const { user } = useAuth()
  const { restrictedActions } = useGuestRestrictions()
  const { location: userLocation, cityName, isUpdatingLocation } = useLocationContext()

  // Estados básicos
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all_events")
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [localLikedEvents, setLocalLikedEvents] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [hasDateFilter, setHasDateFilter] = useState(false)

  const mapRef = useRef(null)
  const flatListRef = useRef(null)

  // Función para cargar eventos por ubicación específica
  const loadEventsForLocation = useCallback(async (location) => {
    if (!location || !location.latitude || !location.longitude) {
      console.warn("🗺️ MapScreen: Ubicación inválida")
      return
    }

    console.log("🗺️ MapScreen: Cargando eventos para nueva ubicación:", {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.country
    })
    
    setLoading(true)

    try {
      // Usar fetchEvents con parámetros de ubicación específicos
      await fetchEvents({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 50, // 50km de radio
        limit: 100,
        forceRefresh: true // Forzar actualización
      })
      
      console.log("🗺️ MapScreen: Eventos solicitados para nueva ubicación")
      
    } catch (error) {
      console.error("❌ MapScreen: Error cargando eventos por ubicación:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchEvents])

  // Escuchar cambios en los eventos del contexto
  const { events } = useEvents()

  // Efecto para recargar eventos cuando cambie la ubicación del usuario
  useEffect(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      console.log("🗺️ MapScreen: Ubicación del usuario cambió, recargando eventos:", userLocation)
      loadEventsForLocation(userLocation)
    }
  }, [userLocation?.latitude, userLocation?.longitude, userLocation?.city, userLocation?.country, loadEventsForLocation])

  // Procesar eventos exactamente igual que HomeScreen
  const processedEvents = useMemo(() => {
    if (!events || events.length === 0) {
      console.log("🗺️ MapScreen: No hay eventos disponibles")
      return []
    }

    console.log("�️ MapMScreen: Procesando eventos del HomeScreen:", {
      totalEvents: events.length,
      userLocation: userLocation
    })

    // Filtrar eventos online (no deben aparecer en el mapa)
    const physicalEvents = events.filter(event => {
      // Si el evento tiene online: true, no mostrarlo en el mapa
      if (event.online === true) {
        return false
      }
      
      // Si location es "Online" o similar, no mostrarlo
      if (typeof event.location === "string" && 
          event.location.toLowerCase().includes("online")) {
        return false
      }
      
      return true
    })

    console.log("🗺️ MapScreen: Eventos físicos filtrados:", {
      total: physicalEvents.length,
      onlineFiltered: events.length - physicalEvents.length
    })

    // Asignar coordenadas a eventos
    const eventsWithCoords = physicalEvents.map((event) => {
      // Si el evento ya tiene coordenadas, usarlas
      if (event.latitude && event.longitude) {
        return {
          ...event,
          latitude: event.latitude,
          longitude: event.longitude,
        }
      }

      // Si tiene coordenadas en formato GeoJSON
      if (event.location && event.location.coordinates && Array.isArray(event.location.coordinates)) {
        return {
          ...event,
          latitude: event.location.coordinates[1], // GeoJSON: [lon, lat]
          longitude: event.location.coordinates[0],
        }
      }

      // Coordenadas por defecto basadas en la ciudad
      const getDefaultCoords = (city) => {
        const cityCoords = {
          'santo domingo': { lat: 18.4861, lon: -69.9312 },
          'santiago': { lat: 19.4517, lon: -70.6970 },
          'puerto plata': { lat: 19.7892, lon: -70.6904 },
          'la romana': { lat: 18.4273, lon: -68.9728 }
        }

        const cityKey = (city || '').toLowerCase()
        for (const [key, coords] of Object.entries(cityCoords)) {
          if (cityKey.includes(key)) {
            return coords
          }
        }

        // Por defecto Santo Domingo con pequeña variación
        const eventId = event.event_id || event.id || 0
        const offset = (eventId % 100) / 10000 // Pequeña variación
        return { 
          lat: 18.4861 + offset, 
          lon: -69.9312 + offset 
        }
      }

      const coords = getDefaultCoords(event.city)
      return {
        ...event,
        latitude: coords.lat,
        longitude: coords.lon,
      }
    })

    // Aplicar filtros exactamente igual que HomeScreen
    let filtered = filterEvents(
      eventsWithCoords,
      selectedFilter,
      searchQuery,
      hasDateFilter ? selectedDate : null
    )

    console.log("🗺️ MapScreen: Eventos procesados finales:", {
      withCoords: eventsWithCoords.length,
      afterFilters: filtered.length
    })

    return filtered
  }, [events, selectedFilter, searchQuery, hasDateFilter, selectedDate, userLocation])

  // Centrar mapa en la ubicación del usuario cuando cambie
  useEffect(() => {
    if (userLocation && mapRef.current) {
      console.log("🗺️ MapScreen: Centrando mapa en nueva ubicación:", userLocation)
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000)
    }
  }, [userLocation])

  const handleMarkerPress = (event, index) => {
    setSelectedEvent(event)

    // Animar mapa al marcador
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: event.latitude,
          longitude: event.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      )
    }

    // Scroll a la tarjeta
    if (flatListRef.current && index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true })
    }
  }

  const handleBookmarkEvent = async (eventId) => {
    if (restrictedActions.bookmarkEvent(navigation)) {
      return
    }

    const numericId = Number(eventId)
    if (!numericId || isNaN(numericId)) {
      return
    }

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const isBookmarked = localLikedEvents.has(numericId)
      const method = isBookmarked ? "DELETE" : "POST"

      const response = await fetch(`${API_URL_BOOKMARKS}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object_type: "event",
          object_id: numericId,
        }),
      })

      if (response.ok) {
        setLocalLikedEvents((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(numericId)) {
            newSet.delete(numericId)
          } else {
            newSet.add(numericId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('❌ Error al actualizar bookmark:', error)
    }
  }

  const handleRecenterMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        500,
      )
    }
  }

  const handleFilterApply = (filter, category) => {
    setSelectedFilter(filter)
    setSelectedCategory(category)
    setExpandedCategory(null)
    setShowFilterModal(false)
  }

  const handleDateFilterApply = (date) => {
    setSelectedDate(date)
    setHasDateFilter(!!date)
    setShowDateFilter(false)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={customMapStyle}
        initialRegion={{
          latitude: userLocation?.latitude || 18.4861,
          longitude: userLocation?.longitude || -69.9312,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {processedEvents.map((event, index) => (
          <Marker
            key={`marker-${event.event_id || event.id}`}
            coordinate={{
              latitude: event.latitude,
              longitude: event.longitude,
            }}
            onPress={() => handleMarkerPress(event, index)}
            tracksViewChanges={Platform.OS === 'ios' ? false : true}
            stopPropagation={true}
          >
            <MapEventMarker
              event={event}
              isSelected={selectedEvent?.event_id === event.event_id}
              onPress={() => handleMarkerPress(event, index)}
            />
          </Marker>
        ))}
      </MapView>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <SearchBarComponent 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            onFilterPress={() => setShowFilterModal(true)} 
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FiltersBar
          selectedFilter={selectedFilter}
          expandedCategory={expandedCategory}
          hasDateFilter={hasDateFilter}
          onFilterSelect={(filter) => {
            setSelectedFilter(filter)
            setExpandedCategory(null)
            setSelectedCategory(null)
          }}
          onCategoryExpand={setExpandedCategory}
          onDateFilterPress={() => setShowDateFilter(true)}
          filterCategories={FILTER_CATEGORIES}
        />
      </View>

      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenterMap} activeOpacity={0.8}>
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      {processedEvents.length > 0 && (
        <View style={styles.cardsContainer}>
          <FlatList
            ref={flatListRef}
            data={processedEvents}
            renderItem={({ item }) => (
              <MapEventCard
                event={item}
                onPress={() => navigation.navigate("EventDetails", { event: item, user })}
                onLike={() => handleBookmarkEvent(item.event_id || item.id)}
                isLiked={likedEvents.includes(item.event_id || item.id) || localLikedEvents.has(Number(item.event_id || item.id))}
              />
            )}
            keyExtractor={(item) => (item.event_id || item.id).toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              if (processedEvents[index]) {
                setSelectedEvent(processedEvents[index])
                if (mapRef.current) {
                  mapRef.current.animateToRegion(
                    {
                      latitude: processedEvents[index].latitude,
                      longitude: processedEvents[index].longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    },
                    500,
                  )
                }
              }
            }}
          />
        </View>
      )}

      {processedEvents.length === 0 && !loading && !isUpdatingLocation && (
        <View style={styles.noEventsContainer}>
          <Ionicons name="map-outline" size={64} color="#3A3F47" />
          <Text style={styles.noEventsText}>No hay eventos en esta área</Text>
          <Text style={styles.noEventsSubtext}>
            Ubicación actual: {cityName}
          </Text>
          <Text style={styles.noEventsSubtext}>
            Cambia tu ubicación en el HomeScreen para ver eventos de otras ciudades
          </Text>
        </View>
      )}

      {(loading || isUpdatingLocation) && (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color="#8B5CF6" />
          <Text style={styles.loadingText}>
            {isUpdatingLocation ? "Actualizando ubicación..." : "Cargando eventos..."}
          </Text>
        </View>
      )}

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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    zIndex: 10,
  },
  headerContent: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 0,
  },
  filtersContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 140 : 120,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  recenterButton: {
    position: "absolute",
    bottom: 450,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  cardsContainer: {
    position: "absolute",
    bottom: 130,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 5,
  },
  noEventsContainer: {
    position: "absolute",
    bottom: 130,
    left: 20,
    right: 20,
    backgroundColor: "rgba(31, 34, 42, 0.95)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noEventsText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 15,
    textAlign: "center",
  },
  noEventsSubtext: {
    fontSize: 16,
    color: "#B8B8D9",
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 130,
    left: 20,
    right: 20,
    backgroundColor: "rgba(31, 34, 42, 0.95)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8B5CF6",
    marginTop: 10,
    textAlign: "center",
  },
})