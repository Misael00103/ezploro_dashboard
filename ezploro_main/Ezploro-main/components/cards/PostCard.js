import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const ACCENT_COLOR = "#8B5CF6"

export default function PostCard({ post, onLike, onComment, isLiked = false, darkMode = false, showViews = true }) {
  const imageUrl = post?.image
  const title = post?.title || "Untitled Post"
  const description = post?.description || "No description"
  const likes = post?.likes_count || post?.likes || 0
  const views = post?.views || 0
  const commentsCount = post?.comments_count || 0

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Image source={{ uri: imageUrl || "/placeholder.svg?height=300&width=300" }} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.title, darkMode && styles.titleDark]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.description, darkMode && styles.descriptionDark]} numberOfLines={2}>
          {description}
        </Text>

        {showViews && (
          <View style={styles.viewsContainer}>
            <Ionicons name="eye-outline" size={16} color="#666" />
            <Text style={styles.viewsText}>{views} views</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity onPress={onLike} style={styles.actionButton}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#FF6B6B" : ACCENT_COLOR} />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.actionText}>{commentsCount > 0 ? commentsCount : "Comment"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardDark: {
    backgroundColor: "#333644",
  },
  image: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  titleDark: {
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  descriptionDark: {
    color: "#aaa",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: ACCENT_COLOR,
    fontWeight: "500",
  },
})
