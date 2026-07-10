import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { normalizeImageUrl } from '../../utils/image'

const ChatListItem = ({ 
  chat,
  onPress,
  onLongPress,
  darkMode = false,
  getAvatarColor,
  getUserInitials,
  getImageUrl,
  formatTime
}) => {
  const avatarColor = getAvatarColor ? getAvatarColor(chat.name) : '#8B5CF6'
  const initials = getUserInitials ? getUserInitials(chat.name, chat.lastname) : chat.name?.charAt(0)?.toUpperCase()
  const avatarImage = getImageUrl ? getImageUrl(chat.profile_picture) : null
  const lastMessageTime = formatTime ? formatTime(chat.lastMessageTime) : ''

  return (
    <TouchableOpacity
      style={[styles.container, darkMode && styles.containerDark]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {avatarImage ? (
          <Image source={{ uri: avatarImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        {chat.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, darkMode && styles.nameDark]} numberOfLines={1}>
            {chat.name} {chat.lastname || ''}
          </Text>
          {lastMessageTime && (
            <Text style={[styles.time, darkMode && styles.timeDark]}>
              {lastMessageTime}
            </Text>
          )}
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.lastMessage, 
              darkMode && styles.lastMessageDark,
              chat.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {typeof chat.lastMessage === 'string' 
              ? chat.lastMessage 
              : chat.lastMessage?.content || 'No messages yet'}
          </Text>
          
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.optionsButton}>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={darkMode ? "#6B7280" : "#9CA3AF"} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  nameDark: {
    color: '#FFFFFF',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timeDark: {
    color: '#6B7280',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  lastMessageDark: {
    color: '#9CA3AF',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsButton: {
    marginLeft: 8,
    padding: 4,
  },
})

export default ChatListItem