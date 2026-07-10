import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { normalizeImageUrl } from "../utils/image"
import { HORIZONTAL_CARD_WIDTH, OFFER_CARD_HEIGHT } from "../constants/layout"

const OfferCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.offerCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.offerCardImageContainer}>
        <Image source={{ uri: normalizeImageUrl(item.image) }} style={styles.offerCardImage} />
        <View style={styles.offerPointsBadge}>
          <Text style={styles.offerPointsText}>{item.points}</Text>
        </View>
      </View>
      <View style={styles.offerCardContent}>
        <Text style={styles.offerCardCompany}>{item.company}</Text>
        <Text style={styles.offerCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.offerClaimedContainer}>
          <View style={styles.offerClaimedAvatars}>
            <View style={[styles.attendeeAvatar, { backgroundColor: "#FF6B6B" }]} />
            <View style={[styles.attendeeAvatar, { backgroundColor: "#4ECDC4", marginLeft: -8 }]} />
            <View style={[styles.attendeeAvatar, { backgroundColor: "#45B7D1", marginLeft: -8 }]} />
          </View>
          <Text style={styles.offerClaimedText}>
            {item.claimedCount} {item.claimedText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  offerCard: {
    flexDirection: "row",
    backgroundColor: "#3A3A3A",
    borderRadius: 15,
    marginRight: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    height: OFFER_CARD_HEIGHT,
    width: HORIZONTAL_CARD_WIDTH,
  },
  offerCardImageContainer: {
    width: "35%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#2D1B69",
  },
  offerCardImage: {
    width: "90%",
    height: "90%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  offerPointsBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  offerPointsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  offerCardContent: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  offerCardCompany: {
    color: "#B8B8B9",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  offerCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  offerClaimedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerClaimedAvatars: {
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
  offerClaimedText: {
    color: "#B8B8B9",
    fontSize: 12,
  },
})

export default OfferCard
