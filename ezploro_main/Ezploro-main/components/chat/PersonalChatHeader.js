import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ChatAvatar } from './ChatAvatar'

const COLORS = {
  text: '#fff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
}

const PersonalChatHeader = ({ 
  recipientName,
  recipientAvatar,
  recipientColor,
  recipientInitials,
  recipientId,
  recipientUsername,
  onBack,
  onOptionsPress,
  getImageUrl
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerInfo} onPress={onOptionsPress}>
        <ChatAvatar 
          userObj={{
            id: recipientId,
            user_id: recipientId,
            name: recipientName,
            username: recipientUsername,
            profile_picture: recipientAvatar
          }}
          size={40}
          backgroundColor={recipientColor}
          style={styles.headerAvatar}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{recipientName}</Text>
          <Text style={styles.headerSubtitle}>Tap for options</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerAction} onPress={onOptionsPress}>
        <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
})

export default PersonalChatHeader