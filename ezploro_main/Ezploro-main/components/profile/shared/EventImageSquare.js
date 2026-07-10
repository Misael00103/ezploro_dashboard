import React from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const windowWidth = Dimensions.get("window").width;

const EventImageSquare = ({ item, darkMode, onPress, onAction, actionType = "like", liked, views }) => {
  const normalizeImageUrl = (url) => {
    if (!url || url === "null" || url === "undefined") return null;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const cleanUrl = url.replace(/http:\/\/localhost:3000http:\/\//, "http://");
        return cleanUrl;
      }
      const cleanPath = url.replace(/^\//, "");
      return `${process.env.REACT_APP_BACKEND_URL}/${cleanPath}`;
    } catch (error) {
      console.error("Error normalizing image URL:", error);
      return null;
    }
  };

  const imageUrl = normalizeImageUrl(item.event_image || item.image || "/placeholder.svg?height=300&width=300");

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.eventCard, darkMode && styles.eventCardDark]}
    >
      <Image source={{ uri: imageUrl }} style={styles.eventImage} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.eventOverlay}>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title || "Untitled Event"}
          </Text>
          <View style={styles.eventActions}>
            <TouchableOpacity onPress={onAction} style={styles.eventActionButton}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={20}
                color={liked ? "#FF6B6B" : "#fff"}
              />
              <Text style={styles.eventActionText}>{item.likes || 0}</Text>
            </TouchableOpacity>
            <View style={styles.eventStats}>
              <Ionicons name="eye" size={16} color="#fff" />
              <Text style={styles.eventStatsText}>{views || item.views || "0"}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    width: (windowWidth - 40) / 2,
    aspectRatio: 0.8,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventCardDark: {
    backgroundColor: "#333644",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 12,
  },
  eventContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  eventActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  eventStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventStatsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default EventImageSquare;