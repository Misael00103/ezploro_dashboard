import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { CAROUSEL_ITEM_WIDTH, CAROUSEL_ITEM_HEIGHT, ITEM_SPACING } from "../constants/layout"
import { normalizeImageUrl } from "../utils/image"

const CarouselCard = ({ item, onPress }) => {
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

  // Fallback card (no event)
  if (item.type) {
    return (
      <TouchableOpacity style={styles.carouselCard} onPress={onPress}>
        <Image source={{ uri: item.image }} style={styles.carouselImage} />
        <View style={styles.carouselOverlay}>
          <View style={styles.carouselBadge}>
            <Text style={styles.carouselBadgeText}>
              {item.type === "location" ? "📍" : item.type === "explore" ? "🔍" : "👥"}
            </Text>
          </View>
          <Text style={styles.carouselTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.carouselSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  // Real event card
  const dateInfo = formatDate(item.date_time)
  return (
    <TouchableOpacity style={styles.carouselCard} onPress={onPress}>
      <Image source={{ uri: normalizeImageUrl(item.cover_image) }} style={styles.carouselImage} />
      <View style={styles.carouselOverlay}>
        <Text style={styles.carouselDate}>{`${dateInfo.month} ${dateInfo.day}`}</Text>
        <Text style={styles.carouselTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.carouselSubtitle} numberOfLines={1}>
          {item.city || item.address || "Ubicación por confirmar"} • {formatPrice(item.price)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  carouselCard: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: ITEM_SPACING / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: "#1a1a2e",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  carouselDate: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  carouselTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 24,
    marginBottom: 4,
  },
  carouselSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  carouselBadge: {
    position: "absolute",
    top: -30,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselBadgeText: {
    fontSize: 16,
  },
})

export default CarouselCard
