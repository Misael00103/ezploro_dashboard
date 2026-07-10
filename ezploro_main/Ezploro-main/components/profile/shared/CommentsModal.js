import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const windowWidth = Dimensions.get("window").width;

const CommentsModal = ({
  visible,
  onClose,
  darkMode,
  selectedPost,
  likedPosts,
  postViews,
  postComments,
  newComment,
  setNewComment,
  onToggleLike,
  onSendComment,
  currentUser,
  normalizeImageUrl,
}) => {
  if (!selectedPost) return null;

  const imageUrl = normalizeImageUrl 
    ? normalizeImageUrl(selectedPost.image || selectedPost.cover_image || "/placeholder.svg?height=400&width=400")
    : selectedPost.image || selectedPost.cover_image;

  const postId = selectedPost.post_id || selectedPost.id;
  const isLiked = likedPosts?.has ? likedPosts.has(postId) : likedPosts?.includes(postId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.instagramModalOverlay}>
        <View style={[styles.instagramModalContainer, darkMode && { backgroundColor: "#23243a" }]}>
          <View style={styles.instagramModalHeader}>
            <Text style={[styles.instagramModalTitle, darkMode && { color: "#fff" }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.instagramCloseButton}>
              <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: imageUrl }}
            style={styles.instagramPostImage}
            resizeMode="cover"
          />

          <View style={styles.instagramPostActions}>
            <TouchableOpacity onPress={() => onToggleLike(postId)} style={styles.instagramActionButton}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? "#FF6B6B" : (darkMode ? "#fff" : "#000")}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.instagramActionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.instagramActionButton}>
              <Ionicons name="paper-plane-outline" size={24} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <View style={styles.instagramLikesSection}>
            <Text style={[styles.instagramLikesText, darkMode && { color: "#fff" }]}>
              {selectedPost.likes || 0} likes
            </Text>
            {postViews && postViews[postId] !== undefined && (
              <Text style={styles.instagramViewsText}>
                {postViews[postId]} views
              </Text>
            )}
          </View>

          <View style={styles.instagramCaptionSection}>
            <Text style={[styles.instagramCaptionText, darkMode && { color: "#fff" }]}>
              <Text style={[styles.instagramCaptionUser, darkMode && { color: "#fff" }]}>
                {selectedPost.user?.display_name || selectedPost.username || "Unknown"}{" "}
              </Text>
              {selectedPost.description || selectedPost.title}
            </Text>
          </View>

          <FlatList
            data={postComments}
            keyExtractor={(item, index) =>
              item.comment_id?.toString() || item.id?.toString() || `comment-${index}`
            }
            renderItem={({ item }) => {
              // Debug: log de la estructura del comentario
              console.log('🔍 Estructura del comentario:', item);
              
              // Intentar diferentes formatos de usuario
              const userName = item.user?.display_name || 
                              item.user?.username || 
                              item.user?.name || 
                              item.display_name || 
                              item.username || 
                              "Unknown";
              
              return (
                <View style={styles.instagramCommentItem}>
                  <View style={styles.instagramCommentAvatar}>
                    <Text style={styles.instagramCommentAvatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.instagramCommentContent}>
                    <Text style={[styles.instagramCommentText, darkMode && { color: "#fff" }]}>
                      <Text style={[styles.instagramCommentUser, darkMode && { color: "#fff" }]}>
                        {userName}{" "}
                      </Text>
                      {item.content || item.text}
                    </Text>
                    <View style={styles.instagramCommentActions}>
                      <Text style={styles.instagramCommentTime}>2h</Text>
                      <TouchableOpacity style={styles.instagramReplyButton}>
                        <Text style={styles.instagramReplyText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.instagramCommentLike}>
                    <Ionicons name="heart-outline" size={12} color="#999" />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.instagramNoComments, darkMode && { color: "#666" }]}>
                No comments yet. Be the first to comment!
              </Text>
            }
            style={styles.instagramCommentsList}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={[
              styles.instagramCommentInputContainer,
              darkMode && { borderTopColor: "#333", backgroundColor: "#23243a" },
            ]}
          >
            <View style={styles.instagramInputAvatar}>
              <Text style={styles.instagramInputAvatarText}>
                {(currentUser?.display_name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor={darkMode ? "#888" : "#999"}
              style={[styles.instagramCommentInput, darkMode && styles.instagramCommentInputDark]}
              multiline
            />
            <TouchableOpacity
              onPress={onSendComment}
              style={[
                styles.instagramSendButton,
                !newComment.trim() && styles.instagramSendButtonDisabled,
              ]}
              disabled={!newComment.trim()}
            >
              <Text
                style={[
                  styles.instagramSendText,
                  !newComment.trim() && styles.instagramSendTextDisabled,
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  instagramModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  instagramModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "95%",
  },
  instagramModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  instagramModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  instagramCloseButton: {
    padding: 4,
  },
  instagramPostImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  instagramPostActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  instagramActionButton: {
    marginRight: 16,
    padding: 4,
  },
  instagramLikesSection: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  instagramLikesText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  instagramViewsText: {
    fontSize: 12,
    color: "#666",
  },
  instagramCaptionSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  instagramCaptionText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 18,
  },
  instagramCaptionUser: {
    fontWeight: "600",
    color: "#000",
  },
  instagramCommentsList: {
    flex: 1,
    paddingHorizontal: 16,
    maxHeight: 300,
  },
  instagramCommentItem: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  instagramCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  instagramCommentAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  instagramCommentContent: {
    flex: 1,
  },
  instagramCommentText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 18,
  },
  instagramCommentUser: {
    fontWeight: "600",
    color: "#000",
  },
  instagramCommentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  instagramCommentTime: {
    fontSize: 12,
    color: "#999",
    marginRight: 12,
  },
  instagramReplyButton: {
    marginRight: 12,
  },
  instagramReplyText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  instagramCommentLike: {
    padding: 4,
    marginLeft: 8,
  },
  instagramNoComments: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  instagramCommentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  instagramInputAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  instagramInputAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  instagramCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    backgroundColor: "#f8f8f8",
    color: "#000",
  },
  instagramCommentInputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
  },
  instagramSendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instagramSendButtonDisabled: {
    opacity: 0.5,
  },
  instagramSendText: {
    color: "#0095f6",
    fontSize: 14,
    fontWeight: "600",
  },
  instagramSendTextDisabled: {
    color: "#999",
  },
});

export default CommentsModal;
