import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { GOOGLE_MAPS_API_KEY } from "../config"

const POPULAR_LOCATIONS = [
  // República Dominicana
  {
    name: "Santo Domingo, Dominican Republic",
    coordinates: { latitude: 18.492972574394607, longitude: -69.90878456827315 },
  },
  { name: "Santiago, Dominican Republic", coordinates: { latitude: 19.4517, longitude: -70.697 } },
  { name: "Punta Cana, Dominican Republic", coordinates: { latitude: 18.5601, longitude: -68.3725 } },

  // Estados Unidos
  { name: "New York, USA", coordinates: { latitude: 40.7128, longitude: -74.006 } },
  { name: "Miami, USA", coordinates: { latitude: 25.7617, longitude: -80.1918 } },
  { name: "Los Angeles, USA", coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { name: "Chicago, USA", coordinates: { latitude: 41.8781, longitude: -87.6298 } },

  // Canadá
  { name: "Toronto, Canada", coordinates: { latitude: 43.6532, longitude: -79.3832 } },
  { name: "Vancouver, Canada", coordinates: { latitude: 49.2827, longitude: -123.1207 } },
  { name: "Montreal, Canada", coordinates: { latitude: 45.5017, longitude: -73.5673 } },
  { name: "Ottawa, Canada", coordinates: { latitude: 45.4215, longitude: -75.6972 } },
  { name: "Calgary, Canada", coordinates: { latitude: 51.0447, longitude: -114.0719 } },

  // España
  { name: "Madrid, Spain", coordinates: { latitude: 40.4168, longitude: -3.7038 } },
  { name: "Barcelona, Spain", coordinates: { latitude: 41.3851, longitude: 2.1734 } },

  // Reino Unido
  { name: "London, UK", coordinates: { latitude: 51.5074, longitude: -0.1278 } },

  // Francia
  { name: "Paris, France", coordinates: { latitude: 48.8566, longitude: 2.3522 } },

  // México
  { name: "Mexico City, Mexico", coordinates: { latitude: 19.4326, longitude: -99.1332 } },
  { name: "Cancun, Mexico", coordinates: { latitude: 21.1619, longitude: -86.8515 } },

  // Otros países importantes
  { name: "Buenos Aires, Argentina", coordinates: { latitude: -34.6118, longitude: -58.396 } },
  { name: "São Paulo, Brazil", coordinates: { latitude: -23.5505, longitude: -46.6333 } },
  { name: "Lima, Peru", coordinates: { latitude: -12.0464, longitude: -77.0428 } },
  { name: "Bogotá, Colombia", coordinates: { latitude: 4.711, longitude: -74.0721 } },
]

const LocationSelector = ({
  cityName,
  onLocationChange,
  onUseCurrentLocation,
  isManualLocation,
  processedEvents = [],
  isChangingLocation = false,
}) => {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const searchTimeoutRef = useRef(null)
  


  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const getLocationSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([])
      return
    }

    console.log("🔍 Searching for location:", query)
    setIsLoadingSuggestions(true)

    try {
      // Primero buscar en ciudades populares locales
      const popularCities = [
        { name: "Santo Domingo", country: "Dominican Republic" },
        { name: "Santiago", country: "Dominican Republic" },
        { name: "La Romana", country: "Dominican Republic" },
        { name: "Puerto Plata", country: "Dominican Republic" },
        { name: "San Pedro de Macorís", country: "Dominican Republic" },
        { name: "La Vega", country: "Dominican Republic" },
        { name: "Punta Cana", country: "Dominican Republic" },
        { name: "Barahona", country: "Dominican Republic" },
        { name: "New York", country: "USA" },
        { name: "Miami", country: "USA" },
        { name: "Los Angeles", country: "USA" },
        { name: "Chicago", country: "USA" },
        { name: "Toronto", country: "Canada" },
        { name: "Vancouver", country: "Canada" },
        { name: "Montreal", country: "Canada" },
        { name: "Madrid", country: "Spain" },
        { name: "Barcelona", country: "Spain" },
        { name: "London", country: "UK" },
        { name: "Paris", country: "France" },
        { name: "Mexico City", country: "Mexico" },
        { name: "Cancun", country: "Mexico" },
        { name: "Buenos Aires", country: "Argentina" },
        { name: "São Paulo", country: "Brazil" },
        { name: "Lima", country: "Peru" },
        { name: "Bogotá", country: "Colombia" },
      ]

      const matchingCities = popularCities
        .filter((city) => city.name.toLowerCase().includes(query.toLowerCase()))
        .map((city, index) => {
          // Buscar las coordenadas en POPULAR_LOCATIONS
          const locationData = POPULAR_LOCATIONS.find((loc) => 
            loc.name.toLowerCase().includes(city.name.toLowerCase())
          )

          return {
            id: `popular-${index}`,
            name: `${city.name}, ${city.country}`,
            country: city.country,
            displayName: `${city.name}, ${city.country}`,
            type: "city",
            isPopular: true,
            coordinates: locationData?.coordinates || {
              latitude: city.name === "Santo Domingo" ? 18.492972574394607 :
                       city.name === "Santiago" ? 19.4517 :
                       city.name === "La Romana" ? 18.4273 :
                       city.name === "Puerto Plata" ? 19.7930 :
                       city.name === "San Pedro de Macorís" ? 18.4539 :
                       city.name === "La Vega" ? 19.2225 :
                       city.name === "Punta Cana" ? 18.5601 :
                       city.name === "Barahona" ? 18.2085 :
                       city.name === "New York" ? 40.7128 :
                       city.name === "Miami" ? 25.7617 :
                       city.name === "Los Angeles" ? 34.0522 :
                       city.name === "Chicago" ? 41.8781 :
                       city.name === "Toronto" ? 43.6532 :
                       city.name === "Vancouver" ? 49.2827 :
                       city.name === "Montreal" ? 45.5017 :
                       city.name === "Madrid" ? 40.4168 :
                       city.name === "Barcelona" ? 41.3851 :
                       city.name === "London" ? 51.5074 :
                       city.name === "Paris" ? 48.8566 :
                       city.name === "Mexico City" ? 19.4326 :
                       city.name === "Cancun" ? 21.1619 :
                       city.name === "Buenos Aires" ? -34.6118 :
                       city.name === "São Paulo" ? -23.5505 :
                       city.name === "Lima" ? -12.0464 :
                       city.name === "Bogotá" ? 4.711 :
                       18.492972574394607,
              longitude: city.name === "Santo Domingo" ? -69.90878456827315 :
                        city.name === "Santiago" ? -70.697 :
                        city.name === "La Romana" ? -68.9728 :
                        city.name === "Puerto Plata" ? -70.6884 :
                        city.name === "San Pedro de Macorís" ? -69.3087 :
                        city.name === "La Vega" ? -70.5287 :
                        city.name === "Punta Cana" ? -68.3725 :
                        city.name === "Barahona" ? -71.1009 :
                        city.name === "New York" ? -74.006 :
                        city.name === "Miami" ? -80.1918 :
                        city.name === "Los Angeles" ? -118.2437 :
                        city.name === "Chicago" ? -87.6298 :
                        city.name === "Toronto" ? -79.3832 :
                        city.name === "Vancouver" ? -123.1207 :
                        city.name === "Montreal" ? -73.5673 :
                        city.name === "Madrid" ? -3.7038 :
                        city.name === "Barcelona" ? 2.1734 :
                        city.name === "London" ? -0.1278 :
                        city.name === "Paris" ? 2.3522 :
                        city.name === "Mexico City" ? -99.1332 :
                        city.name === "Cancun" ? -86.8515 :
                        city.name === "Buenos Aires" ? -58.396 :
                        city.name === "São Paulo" ? -46.6333 :
                        city.name === "Lima" ? -77.0428 :
                        city.name === "Bogotá" ? -74.0721 :
                        -69.90878456827315,
            }
          }
        })

      // Si tenemos API key de Google, también buscar en Google Places
      let googleResults = []
      if (GOOGLE_MAPS_API_KEY && matchingCities.length < 5) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${GOOGLE_MAPS_API_KEY}`
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data.predictions && data.predictions.length > 0) {
              googleResults = data.predictions.slice(0, 3).map((prediction, index) => ({
                id: `google-${index}`,
                name: prediction.description,
                displayName: prediction.description,
                type: "google_place",
                placeId: prediction.place_id,
                isPopular: false,
              }))
            }
          }
        } catch (googleError) {
          console.log("Google Places API not available:", googleError.message)
        }
      }

      const allSuggestions = [...matchingCities, ...googleResults]
      
      console.log(
        "📍 Found suggestions:",
        allSuggestions.length,
        allSuggestions.map((s) => s.displayName),
      )
      setLocationSuggestions(allSuggestions.slice(0, 8))
    } catch (error) {
      console.error("❌ Error getting location suggestions:", error)
      setLocationSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  const getPlaceDetails = useCallback(async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.result && data.result.geometry) {
          return {
            coordinates: {
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
            },
            address: data.result.formatted_address,
          }
        }
      }
    } catch (error) {
      console.error("Error getting place details:", error)
    }
    return null
  }, [])

  const handleLocationChange = async (location) => {
    console.log(`🌍 Changing location to: ${location.name}`)

    // Cerrar modal
    setShowLocationModal(false)
    setLocationSearchQuery("")
    setLocationSuggestions([])

    // Llamar al callback del componente padre
    if (onLocationChange) {
      await onLocationChange(location)
    }
  }

  // Función para sugerir ubicaciones con eventos
  const getSuggestedLocations = () => {
    // Si no hay eventos en la ubicación actual, sugerir ubicaciones populares
    if (processedEvents.length === 0) {
      return [
        POPULAR_LOCATIONS[0], // Santo Domingo
        POPULAR_LOCATIONS[8], // New York
        POPULAR_LOCATIONS[9], // Miami
        POPULAR_LOCATIONS[10], // Madrid
      ]
    }
    return POPULAR_LOCATIONS.slice(0, 6)
  }

  const filteredLocations = POPULAR_LOCATIONS.filter((location) =>
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()),
  )

  const handleLocationSelectorPress = () => {
    setShowLocationModal(true)
  }

  return (
    <>
      <TouchableOpacity style={styles.locationContainer} onPress={handleLocationSelectorPress}>
        <Text style={styles.locationText}>{cityName}</Text>
        {isChangingLocation ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <Ionicons name="chevron-down" size={16} color="#B8B8D9" />
        )}
      </TouchableOpacity>

      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Ubicación</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowLocationModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#B8B8B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ciudad o país..."
              placeholderTextColor="#B8B8B8"
              value={locationSearchQuery}
              onChangeText={(text) => {
                setLocationSearchQuery(text)
                
                // Limpiar timeout anterior
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current)
                }
                
                // Si el texto está vacío, limpiar sugerencias inmediatamente
                if (!text || text.length < 2) {
                  setLocationSuggestions([])
                  setIsLoadingSuggestions(false)
                  return
                }
                
                // Mostrar indicador de carga inmediatamente
                setIsLoadingSuggestions(true)
                
                // Configurar nuevo timeout para buscar
                searchTimeoutRef.current = setTimeout(() => {
                  getLocationSuggestions(text)
                }, 300) // Reducir a 300ms para mejor UX
              }}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {isLoadingSuggestions && <ActivityIndicator size="small" color="#8B5CF6" style={styles.loadingIndicator} />}
          </View>

          <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
            {/* Mi ubicación actual - siempre visible */}
            <TouchableOpacity
              style={[styles.locationItem, styles.currentLocationItem, !isManualLocation && styles.locationItemActive]}
              onPress={async () => {
                setShowLocationModal(false)
                setLocationSearchQuery("")
                setLocationSuggestions([])

                if (onUseCurrentLocation) {
                  await onUseCurrentLocation()
                }
              }}
            >
              <View style={[styles.locationIconContainer, styles.currentLocationIcon]}>
                <Ionicons name="locate" size={20} color="#4CAF50" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationItemTitle}>
                  {isManualLocation ? "Usar mi ubicación actual" : "Mi ubicación actual"}
                </Text>
                <Text style={styles.locationItemSubtitle}>
                  {isManualLocation ? "Detectar automáticamente con GPS" : "GPS automático activo"}
                </Text>
              </View>
              {!isManualLocation && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
            </TouchableOpacity>

            {/* Separador visual */}
            <View style={styles.separator} />

            {/* Mensaje de ayuda cuando se empieza a escribir */}
            {locationSearchQuery.length > 0 && locationSearchQuery.length < 2 && (
              <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={24} color="#8B5CF6" />
                <Text style={styles.helpText}>Escribe al menos 2 caracteres para buscar</Text>
              </View>
            )}

            {/* Resultados de búsqueda */}
            {locationSearchQuery.length >= 2 && (
              <>
                {locationSuggestions.length > 0 ? (
                  <>
                    <Text style={styles.locationSectionTitle}>Resultados de búsqueda ({locationSuggestions.length})</Text>
                    {locationSuggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={styles.locationItem}
                        onPress={async () => {
                          setIsLoadingSuggestions(true)
                          
                          const locationData = {
                            name: suggestion.displayName,
                            coordinates: suggestion.coordinates,
                          }

                          // Si es un lugar de Google Places, obtener coordenadas
                          if (suggestion.placeId && !suggestion.coordinates) {
                            try {
                              const placeDetails = await getPlaceDetails(suggestion.placeId)
                              if (placeDetails && placeDetails.coordinates) {
                                locationData.coordinates = placeDetails.coordinates
                                locationData.name = placeDetails.address || suggestion.displayName
                              }
                            } catch (error) {
                              console.error("Error getting place details:", error)
                            }
                          }

                          setIsLoadingSuggestions(false)
                          await handleLocationChange(locationData)
                        }}
                      >
                        <View style={styles.locationIconContainer}>
                          <Ionicons
                            name={
                              suggestion.isPopular
                                ? "star"
                                : suggestion.type === "google_place"
                                  ? "business"
                                  : suggestion.type === "city"
                                    ? "location"
                                    : "pin"
                            }
                            size={20}
                            color={
                              suggestion.isPopular ? "#FFD700" : suggestion.type === "google_place" ? "#4285F4" : "#8B5CF6"
                            }
                          />
                        </View>
                        <View style={styles.locationTextContainer}>
                          <Text style={styles.locationItemTitle}>{suggestion.name}</Text>
                          {suggestion.country && <Text style={styles.locationItemSubtitle}>{suggestion.country}</Text>}
                          {suggestion.type === "google_place" && (
                            <Text style={styles.locationItemSubtitle}>Powered by Google</Text>
                          )}
                        </View>
                        {suggestion.isPopular && (
                          <View style={styles.locationTypeIndicator}>
                            <Text style={styles.locationTypeText}>Popular</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                ) : !isLoadingSuggestions && (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={48} color="#666" />
                    <Text style={styles.noResultsTitle}>No se encontraron ubicaciones</Text>
                    <Text style={styles.noResultsSubtitle}>
                      Intenta buscar con el nombre de una ciudad o país
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Popular Locations - Only show when no search query */}
            {!locationSearchQuery && (
              <>
                <Text style={styles.locationSectionTitle}>
                  {processedEvents.length === 0 ? "Ubicaciones con eventos" : "Popular Locations"}
                </Text>
                {processedEvents.length === 0 && (
                  <Text style={styles.locationHint}>
                    No hay eventos en tu ubicación actual. Prueba estas ubicaciones:
                  </Text>
                )}
                {(processedEvents.length === 0 ? getSuggestedLocations() : filteredLocations).map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.locationItem, cityName === location.name && styles.locationItemActive]}
                    onPress={() => handleLocationChange(location)}
                  >
                    <View style={styles.locationIconContainer}>
                      <Ionicons name="location" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationItemTitle}>{location.name}</Text>
                    </View>
                    {cityName === location.name && <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minWidth: 180,
  },
  locationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationSectionTitle: {
    color: "#B8B8B8",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  locationHint: {
    color: "#8B5CF6",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    minHeight: 60,
  },
  locationItemActive: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationItemTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  locationItemSubtitle: {
    color: "#B8B8B8",
    fontSize: 14,
    marginTop: 2,
  },
  locationTypeIndicator: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationTypeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
  },
  currentLocationItem: {
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.3)",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    marginBottom: 16,
  },
  currentLocationIcon: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
    marginHorizontal: 16,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    color: "#B8B8B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  helpText: {
    color: "#8B5CF6",
    fontSize: 14,
    marginLeft: 8,
  },
})

export default LocationSelector
