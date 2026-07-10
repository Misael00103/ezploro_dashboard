import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useEventImageUrl } from "../hooks/useImageUrl"
import { SCREEN_WIDTH } from "../constants/layout"

const EventCard = ({ event, isLiked, onPress, onLike }) => {
  const imageUrl = useEventImageUrl(event.cover_image);
  
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
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.eventCard} onPress={onPress}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.eventImage}
        />
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
        </View>
        <TouchableOpacity style={styles.heartButton} onPress={onLike}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF4757" : "#fff"} />
        </TouchableOpacity>
        <View style={styles.gradientOverlay}>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.eventPrice}>{formatPrice(event.price)}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#B8B8B8" />
              <Text style={styles.locationText} numberOfLines={1}>
                {event.city || event.address || "Location TBD"}
              </Text>
            </View>
            <View style={styles.bottomRow}>
              <View style={styles.attendeesContainer}>
                <View style={styles.attendeeAvatars}>
                  <View style={[styles.attendeeAvatar, { backgroundColor: "#FF6B6B" }]} />
                  <View style={[styles.attendeeAvatar, { backgroundColor: "#4ECDC4", marginLeft: -8 }]} />
                  <View style={[styles.attendeeAvatar, { backgroundColor: "#45B7D1", marginLeft: -8 }]} />
                </View>
                <Text style={styles.attendeeCount}>+{event.interested_count || 22}</Text>
              </View>
              <TouchableOpacity style={styles.getNowButton} onPress={onPress}>
                <Text style={styles.getNowText}>Get Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  eventCard: {
    width: SCREEN_WIDTH - 40,
    height: 320,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dateBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  dateMonth: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  dateDay: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  heartButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 24,
  },
  eventPrice: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    color: "#B8B8B8",
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeAvatars: {
    flexDirection: "row",
    marginRight: 8,
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  attendeeCount: {
    color: "#B8B8B8",
    fontSize: 12,
    fontWeight: "500",
  },
  getNowButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  getNowText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
})

export default EventCard
