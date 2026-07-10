import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { normalizeImageUrl } from "../utils/image"
import { HORIZONTAL_CARD_WIDTH, OFFER_CARD_HEIGHT } from "../constants/layout"

const WeekEventCard = ({ event, isLiked, onPress, onLike }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return {
      month: date.toLocaleDateString("en", { month: "short" }),
      day: date.getDate(),
    }
  }

  const formatPrice = (price) => {
    if (price === 0 || price === "0") return "Free"
    return `$${Number.parseFloat(price.toString()).toFixed(2)}`
  }

  const dateInfo = formatDate(event.date_time)

  return (
    <TouchableOpacity style={styles.weekEventCard} onPress={onPress}>
      <View style={styles.weekEventImageContainer}>
        <Image
          source={{ uri: normalizeImageUrl(event.cover_image || "https://via.placeholder.com/150x120") }}
          style={styles.weekEventImage}
        />
        <View style={styles.weekDateBadge}>
          <Text style={styles.weekDateMonth}>{dateInfo.month}</Text>
          <Text style={styles.weekDateDay}>{dateInfo.day}</Text>
        </View>
        <TouchableOpacity style={styles.weekHeartButton} onPress={onLike}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color={isLiked ? "#FF4757" : "#fff"} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekEventContent}>
        <Text style={styles.weekEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.weekEventPrice}>{formatPrice(event.price)}</Text>
        <View style={styles.weekLocationRow}>
          <Ionicons name="location-outline" size={12} color="#B8B8B8" />
          <Text style={styles.weekLocationText} numberOfLines={1}>
            {event.city || event.address || "Location TBD"}
          </Text>
        </View>
        <View style={styles.weekBottomRow}>
          <View style={styles.weekAttendeesContainer}>
            <View style={styles.weekAttendeeAvatars}>
              <View style={[styles.weekAttendeeAvatar, { backgroundColor: "#FF6B6B" }]} />
              <View style={[styles.weekAttendeeAvatar, { backgroundColor: "#4ECDC4", marginLeft: -6 }]} />
              <View style={[styles.weekAttendeeAvatar, { backgroundColor: "#45B7D1", marginLeft: -6 }]} />
            </View>
            <Text style={styles.weekAttendeeCount}>+{event.interested_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  weekEventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    marginRight: 10,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    height: OFFER_CARD_HEIGHT,
    width: HORIZONTAL_CARD_WIDTH,
  },
  weekEventImageContainer: {
    width: "40%",
    height: "100%",
    position: "relative",
  },
  weekEventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  weekDateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: "center",
    minWidth: 32,
  },
  weekDateMonth: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  weekDateDay: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  weekHeartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  weekEventContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  weekEventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  weekEventPrice: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  weekLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weekLocationText: {
    color: "#B8B8B8",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  weekBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekAttendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  weekAttendeeAvatars: {
    flexDirection: "row",
    marginRight: 6,
  },
  weekAttendeeAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
  },
  weekAttendeeCount: {
    color: "#B8B8B8",
    fontSize: 12,
    fontWeight: "500",
  },
})

export default WeekEventCard
