import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { normalizeImageUrl } from '../../utils/image'
import { ChatAvatar } from './ChatAvatar'

const PersonalMessageBubble = ({ 
  message, 
  isUser, 
  senderName, 
  avatarColor,
  initials,
  displayAvatar,
  senderUser,
  currentUser,
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
          <ChatAvatar 
            userObj={senderUser || message.sender}
            size={32}
            backgroundColor={avatarColor}
          />
        </TouchableOpacity>
      )}
      
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.otherBubble]}>
        {!isUser && <Text style={styles.senderName}>{senderName}</Text>}
        
        {message.image && Array.isArray(message.image) && message.image.length > 0 && (
          <Image 
            source={{ uri: normalizeImageUrl(message.image[0]) }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        {message.image && typeof message.image === 'string' && (
          <Image 
            source={{ uri: normalizeImageUrl(message.image) }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        {(message.content || message.message) && (
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
            {message.content || message.message}
          </Text>
        )}
        
        <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.otherMessageTime]}>
          {formatTime(message.created_at || message.createdAt)}
        </Text>
      </View>

      {isUser && (
        <View style={styles.avatarContainer}>
          <ChatAvatar 
            userObj={currentUser}
            size={32}
            backgroundColor={avatarColor}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    paddingHorizontal: 0,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  otherUserRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginHorizontal: 8,
  },

  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  userBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
    fontWeight: "500",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userMessageTime: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  otherMessageTime: {
    color: "rgba(255, 255, 255, 0.6)",
  },
})

export default PersonalMessageBubble