import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Platform 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { normalizeImageUrl } from '../../utils/image'

const ChatHeader = ({ 
  title,
  subtitle,
  avatar,
  avatarColor,
  avatarInitials,
  onBack,
  onAvatarPress,
  onOptionsPress,
  darkMode = false,
  showOptions = true,
  isOnline = false,
  lastSeen
}) => {
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={darkMode ? "#1F2937" : "#FFFFFF"} 
      />
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={darkMode ? "#FFFFFF" : "#1F2937"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
        >
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image 
                source={{ uri: normalizeImageUrl(avatar) }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{avatarInitials}</Text>
              </View>
            )}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, darkMode && styles.titleDark]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, darkMode && styles.subtitleDark]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            {lastSeen && !isOnline && (
              <Text style={[styles.lastSeen, darkMode && styles.lastSeenDark]} numberOfLines={1}>
                Last seen {lastSeen}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {showOptions && (
          <TouchableOpacity 
            style={styles.optionsButton} 
            onPress={onOptionsPress}
          >
            <Ionicons 
              name="ellipsis-vertical" 
              size={20} 
              color={darkMode ? "#FFFFFF" : "#1F2937"} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  containerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  lastSeen: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  lastSeenDark: {
    color: '#6B7280',
  },
  optionsButton: {
    marginLeft: 12,
    padding: 4,
  },
})

export default ChatHeader