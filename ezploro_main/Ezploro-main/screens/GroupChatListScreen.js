"use client";
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
  ActivityIndicator, // Added for potential loading state if fetching from API later
  Alert, // Added for potential error alerts if fetching from API later
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { normalizeImageUrl } from "../utils/image";
import { useTheme } from "../context/ThemeContext";
// If you will fetch group chats from an API:
// import { useEffect, useState, useCallback } from "react";
// import { API_URL_GROUP_CHATS, BASE_URL_IMAGE } from '../config'; // Example API URL
// import { useAuth } from "../context/AuthContext"; // If authentication is needed for fetching

// Dummy data for now. If you fetch from an API, this will be removed.
const GROUP_CHATS = [
  {
    id: "1",
    title: "Super Party",
    lastMessage: "Hey everyone! Don't forget to bring your dancing shoes 💃",
    lastMessageTime: "2:30 PM",
    participants: 25,
    // Using Unsplash URLs for now, but if from backend, would be relative paths
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    unreadCount: 3,
  },
  {
    id: "2",
    title: "Beach Volleyball",
    lastMessage: "Weather looks perfect for tomorrow!",
    lastMessageTime: "1:15 PM",
    participants: 12,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    unreadCount: 0,
  },
  {
    id: "3",
    title: "Music Festival",
    lastMessage: "The lineup just got announced! 🎵",
    lastMessageTime: "11:45 AM",
    participants: 48,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    unreadCount: 7,
  },
  {
    id: "4",
    title: "Food Truck Rally",
    lastMessage: "Anyone tried the new taco truck?",
    lastMessageTime: "Yesterday",
    participants: 18,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
    unreadCount: 1,
  },
];

export default function GroupChatListScreen({ navigation }) {
  const { darkMode } = useTheme();
  // If fetching from API:
  // const { user } = useAuth(); // Uncomment if authentication is needed for fetching
  // const [groupChats, setGroupChats] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(null);

  // Helper to construct full image URLs (if you were fetching images from your backend)
  // const getFullImageUrl = useCallback((relativePath) => {
  //   if (!relativePath) {
  //     return null;
  //   }
  //   const cleanRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  //   return `${BASE_URL_IMAGE}/${cleanRelativePath}`;
  // }, []);

  // Example of fetching group chats from an API (uncomment and adapt when ready)
  /*
  useEffect(() => {
    const fetchGroupChats = async () => {
      setIsLoading(true);
      setError(null);
      if (!user || !user.token) { // Example: If user token is needed for auth
        setError("Authentication required to load group chats.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(API_URL_GROUP_CHATS, {
          headers: {
            'Authorization': `Bearer ${user.token}`, // Example authorization
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGroupChats(data);
      } catch (err) {
        console.error("Failed to fetch group chats:", err);
        setError(`Failed to load group chats: ${err.message}. Please try again.`);
        Alert.alert("Error", `Failed to load group chats: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupChats();
    // Optional: Add polling if group chat list needs frequent updates
    // const interval = setInterval(fetchGroupChats, 10000);
    // return () => clearInterval(interval);
  }, [user]); // Re-fetch if user changes
  */

  const renderGroupChat = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatCard, darkMode && { backgroundColor: "#23262F" }]}
      onPress={() => navigation.navigate("ChatScreen", { event: item })}
    >
      {/*
        If item.image comes from your backend as a relative path,
        you'll need to use getFullImageUrl like this:
        <Image source={{ uri: getFullImageUrl(item.image) || 'PLACEHOLDER_URL' }} style={styles.chatImage} />
        For now, with Unsplash, it's fine as is.
      */}
      <Image source={{ uri: normalizeImageUrl(item.image) }} style={styles.chatImage} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, darkMode && { color: "#fff" }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.chatTime, darkMode && { color: "#888" }]}>{item.lastMessageTime}</Text>
        </View>
        <Text style={[styles.lastMessage, darkMode && { color: "#888" }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <View style={styles.chatFooter}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={[styles.participantsText, darkMode && { color: "#888" }]}>{item.participants} members</Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && { backgroundColor: "#181A20" }]}>
      <View style={[styles.container, darkMode && { backgroundColor: "#181A20" }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#222"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && { color: "#fff" }]}>Group Chats</Text>
        </View>

        {/* If you add API fetching, you would show loading/error states here */}
        {/*
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={[styles.loadingText, darkMode && { color: "#fff" }]}>Loading group chats...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGroupChats}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : groupChats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={[styles.emptyTitle, darkMode && { color: "#fff" }]}>No group chats found</Text>
            <Text style={[styles.emptySubtitle, darkMode && { color: "#888" }]}>Create a new event to start a group chat!</Text>
          </View>
        ) : (
          <FlatList
            data={groupChats} // Use fetched data
            keyExtractor={(item) => item.id}
            renderItem={renderGroupChat}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        */}

        {/* For now, using static GROUP_CHATS */}
        <FlatList
          data={GROUP_CHATS}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupChat}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  chatCard: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    marginBottom: 8,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: "#888",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantsText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: "#4F8EF7",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Add styles for loading/error states if you uncomment the API fetching logic
  // loadingContainer: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // loadingText: {
  //   marginTop: 16,
  //   fontSize: 16,
  //   color: "#888",
  // },
  // errorContainer: {
  //   backgroundColor: "#ffebee",
  //   margin: 16,
  //   padding: 16,
  //   borderRadius: 8,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  // },
  // errorText: {
  //   color: "#c62828",
  //   flex: 1,
  // },
  // retryButton: {
  //   backgroundColor: "#4F8EF7",
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 4,
  // },
  // retryText: {
  //   color: "#fff",
  //   fontWeight: "bold",
  // },
  // emptyState: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   paddingHorizontal: 40,
  // },
  // emptyTitle: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   color: "#222",
  //   marginTop: 20,
  //   marginBottom: 8,
  // },
  // emptySubtitle: {
  //   fontSize: 16,
  //   color: "#888",
  //   textAlign: "center",
  // },
});