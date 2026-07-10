import React, { useState } from "react"
import { View, Text, TouchableOpacity, Image, ScrollView, FlatList, TextInput } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

export const UserAvatar = ({ userObj, size = 100, onPress, darkMode = false }) => {
  const [imageError, setImageError] = useState(false)
  const avatarUri = userObj?.profile_picture || userObj?.avatar
  const initials = userObj?.display_name?.substring(0, 2).toUpperCase() || "U"
  const isOnline = !!userObj?.online_status
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={{ position: "relative" }}>
        {avatarUri && !imageError ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: darkMode ? "#333" : "#f0f0f0", borderWidth: 4, borderColor: "#6200EE" }}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#6200EE", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: darkMode ? "#333" : "#fff" }}>
            <Text style={{ color: "#fff", fontSize: size * 0.3, fontWeight: "bold" }}>{initials}</Text>
          </View>
        )}
        <View style={{ position: "absolute", bottom: 4, right: 4, width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125, backgroundColor: isOnline ? "#4CAF50" : "#9E9E9E", borderWidth: 2, borderColor: darkMode ? "#333" : "#fff" }} />
      </View>
    </TouchableOpacity>
  )
}

export const UserBanner = ({ user, onPress, disabled, style }) => {
  const [imageError, setImageError] = useState(false)
  const bannerUri = user?.banner_image || user?.banner || user?.cover_image
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled} style={[{ width: "100%", height: 200 }, style]}>
      {bannerUri && !imageError ? (
        <Image source={{ uri: bannerUri }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} onError={() => setImageError(true)} />
      ) : (
        <LinearGradient colors={["#6200EE", "#8E24AA"]} style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="camera-outline" size={32} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 8 }}>Add Cover Photo</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  )
}

export const ProfileTabs = ({ tabs, activeTab, onChange, accentColor = "#8B5CF6", darkMode = false }) => {
  return (
    <View style={{ backgroundColor: darkMode ? "#181A20" : "#fff", paddingVertical: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10 }}>
          {tabs?.map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => onChange?.(tab.key)} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: activeTab === tab.key ? (darkMode ? "#2a2d36" : "#f1ecff") : (darkMode ? "#111318" : "#f8f9fa"), gap: 8 }}>
              <Ionicons name={tab.icon} size={20} color={activeTab === tab.key ? accentColor : (darkMode ? "#aaa" : "#666")} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: activeTab === tab.key ? accentColor : (darkMode ? "#aaa" : "#666") }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export const ProfileStats = ({ followers, following, events, points, darkMode = false, onPressFollowers, onPressFollowing }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 24 }}>
    <TouchableOpacity onPress={onPressFollowers} style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>{followers}</Text>
      <Text style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666", marginTop: 4 }}>Followers</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onPressFollowing} style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>{following}</Text>
      <Text style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666", marginTop: 4 }}>Following</Text>
    </TouchableOpacity>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>{events}</Text>
      <Text style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666", marginTop: 4 }}>Events</Text>
    </View>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>{points ?? 0}</Text>
      <Text style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666", marginTop: 4 }}>Points</Text>
    </View>
  </View>
)

export const EmptyState = ({ activeTab, darkMode = false }) => {
  const map = {
    myEvents: { icon: "calendar-outline", label: "events created" },
    events: { icon: "calendar-outline", label: "events" },
    posts: { icon: "image-outline", label: "posts" },
    pastEvents: { icon: "time-outline", label: "past events" },
    subscribed: { icon: "heart-outline", label: "subscribed events" },
    subscribedEvents: { icon: "heart-outline", label: "subscribed events" },
  }
  const cfg = map[activeTab] || { icon: "ellipse-outline", label: "items" }
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
      <Ionicons name={cfg.icon} size={48} color={darkMode ? "#555" : "#ccc"} />
      <Text style={{ fontSize: 16, color: darkMode ? "#bbb" : "#666", marginTop: 12 }}>No {cfg.label} yet</Text>
    </View>
  )
}

export const EventImageSquare = ({ item, darkMode, onPress, onAction, liked, views = 0 }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ width: "48%", aspectRatio: 0.8, margin: 4, borderRadius: 16, overflow: "hidden", backgroundColor: darkMode ? "#333644" : "#fff" }}>
      <Image source={{ uri: item.cover_image || item.image || "/placeholder.svg?height=300&width=300" }} style={{ width: "100%", height: "100%" }} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={{ position: "absolute", inset: 0, justifyContent: "flex-end", padding: 12 }}>
        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }} numberOfLines={2}>{item.title || "Untitled Event"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={onAction} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#FF4757" : "#fff"} />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>{item.likes || 0}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>{views}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export const PostCard = ({ item, darkMode, isLiked, onLike, onComment, views = 0, normalizeImageUrl }) => (
  <View style={{ backgroundColor: darkMode ? "#333644" : "#fff", marginHorizontal: 10, marginVertical: 8, borderRadius: 16, overflow: "hidden" }}>
    <Image source={{ uri: normalizeImageUrl?.(item.image || "/placeholder.svg?height=300&width=300") }} style={{ width: "100%", height: 250 }} />
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: darkMode ? "#fff" : "#000", marginBottom: 8 }} numberOfLines={1}>{item.title || "Untitled Post"}</Text>
      <Text style={{ fontSize: 14, color: darkMode ? "#aaa" : "#666", lineHeight: 20, marginBottom: 8 }} numberOfLines={2}>{item.description || "No description"}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 4 }}>
        <Ionicons name="eye-outline" size={16} color="#666" />
        <Text style={{ fontSize: 12, color: "#666" }}>{views} views</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <TouchableOpacity onPress={() => onLike(item.post_id || item.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#FF6B6B" : "#8B5CF6"} />
          <Text style={{ fontSize: 14, color: "#8B5CF6", fontWeight: "500" }}>{item.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(item)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B5CF6" />
          <Text style={{ fontSize: 14, color: "#8B5CF6", fontWeight: "500" }}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)

export const CommentsModal = ({ visible, onClose, darkMode, selectedPost, likedPosts, postViews = {}, postComments = [], newComment, setNewComment, onToggleLike, onSendComment }) => (
  <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ display: visible ? "flex" : "none", position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
    <View style={{ backgroundColor: darkMode ? "#23243a" : "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "95%" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: darkMode ? "#fff" : "#000" }}>Comments</Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>
      {selectedPost && (
        <>
          <Image source={{ uri: selectedPost.image || selectedPost.cover_image || "/placeholder.svg?height=400&width=400" }} style={{ width: "100%", height: 250, backgroundColor: "#f0f0f0" }} resizeMode="cover" />
          <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8 }}>
            <TouchableOpacity onPress={() => onToggleLike(selectedPost.post_id)} style={{ marginRight: 16, padding: 4 }}>
              <Ionicons name={likedPosts?.has(selectedPost.post_id) ? "heart" : "heart-outline"} size={24} color={likedPosts?.has(selectedPost.post_id) ? "#FF3040" : (darkMode ? "#fff" : "#000")} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 4, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: darkMode ? "#fff" : "#000" }}>{selectedPost.likes || 0} likes</Text>
            <Text style={{ fontSize: 12, color: "#666" }}>{postViews[selectedPost.post_id] || 0} views</Text>
          </View>
          <FlatList
            data={postComments}
            keyExtractor={(item, index) => item.comment_id?.toString() || item.id?.toString() || `comment-${index}`}
            renderItem={({ item }) => (
              <View style={{ flexDirection: "row", paddingVertical: 8, alignItems: "flex-start", paddingHorizontal: 16 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#8B5CF6", justifyContent: "center", alignItems: "center", marginRight: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>{(item.user?.display_name || "U").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: darkMode ? "#fff" : "#000", lineHeight: 18 }}>
                    <Text style={{ fontWeight: "600", color: darkMode ? "#fff" : "#000" }}>{item.user?.display_name || "Unknown"} </Text>
                    {item.content || item.text}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: "center", color: "#999", fontSize: 14, paddingVertical: 20 }}>No comments yet. Be the first to comment!</Text>}
            style={{ flex: 1, maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          />
          <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0", backgroundColor: darkMode ? "#23243a" : "#fff" }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#8B5CF6", justifyContent: "center", alignItems: "center", marginRight: 8 }}>
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>U</Text>
            </View>
            <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor={darkMode ? "#888" : "#999"} style={{ flex: 1, borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 80, backgroundColor: darkMode ? "#333" : "#f8f8f8", color: darkMode ? "#fff" : "#000" }} multiline />
            <TouchableOpacity onPress={onSendComment} disabled={!newComment?.trim()} style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, opacity: newComment?.trim() ? 1 : 0.5 }}>
              <Text style={{ color: "#0095f6", fontSize: 14, fontWeight: "600" }}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </TouchableOpacity>
)

// Componentes compartidos
// re-exports eliminados: los componentes están definidos en este índice