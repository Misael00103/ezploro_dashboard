import React, { useRef, useEffect } from 'react'
import { 
  FlatList, 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native'
import MessageBubble from './MessageBubble'

const MessagesList = ({ 
  messages = [],
  currentUserId,
  onUserPress,
  onRefresh,
  refreshing = false,
  loading = false,
  darkMode = false,
  autoScroll = true,
  getAvatarColor,
  getUserInitials,
  getImageUrl
}) => {
  const flatListRef = useRef(null)

  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length, autoScroll])

  const renderMessage = ({ item }) => {
    const isUser = String(item.sender?.id) === String(currentUserId)
    const senderName = item.sender?.name || item.sender?.display_name || item.sender?.username || "Usuario"
    const senderInitial = senderName.charAt(0).toUpperCase()
    const avatarColor = getAvatarColor ? getAvatarColor(senderName) : '#8B5CF6'
    const senderAvatar = getImageUrl ? getImageUrl(item.sender?.profile_picture) : null

    return (
      <MessageBubble
        message={item}
        isUser={isUser}
        senderName={senderName}
        senderInitial={senderInitial}
        senderAvatar={senderAvatar}
        avatarColor={avatarColor}
        onUserPress={() => onUserPress && onUserPress(item.sender)}
        darkMode={darkMode}
      />
    )
  }

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, darkMode && styles.emptyContainerDark]}>
      <Text style={[styles.emptyText, darkMode && styles.emptyTextDark]}>
        No messages yet. Start the conversation!
      </Text>
    </View>
  )

  const renderFooter = () => {
    if (!loading) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    )
  }

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.contentContainer,
          messages.length === 0 && styles.emptyContentContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8B5CF6"]}
              tintColor="#8B5CF6"
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContainerDark: {
    backgroundColor: '#111827',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#9CA3AF',
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
})

export default MessagesList