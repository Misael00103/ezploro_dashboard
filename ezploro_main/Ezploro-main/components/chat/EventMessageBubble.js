import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { normalizeImageUrl } from '../../utils/image'

const EventMessageBubble = ({ 
  message, 
  isUser, 
  senderName, 
  senderInitial,
  onUserPress 
}) => {
  const formatTime = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (error) {
      return ""
    }
  }

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.otherUserRow]}>
      {!isUser && (
        <TouchableOpacity onPress={onUserPress} style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{senderInitial}</Text>
          </View>
        </TouchableOpacity>
      )}
      
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.otherBubble]}>
        {!isUser && <Text style={styles.senderName}>{senderName}</Text>}
        
        {message.image && (
          <Image 
            source={{ uri: normalizeImageUrl(message.image) }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.messageText}>
          {message.content || message.message}
        </Text>
        
        <Text style={styles.messageTime}>
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  otherUserRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    textAlign: "right",
  },
})

export default EventMessageBubble