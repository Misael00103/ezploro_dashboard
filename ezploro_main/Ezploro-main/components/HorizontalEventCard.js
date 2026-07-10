import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { HORIZONTAL_CARD_WIDTH } from "../constants/layout"
import { normalizeImageUrl } from "../utils/image"

const HorizontalEventCard = ({ event, isLiked, onPress, onLike }) => {
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
    <TouchableOpacity style={styles.horizontalEventCard} onPress={onPress}>
      <Image
        source={{ uri: normalizeImageUrl(event.cover_image) }}
        style={styles.horizontalEventImage}
      />
      <View style={styles.horizontalDateBadge}>
        <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        <Text style={styles.dateDay}>{dateInfo.day}</Text>
      </View>
      <TouchableOpacity style={styles.horizontalHeartButton} onPress={onLike}>
        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#FF4757" : "#fff"} />
      </TouchableOpacity>
      <View style={styles.horizontalEventInfo}>
        <Text style={styles.horizontalEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.horizontalLocationRow}>
          <Ionicons name="location-outline" size={12} color="#8B5CF6" />
          <Text style={styles.horizontalLocationText} numberOfLines={1}>
            {event.city || event.address || "Location TBD"}
          </Text>
        </View>
        <Text style={styles.horizontalEventPrice}>{formatPrice(event.price)}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  horizontalEventCard: {
    width: HORIZONTAL_CARD_WIDTH,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  horizontalEventImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  horizontalDateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: "center",
  },
  dateMonth: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateDay: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  horizontalHeartButton: {
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
  horizontalEventInfo: {
    padding: 12,
  },
  horizontalEventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  horizontalLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  horizontalLocationText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 4,
  },
  horizontalEventPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
})

export default HorizontalEventCard
