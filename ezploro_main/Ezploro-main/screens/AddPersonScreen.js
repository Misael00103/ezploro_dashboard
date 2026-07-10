"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import { useGuestRestrictions } from "../hooks/useGuestRestrictions"
import { normalizeImageUrl } from '../utils/image';
import userFilterService from '../services/userFilterService';
import { ChatAvatar } from '../components/chat/ChatAvatar';
import {
  API_URL_USERS_LIST,
  API_URL_FRIEND_REQUEST_TOGGLE,
  API_URL_FRIEND_REQUEST_ACCEPT,
  API_URL_FRIEND_REQUEST_SENT,
  API_URL_FRIEND_REQUEST_RECEIVED,
} from '../config';

// Consistent color palette with CreateGroupScreen
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#1a1a1a';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';
const DIVIDER_COLOR_DARK = '#3A3F47';

const COLORS = {
  background: BACKGROUND_DARK,
  surface: CARD_BACKGROUND_DARK,
  card: CARD_BACKGROUND_DARK,
  text: TEXT_PRIMARY_DARK,
  textSecondary: TEXT_SECONDARY_DARK,
  border: DIVIDER_COLOR_DARK,
  accent: PRIMARY_COLOR,
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  purple: "#AF52DE",
  pink: "#FF2D92",
  orange: "#FF9500",
  green: "#30D158",
  blue: PRIMARY_COLOR,
  indigo: "#5856D6",
  teal: "#5AC8FA",
  yellow: "#FFCC00",
}

// Predefined colors for user avatars
const AVATAR_COLORS = [PRIMARY_COLOR, "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]

export default function AddPersonScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user, token } = useAuth()
  const { getAllUsers, searchUsers, loading, error } = useChat()
  const { restrictedActions } = useGuestRestrictions()

  // Verificar restricciones de invitado al cargar la pantalla
  useEffect(() => {
    if (restrictedActions.addFriend(navigation)) {
      return
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [friendships, setFriendships] = useState({})
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [failedImages, setFailedImages] = useState(new Set())

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const userData = await getAllUsers()
      // Filter out current user
      const otherUsers = userData.filter((u) => u.user_id !== user.user_id)
      
      // Filter out blocked users
      const filteredUsers = await userFilterService.filterSearchResults(user.user_id, otherUsers)
      
      setUsers(filteredUsers)
      setFilteredUsers(filteredUsers)
      
      // Fetch friendship status for each user
      await fetchFriendshipStatus(filteredUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      Alert.alert("Error", "Failed to load users. Please check your connection.")
    }
  }, [user.user_id])

  // Fetch friendship status for all users - OPTIMIZED
  const fetchFriendshipStatus = useCallback(async (userList) => {
    try {
      // Fetch all friend requests in parallel (only once)
      const [sentRequests, receivedRequests] = await Promise.all([
        fetchSentFriendRequests(),
        fetchReceivedFriendRequests()
      ])
      
      const friendshipData = {}
      
      // Process all users at once
      userList.forEach(userData => {
        const isSent = sentRequests.some(req => 
          req.receiver_id === userData.user_id || req.receiverId === userData.user_id
        )
        
        const isReceived = receivedRequests.some(req => 
          req.sender_id === userData.user_id || req.senderId === userData.user_id
        )
        
        if (isSent) {
          friendshipData[userData.user_id] = 'sent'
        } else if (isReceived) {
          friendshipData[userData.user_id] = 'received'
        } else {
          friendshipData[userData.user_id] = 'none'
        }
      })
      
      setFriendships(friendshipData)
    } catch (error) {
      console.error("Error fetching friendship status:", error)
    }
  }, [])

  // Fetch sent friend requests
  const fetchSentFriendRequests = useCallback(async () => {
    try {
      const response = await fetch(API_URL_FRIEND_REQUEST_SENT, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : (data?.data || [])
      }
      return []
    } catch (error) {
      console.error("Error fetching sent requests:", error)
      return []
    }
  }, [token])

  // Fetch received friend requests
  const fetchReceivedFriendRequests = useCallback(async () => {
    try {
      const response = await fetch(API_URL_FRIEND_REQUEST_RECEIVED, {
        headers: {
          'Authorization': `Bearer ${token}`,
          status: 'pending'
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : (data?.data || [])
      }
      return []
    } catch (error) {
      console.error("Error fetching received requests:", error)
      return []
    }
  }, [token])

  // Send friend request
  const sendFriendRequest = async (receiverId) => {
    try {
      console.log('Sending friend request to:', receiverId)
      console.log('API URL:', API_URL_FRIEND_REQUEST_TOGGLE)
      console.log('Full URL:', `${API_URL_FRIEND_REQUEST_TOGGLE}`)
      console.log('User token:', token ? 'Token exists' : 'No token')
      
      const response = await fetch(API_URL_FRIEND_REQUEST_TOGGLE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId }),
      })
      
      console.log('Response status:', response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Success response:', responseData)
        setFriendships(prev => ({ ...prev, [receiverId]: 'sent' }))
        Alert.alert("Success", "Friend request sent!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log('Error response:', errorData)
        Alert.alert("Error", errorData.message || "Failed to send friend request")
      }
    } catch (error) {
      console.error("Error sending friend request:", error)
      Alert.alert("Error", "Failed to send friend request")
    }
  }

  // Accept friend request
  const acceptFriendRequest = async (senderId) => {
    try {
      const response = await fetch(API_URL_FRIEND_REQUEST_ACCEPT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senderId }),
      })

      if (response.ok) {
        setFriendships(prev => ({ ...prev, [senderId]: 'friends' }))
        Alert.alert("Success", "Friend request accepted!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        Alert.alert("Error", errorData.message || "Failed to accept friend request")
      }
    } catch (error) {
      console.error("Error accepting friend request:", error)
      Alert.alert("Error", "Failed to accept friend request")
    }
  }

  // Check if user is online (simplified - you can implement real-time logic)
  const isUserOnline = (userData) => {
    if (userData.is_online) return true
    if (userData.last_active) {
      const lastActive = new Date(userData.last_active)
      const now = new Date()
      const diffMinutes = (now - lastActive) / (1000 * 60)
      return diffMinutes < 5 // Consider online if active in last 5 minutes
    }
    return false
  }

  // Get user initials for avatar placeholder
  const getUserInitials = (name, lastname) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : ""
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : ""
    return firstInitial + lastInitial || "U"
  }

  // Get avatar color based on user name
  const getAvatarColor = (name) => {
    const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      setSearchLoading(true)
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(
        (user) =>
          (user.name || '').toLowerCase().includes(query) ||
          (user.lastname || '').toLowerCase().includes(query) ||
          (user.username || '').toLowerCase().includes(query) ||
          (user.email || '').toLowerCase().includes(query),
      )
      setFilteredUsers(filtered)
      setSearchLoading(false)
    }
  }, [searchQuery, users])

  const startChat = async (selectedUser) => {
    try {
      console.log("[AddPersonScreen] Starting chat with user:", selectedUser)
      
      // Crear un objeto recipient completo con toda la información disponible
      const recipient = {
        id: selectedUser.user_id,
        user_id: selectedUser.user_id,
        name: selectedUser.name || selectedUser.display_name || selectedUser.username || `User ${selectedUser.user_id}`,
        lastname: selectedUser.lastname || "",
        display_name: selectedUser.display_name || selectedUser.name || selectedUser.username || "",
        username: selectedUser.username || "",
        profile_picture: selectedUser.profile_picture || null,
        email: selectedUser.email || "",
        bio: selectedUser.bio || ""
      }
      
      console.log("[AddPersonScreen] Navigating with recipient:", recipient)
      
      navigation.navigate("PersonalChatScreen", {
        recipient: recipient,
        recipientId: selectedUser.user_id,
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      Alert.alert("Error", "Failed to start chat")
    }
  }

  const renderUserItem = ({ item }) => {
    const friendshipStatus = friendships[item.user_id] || 'none'
    const isOnline = isUserOnline(item)

    return (
      <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChat(item)}
      >
        <View style={styles.avatarContainer}>
          <ChatAvatar 
            userObj={{
              id: item.user_id,
              user_id: item.user_id,
              name: item.name,
              lastname: item.lastname,
              username: item.username,
              display_name: item.display_name,
              profile_picture: item.profile_picture
            }}
            size={50}
            backgroundColor={getAvatarColor(item.name)}
          />
          <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#30D158' : '#8E8E93' }]} />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.name} {item.lastname}
          </Text>
          <Text style={styles.userEmail}>@{item.username || item.email}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
          {friendshipStatus !== 'none' && (
            <View style={styles.statusContainer}>
              <Text style={[styles.friendshipStatus, { color: getFriendshipStatusColor(friendshipStatus) }]}>
                {getFriendshipStatusText(friendshipStatus)}
          </Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          {friendshipStatus === 'none' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.addFriendButton]} 
              onPress={() => sendFriendRequest(item.user_id)}
            >
              <Ionicons name="person-add-outline" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          )}
          
          {friendshipStatus === 'received' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={() => acceptFriendRequest(item.user_id)}
            >
              <Ionicons name="checkmark-outline" size={18} color={COLORS.success} />
            </TouchableOpacity>
          )}
          
          {friendshipStatus === 'friends' && (
        <TouchableOpacity 
              style={[styles.actionButton, styles.chatButton]} 
              onPress={() => startChat(item)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent} />
        </TouchableOpacity>
          )}
          
          {friendshipStatus === 'sent' && (
            <View style={styles.sentIndicator}>
              <Ionicons name="time-outline" size={18} color="#FF9500" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const getFriendshipStatusColor = (status) => {
    switch (status) {
      case 'friends': return '#30D158'
      case 'sent': return '#FF9500'
      case 'received': return '#007AFF'
      default: return '#8E8E93'
    }
  }

  const getFriendshipStatusText = (status) => {
    switch (status) {
      case 'friends': return 'Friends'
      case 'sent': return 'Request Sent'
      case 'received': return 'Request Received'
      default: return ''
    }
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>
          {searchQuery ? "No users found" : loading ? "Loading users..." : "Search for people"}
      </Text>
        <Text style={styles.emptySubtitle}>
        {searchQuery
            ? "Try searching with a different name or email"
          : loading
              ? "Please wait while we load the users"
              : "Enter a name or email to find people to chat with"}
      </Text>
    </View>
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  if (loading && users.length === 0) {
    return (
      <View style={styles.blackContainer}>
        {/* Purple bubbles decoration */}
        <View style={styles.topBubble} />
        <View style={styles.bottomBubble} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Person</Text>
          </View>
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
        </View>
      </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Person</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, username or email..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchLoading && <ActivityIndicator size="small" color={COLORS.accent} />}
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.user_id.toString()}
            renderItem={renderUserItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#007AFF"]}
                tintColor="#fff"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#FF6B6B",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 12,
  },
     avatarContainer: {
     position: 'relative',
     marginRight: 12,
   },
   onlineIndicator: {
     position: 'absolute',
     bottom: 2,
     right: 2,
     width: 12,
     height: 12,
     borderRadius: 6,
     borderWidth: 2,
    borderColor: '#fff',
   },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.accent,
    marginBottom: 2,
    fontWeight: "500",
  },
  userBio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  friendshipStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addFriendButton: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  acceptButton: {
    borderColor: '#30D158',
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
  },
  chatButton: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  sentIndicator: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  topBubble: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    zIndex: 0,
  },
})
