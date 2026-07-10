import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { normalizeImageUrl } from '../../utils/image'

const MessageBubble = ({ 
  message, 
  isUser, 
  senderName, 
  senderInitial, 
  senderAvatar,
  avatarColor,
  onUserPress,
  darkMode = false 
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
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.otherMessage]}>
      {!isUser && (
        <TouchableOpacity onPress={onUserPress} style={styles.avatarContainer}>
          {senderAvatar ? (
            <Image source={{ uri: normalizeImageUrl(senderAvatar) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{senderInitial}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.otherBubble,
        darkMode && (isUser ? styles.userBubbleDark : styles.otherBubbleDark)
      ]}>
        {!isUser && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        
        {message.image && (
          <Image 
            source={{ uri: normalizeImageUrl(message.image) }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.otherMessageText,
          darkMode && (isUser ? styles.userMessageTextDark : styles.otherMessageTextDark)
        ]}>
          {message.content || message.message}
        </Text>
        
        <Text style={[
          styles.messageTime,
          isUser ? styles.userMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userBubbleDark: {
    backgroundColor: '#7C3AED',
  },
  otherBubbleDark: {
    backgroundColor: '#374151',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  userMessageTextDark: {
    color: '#FFFFFF',
  },
  otherMessageTextDark: {
    color: '#F9FAFB',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
})

export default MessageBubble