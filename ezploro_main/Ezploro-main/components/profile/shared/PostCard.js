import React from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const windowWidth = Dimensions.get("window").width;
const ACCENT_COLOR = '#8B5CF6';

const PostCard = ({ item, darkMode, isLiked, onLike, onComment, views, normalizeImageUrl }) => {
  const imageUrl = normalizeImageUrl ? normalizeImageUrl(item.image || "/placeholder.svg?height=300&width=300") : item.image;

  return (
    <View style={[styles.postCard, darkMode && styles.postCardDark]}>
      <Image source={{ uri: imageUrl }} style={styles.postImage} />
      <View style={styles.postContent}>
        <Text style={[styles.postTitle, darkMode && styles.postTitleDark]} numberOfLines={1}>
          {item.title || "Untitled Post"}
        </Text>
        <Text style={[styles.postDescription, darkMode && styles.postDescriptionDark]} numberOfLines={2}>
          {item.description || "No description"}
        </Text>
        {views !== undefined && (
          <View style={styles.postViewsContainer}>
            <Ionicons name="eye" size={14} color="#666" />
            <Text style={styles.postViewsText}>{views} views</Text>
          </View>
        )}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={onLike} style={styles.postActionButton}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#FF6B6B" : ACCENT_COLOR} />
            <Text style={styles.postActionText}>{item.likes_count || item.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.postActionButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={ACCENT_COLOR} />
            <Text style={styles.postActionText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
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
    width: windowWidth - 20,
  },
  postCardDark: {
    backgroundColor: "#333644",
  },
  postImage: {
    width: "100%",
    height: 250,
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  postTitleDark: {
    color: "#fff",
  },
  postDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postDescriptionDark: {
    color: "#aaa",
  },
  postViewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  postViewsText: {
    fontSize: 12,
    color: "#666",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  postActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    color: ACCENT_COLOR,
    fontWeight: "500",
  },
});

export default PostCard;