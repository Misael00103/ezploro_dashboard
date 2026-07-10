import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEventImageUrl } from "../../hooks/useImageUrl"

export default function EventCard({ event, onPress, onLike, isLiked = false, darkMode = false, showViews = true }) {
  const originalImage = event?.cover_image || event?.image || event?.event_image
  const imageUrl = useEventImageUrl(originalImage)
  const title = event?.title || "Untitled Event"
  const likes = event?.likes_count || event?.likes || 0
  const views = event?.views || 0

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, darkMode && styles.cardDark]}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onLike} style={styles.actionButton}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#FF4757" : "#fff"} />
              <Text style={styles.actionText}>{likes}</Text>
            </TouchableOpacity>
            {showViews && (
              <View style={styles.stats}>
                <Ionicons name="eye" size={16} color="#fff" />
                <Text style={styles.statsText}>{views}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    aspectRatio: 0.8,
    margin: 4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardDark: {
    backgroundColor: "#333644",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 12,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
})
