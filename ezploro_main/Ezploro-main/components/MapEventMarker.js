import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { CATEGORIES_WITH_SUBCATEGORIES } from "../constants/categories"
import { normalizeImageUrl } from "../utils/image"

// Función para obtener el color de la categoría
const getCategoryColor = (category) => {
  return CATEGORIES_WITH_SUBCATEGORIES[category]?.color || "#8B5CF6"
}

// Función para obtener el icono de la categoría
const getCategoryIcon = (category) => {
  return CATEGORIES_WITH_SUBCATEGORIES[category]?.icon || "calendar-outline"
}

export default function MapEventMarker({ event, isSelected, onPress, eventsCount = 1 }) {
  if (!event) {
    return null;
  }

  const categoryColor = getCategoryColor(event?.category)
  const categoryIcon = getCategoryIcon(event?.category)
  const isCluster = eventsCount > 1

  // Estado para manejar errores de carga de imagen
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Usar exactamente la misma lógica que HorizontalEventCard
  const originalImage = event?.cover_image || event?.image || event?.event_image || event?.image_url;
  const imageUrl = normalizeImageUrl(originalImage);

  // Debug: log de la imagen del pin
  console.log('📍 MapEventMarker image debug:', {
    eventId: event.event_id || event.id,
    title: event.title,
    originalImage,
    finalImageUrl: imageUrl,
    hasImage: !!originalImage,
    imageError,
    imageLoaded
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[
        styles.markerContainer,
        isSelected && styles.markerSelected,
        isCluster && styles.clusterContainer
      ]}>
        <View style={styles.imageContainer}>
          {/* Imagen principal */}
          {originalImage && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.markerImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('❌ Error loading marker image:', {
                  eventId: event.event_id || event.id,
                  imageUrl,
                  error: error.nativeEvent?.error
                });
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Marker image loaded successfully:', {
                  eventId: event.event_id || event.id,
                  imageUrl
                });
                setImageLoaded(true);
                setImageError(false);
              }}
              onLoadStart={() => {
                console.log('🔄 Starting to load marker image:', {
                  eventId: event.event_id || event.id,
                  imageUrl
                });
                setImageLoaded(false);
                setImageError(false);
              }}
            />
          ) : (
            /* Fallback con color de categoría solo si no hay imagen o hay error */
            <View style={[styles.backgroundLayer, { backgroundColor: categoryColor }]}>
              <Ionicons name={categoryIcon} size={24} color="#fff" />
            </View>
          )}
        </View>

        {/* Contador para clusters */}
        {isCluster && (
          <View style={[styles.clusterBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.clusterText}>{eventsCount}</Text>
          </View>
        )}
      </View>

      <View style={[styles.markerPointer, { borderTopColor: "#fff" }]} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#1F222A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  markerSelected: {
    borderWidth: 4,
    borderColor: "#8B5CF6",
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  clusterContainer: {
    width: 80, // Aún más grande para clusters
    height: 80,
    borderRadius: 40,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  backgroundLayer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30, // Mismo borderRadius que el contenedor
  },

  clusterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  clusterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  markerPointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginTop: -2,
  },
})
