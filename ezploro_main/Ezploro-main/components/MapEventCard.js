import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEventImageUrl } from "../hooks/useImageUrl"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CARD_WIDTH = SCREEN_WIDTH - 40

export default function MapEventCard({ event, onPress, onLike, isLiked }) {
  const imageUrl = useEventImageUrl(event.cover_image || event.image_url);
  
  // Debug: log de la imagen
  console.log('🖼️ MapEventCard image debug:', {
    eventId: event.event_id || event.id,
    originalImage: event.cover_image || event.image_url,
    processedUrl: imageUrl
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { month: "short", day: "numeric" }
    return date.toLocaleDateString("en-US", options)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <LinearGradient colors={["transparent", "rgba(15, 15, 35, 0.95)"]} style={styles.gradient} />

      <TouchableOpacity style={styles.bookmarkButton} onPress={onLike} activeOpacity={0.7}>
        <Ionicons name={isLiked ? "bookmark" : "bookmark-outline"} size={24} color={isLiked ? "#8B5CF6" : "#fff"} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
          <Text style={styles.dateText}>
            {formatDate(event.date_time)} • {formatTime(event.date_time)}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#B8B8D9" />
          <Text style={styles.locationText} numberOfLines={1}>
            {event.address || event.city}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.price}>${event.price || "0"}</Text>
          </View>
          <View style={styles.statsContainer}>
            <Ionicons name="people-outline" size={16} color="#B8B8D9" />
            <Text style={styles.statsText}>{event.subscribers_count || event.interested_count || 0}</Text>
          </View>
        </View>
      </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 20,
    // Sombras en el wrapper
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android
  },
  card: {
    width: CARD_WIDTH,
    height: 320,
    backgroundColor: "#1F222A",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bookmarkButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // Sombra sutil para mejor visibilidad
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // Android
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 28,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "600",
    marginLeft: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    lineHeight: 26,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: "#B8B8D9",
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceLabel: {
    fontSize: 12,
    color: "#B8B8D9",
    marginRight: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
})
