"use client"
import { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { BASE_URL_IMAGE, BASE_URL, API_URL_USER_BLOCKED_LIST } from "../config"
import { normalizeImageUrl } from "../utils/image"
import userBlockService from "../services/userBlockService"
import { useUserBlock } from "../hooks/useUserBlock"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AVATAR_COLORS = ["#007AFF", "#30D158", "#AF52DE", "#FF2D92", "#FF9500", "#5AC8FA", "#5856D6", "#FFCC00"]

export default function BlockedUsersScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user, token } = useAuth()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { unblockUser: unblockUserHook } = useUserBlock()

  const getAvatarColor = (name) => {
    const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
    return AVATAR_COLORS[index]
  }

  const fetchBlockedUsers = async () => {
    try {
      if (!refreshing) setLoading(true)

      if (!token) {
        console.error("No token available")
        return
      }

      console.log("🔍 Fetching blocked users for user ID:", user.user_id)

      // Use correct API endpoint from config
      const url = API_URL_USER_BLOCKED_LIST.replace(':user_id', user.user_id)
      console.log("🔗 Making request to:", url)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()
      console.log("📥 Blocked users result:", result)

      if (result && Array.isArray(result.blocked_users)) {
        setBlockedUsers(result.blocked_users)
      } else if (Array.isArray(result)) {
        setBlockedUsers(result)
      } else {
        setBlockedUsers([])
      }
    } catch (error) {
      console.error("❌ Error fetching blocked users:", error)
      Alert.alert("Error", "Failed to load blocked users. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchBlockedUsers()
  }

  const unblockUser = async (blockedUserId) => {
    Alert.alert(
      "Unblock User",
      "Are you sure you want to unblock this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert("Error", "No authentication token available")
                return
              }

              // Use the hook for consistency
              const success = await unblockUserHook(blockedUserId, () => {
                // Remove user from local state on success
                setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== blockedUserId))
              })

            } catch (error) {
              console.error("❌ Error unblocking user:", error)
              Alert.alert("Error", `Failed to unblock user: ${error.message}`)
            }
          },
        },
      ]
    )
  }

  const renderBlockedUser = ({ item }) => {
    const user = item.blocked_user || item
    const userName = user?.display_name || user?.name || user?.username || "Unknown User"
    const userHandle = user?.username || "unknown"
    const avatarColor = getAvatarColor(userName)

    return (
      <View style={[styles.userCard, darkMode && styles.userCardDark]}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {user?.profile_picture ? (
              <Image
                source={{ uri: normalizeImageUrl(user.profile_picture) }}
                style={styles.avatarImage}
                onError={() => console.log('Avatar load error for blocked user')}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, darkMode && styles.userNameDark]}>
              {userName}
            </Text>
            <Text style={[styles.userHandle, darkMode && styles.userHandleDark]}>
              @{userHandle}
            </Text>
            {item.reason && (
              <Text style={[styles.blockReason, darkMode && styles.blockReasonDark]}>
                Reason: {item.reason}
              </Text>
            )}
            <Text style={[styles.blockDate, darkMode && styles.blockDateDark]}>
              Blocked: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => unblockUser(item.blocked_user_id)}
        >
          <Text style={styles.unblockButtonText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <LinearGradient
      colors={darkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blocked Users</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading blocked users...</Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUser}
              keyExtractor={(item) => item.block_id?.toString() || item.blocked_user_id?.toString()}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                  colors={["#fff"]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="person-remove-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.emptyText}>No blocked users</Text>
                  <Text style={styles.emptySubtext}>Users you block will appear here</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  listContainer: { padding: 16 },
  userCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12,
    padding: 16, marginBottom: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 2 },
  userHandle: { fontSize: 14, color: "rgba(255, 255, 255, 0.7)", marginBottom: 4 },
  blockReason: { fontSize: 12, color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" },
  blockDate: { fontSize: 11, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 },
  unblockButton: { backgroundColor: "#FF5722", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  unblockButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "rgba(255, 255, 255, 0.7)", marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "rgba(255, 255, 255, 0.5)", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 16, fontSize: 16 },
})