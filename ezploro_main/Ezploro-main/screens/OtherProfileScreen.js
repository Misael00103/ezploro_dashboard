import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    API_URL_EVENTS,
    API_URL_FOLLOW_FOLLOW,
    API_URL_FOLLOW_FOLLOWERS_COUNT,
    API_URL_FOLLOW_FOLLOWING_COUNT,
    API_URL_FOLLOW_UNFOLLOW,
    API_URL_FRIEND_REQUEST_ACCEPT,
    API_URL_FRIEND_REQUEST_RECEIVED,
    API_URL_FRIEND_REQUEST_REJECT,
    API_URL_FRIEND_REQUEST_SENT,
    API_URL_FRIEND_REQUEST_TOGGLE,
    API_URL_POSTS_BY_USER,
    API_URL_POST_COMMENTS_BY_POST,
    API_URL_POST_COMMENTS_CREATE,
    API_URL_POST_LIKES_TOGGLE,
    API_URL_PRIVATE_MESSAGES_CREATE,
    API_URL_USERS_BY_ID,
    API_URL_USERS_SUBSCRIBED_EVENTS,
    BASE_URL_IMAGE
} from "../config";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventContext";
import { useTheme } from "../context/ThemeContext";
import { useGuestRestrictions } from "../hooks/useGuestRestrictions";
import userBlockService from "../services/userBlockService";
import userFilterService from "../services/userFilterService";

// Import components
import {
    MessageModal,
    ProfileHeaderOther,
} from '../components/profile/other';
import {
    CommentsModal,
    EmptyState,
    EventImageSquare,
    PostCard,
    ProfileTabs,
    UserAvatar,
    UserBanner,
} from '../components/profile/shared';

const ACCENT_COLOR = '#8B5CF6';
const CARD_BACKGROUND_DARK = '#1F222A';

const TABS = [
  { key: "events", icon: "grid-outline", label: "Events" },
  { key: "posts", icon: "images-outline", label: "Posts" },
  { key: "pastEvents", icon: "time-outline", label: "Past Events" },
  { key: "subscribed", icon: "calendar-outline", label: "Subscribed" },
];

const windowWidth = Dimensions.get("window").width;

export default function OtherProfileScreen({ route, navigation }) {
  const { darkMode } = useTheme();
  const { user: currentUser } = useAuth();
  const { userId } = route.params;
  const { likedEvents } = useEvents();
  const { restrictedActions } = useGuestRestrictions();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [subscribedEvents, setSubscribedEvents] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [commentModal, setCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentFriendRequest, setHasSentFriendRequest] = useState(false);
  const [hasReceivedFriendRequest, setHasReceivedFriendRequest] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);

  const fetchBlockStatus = useCallback(async () => {
    if (!currentUser?.user_id || !userId) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const result = await userBlockService.checkMutualBlock(token, currentUser.user_id, userId);
      setIsBlocked(result.user1BlockedUser2);
      setHasBlockedMe(result.user2BlockedUser1);
      setBlockInfo(result.blockInfo);
    } catch (error) {
      console.warn("⚠️ Could not check block status:", error);
    }
  }, [currentUser?.user_id, userId]);

  const handleBlockUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token available");
        return;
      }
      Alert.alert(
        "Block User",
        `Are you sure you want to block ${user?.display_name || user?.username || "this user"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block User",
            style: "destructive",
            onPress: async () => {
              try {
                await userBlockService.blockUser(token, currentUser.user_id, userId, "Blocked from profile");
                setIsBlocked(true);
                userFilterService.addToBlockedCache(userId);
                userFilterService.clearCache();
                Alert.alert("User Blocked", "User has been blocked successfully.", [
                  { text: "OK", onPress: () => navigation.goBack() }
                ]);
              } catch (error) {
                Alert.alert("Error", `Failed to block user: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to block user");
    }
  };

  const handleUnblockUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token available");
        return;
      }
      Alert.alert(
        "Unblock User",
        `Are you sure you want to unblock ${user?.name || "this user"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unblock User",
            style: "default",
            onPress: async () => {
              try {
                await userBlockService.unblockUser(token, currentUser.user_id, userId);
                setIsBlocked(false);
                setBlockInfo(null);
                userFilterService.removeFromBlockedCache(userId);
                userFilterService.clearCache();
                Alert.alert("Success", "User unblocked successfully");
              } catch (error) {
                Alert.alert("Error", `Failed to unblock user: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to unblock user");
    }
  };

  const makeRequest = useCallback(
    async (url, options = {}, retries = 3, delay = 2000) => {
      const controller = new AbortController();
      const timeout = 10000;

      for (let i = 0; i < retries; i++) {
        try {
          const id = setTimeout(() => controller.abort(), timeout);
          const token = await AsyncStorage.getItem("token");
          if (!token && options.headers?.Authorization) {
            throw new Error("No authentication token found");
          }

          const response = await fetch(url, {
            ...options,
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              "Content-Type": "application/json",
              Accept: "application/json",
              ...options.headers,
            },
            signal: controller.signal,
          });
          clearTimeout(id);

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              if (response.status !== 404) {
                console.warn(`⚠️ No se pudo parsear la respuesta de error para ${url}`);
              }
            }
            if (response.status === 401) {
              await AsyncStorage.removeItem("token");
              navigation.navigate("Login");
              throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
            }
            throw new Error(errorMessage, { cause: `HTTP_${response.status}` });
          }

          const data = await response.json();
          if (data.success === false) {
            throw new Error(data.error || "Operation failed");
          }
          return data;
        } catch (error) {
          if (error.name === "AbortError") {
            if (i === retries - 1) {
              throw new Error("Tiempo de espera agotado", { cause: "AbortError" });
            }
          } else if (error.message.includes("Network request failed")) {
            if (i === retries - 1) {
              throw new Error("No se pudo conectar al servidor.", { cause: "NetworkError" });
            }
          } else if (error.cause?.startsWith("HTTP_4")) {
            throw error;
          } else {
            if (i === retries - 1) {
              throw error;
            }
          }

          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      throw new Error("No se pudo completar la solicitud después de los reintentos.");
    },
    [navigation]
  );

  const fetchFriendRequestStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const sentUrl = `${API_URL_FRIEND_REQUEST_SENT}?user_id=${currentUser.user_id}&status=pending`;
      const sentResponse = await makeRequest(sentUrl);
      const sentRequests = Array.isArray(sentResponse.data) ? sentResponse.data : [];
      setHasSentFriendRequest(sentRequests.some((req) => req.receiver_id === userId));

      const receivedUrl = `${API_URL_FRIEND_REQUEST_RECEIVED}?user_id=${currentUser.user_id}&status=pending`;
      const receivedResponse = await makeRequest(receivedUrl);
      const receivedRequests = Array.isArray(receivedResponse.data) ? receivedResponse.data : [];
      setHasReceivedFriendRequest(receivedRequests.some((req) => req.sender_id === userId));

      const acceptedUrl = `${API_URL_FRIEND_REQUEST_RECEIVED}?user_id=${currentUser.user_id}&status=accepted`;
      const acceptedResponse = await makeRequest(acceptedUrl);
      const acceptedRequests = Array.isArray(acceptedResponse.data) ? acceptedResponse.data : [];
      setIsFriend(acceptedRequests.some((req) => req.sender_id === userId || req.receiver_id === userId));
    } catch (error) {
      console.error("❌ Error fetching friend request status:", error);
    }
  }, [userId, currentUser?.user_id, makeRequest]);

  const fetchUserData = useCallback(async () => {
    setLoadingProfile(true);
    setError("");

    try {
      if (currentUser?.user_id === userId) {
        navigation.replace("ProfileScreen");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      let userProfile = null;
      try {
        const userData = await makeRequest(`${API_URL_USERS_BY_ID.replace(":userId", userId)}`);
        userProfile = userData.data || userData;
        setUser(userProfile);
      } catch (profileError) {
        if (profileError.cause?.includes("HTTP_404")) {
          throw new Error("Usuario no encontrado");
        } else if (profileError.cause?.includes("HTTP_401")) {
          await AsyncStorage.removeItem("token");
          throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
        } else {
          throw profileError;
        }
      }

      setIsFollowing(false);

      try {
        const eventsData = await makeRequest(`${API_URL_EVENTS}?organizer_id=${userId}`);
        const userEvents = Array.isArray(eventsData) ? eventsData : eventsData.events || eventsData.data || [];
        const createdEvents = userEvents.filter(event => 
          event.organizer_id === parseInt(userId) || 
          event.user_id === parseInt(userId) ||
          event.created_by === parseInt(userId)
        );
        setEvents(createdEvents);
      } catch (eventsError) {
        setEvents([]);
      }

      try {
        const postsData = await makeRequest(`${API_URL_POSTS_BY_USER.replace(":userId", userId)}`);
        const userPosts = Array.isArray(postsData.data) ? postsData.data : Array.isArray(postsData) ? postsData : [];
        setPosts(userPosts);
        console.log("✅ User posts loaded:", userPosts.length);
        
        // Inicializar likes de posts
        setLikedPosts([]);
      } catch (postsError) {
        console.log("⚠️ Could not load user posts:", postsError.message);
        setPosts([]);
        setLikedPosts([]);
      }

      if (userProfile?.show_subscribed_events !== false) {
        try {
          const subscribedData = await makeRequest(`${API_URL_USERS_SUBSCRIBED_EVENTS.replace(":userId", userId)}`);
          const subscribedEventsArray = Array.isArray(subscribedData)
            ? subscribedData
            : subscribedData.events || subscribedData.data || [];
          setSubscribedEvents(subscribedEventsArray);
          
          const today = new Date();
          const pastEventsArray = subscribedEventsArray.filter(event => {
            const eventEndDate = new Date(event.end_date_time || event.date_time || event.date);
            return eventEndDate < today;
          });
          setPastEvents(pastEventsArray);
        } catch (subscribedError) {
          setSubscribedEvents([]);
          setPastEvents([]);
        }
      } else {
        setSubscribedEvents([]);
        setPastEvents([]);
      }

      try {
        const followersData = await makeRequest(`${API_URL_FOLLOW_FOLLOWERS_COUNT.replace(":userId", userId)}`);
        setFollowersCount(followersData.data?.followers_count || 0);
      } catch (error) {
        setFollowersCount(userProfile.followers || 0);
      }

      try {
        const followingData = await makeRequest(`${API_URL_FOLLOW_FOLLOWING_COUNT.replace(":userId", userId)}`);
        setFollowingCount(followingData.data?.following_count || 0);
      } catch (error) {
        setFollowingCount(userProfile.following || 0);
      }

      await fetchFriendRequestStatus();
    } catch (error) {
      setError(error.message || "Error al cargar el perfil del usuario");

      if (error.message.includes("Sesión expirada") || error.cause?.includes("HTTP_401")) {
        setUser(null);
        navigation.navigate("Login");
      } else if (error.message.includes("Usuario no encontrado")) {
        setUser(null);
      }

      setEvents([]);
      setPosts([]);
      setSubscribedEvents([]);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId, currentUser?.user_id, makeRequest, navigation, fetchFriendRequestStatus]);

  useEffect(() => {
    const initializeProfile = async () => {
      if (!currentUser || !currentUser.user_id) {
        setError("Debes estar autenticado para ver perfiles");
        setLoadingProfile(false);
        return;
      }
      fetchUserData();
      fetchBlockStatus();
    };
    initializeProfile();
  }, [userId, currentUser, fetchUserData, fetchBlockStatus]);

  const handleFollowToggle = useCallback(async () => {
    if (!currentUser?.user_id) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const url = API_URL_FOLLOW_UNFOLLOW.replace(":followedId", userId);
        await makeRequest(url, { method: "DELETE" });
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await makeRequest(API_URL_FOLLOW_FOLLOW, {
          method: "POST",
          body: JSON.stringify({ followedId: parseInt(userId) }),
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      if (error.message.includes("Ya sigues a este usuario")) {
        setIsFollowing(true);
      } else if (error.message.includes("No sigues a este usuario")) {
        setIsFollowing(false);
      }
    } finally {
      setIsFollowLoading(false);
    }
  }, [userId, currentUser?.user_id, isFollowing, makeRequest]);

  const handleFriendRequestToggle = useCallback(async () => {
    try {
      if (!currentUser?.user_id) {
        Alert.alert("Error", "You need to be logged in");
        return;
      }
      const requestData = { receiverId: userId };
      await makeRequest(API_URL_FRIEND_REQUEST_TOGGLE, {
        method: "POST",
        body: JSON.stringify(requestData),
      });
      await fetchFriendRequestStatus();
      Alert.alert("Success", hasSentFriendRequest ? "Request cancelled" : "Request sent");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send/cancel request");
    }
  }, [userId, currentUser?.user_id, hasSentFriendRequest, fetchFriendRequestStatus, makeRequest]);

  const handleFriendRequestAction = useCallback(
    async (action) => {
      try {
        if (!currentUser?.user_id) {
          Alert.alert("Error", "You need to be logged in");
          return;
        }
        const url = action === "accept" ? API_URL_FRIEND_REQUEST_ACCEPT : API_URL_FRIEND_REQUEST_REJECT;
        await makeRequest(url, {
          method: "POST",
          body: JSON.stringify({ senderId: userId }),
        });
        await fetchFriendRequestStatus();
        Alert.alert("Success", `Friend request ${action}ed`);
      } catch (error) {
        Alert.alert("Error", error.message || `Failed to ${action} request`);
      }
    },
    [userId, currentUser?.user_id, fetchFriendRequestStatus, makeRequest]
  );

  const handleMessageUser = useCallback(async () => {
    if (restrictedActions.sendMessage && restrictedActions.sendMessage(navigation)) return;
    if (!currentUser?.user_id) {
      Alert.alert("Error", "You need to be logged in");
      return;
    }
    setMessageModal(true);
  }, [currentUser?.user_id, restrictedActions, navigation]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) {
      Alert.alert("Error", "Please write a message");
      return;
    }
    if (!currentUser?.user_id) {
      Alert.alert("Error", "You need to be logged in");
      return;
    }
    setIsMessageSending(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        senderId: parseInt(currentUser.user_id, 10),
        receiverId: parseInt(userId, 10),
        content: newMessage.trim(),
        type: 'text'
      };

      const response = await makeRequest(API_URL_PRIVATE_MESSAGES_CREATE, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success || response.id || response.message_id) {
        Alert.alert("Success", "Message sent!");
        setNewMessage("");
        setMessageModal(false);
        navigation.navigate("PersonalChatsListScreen");
      } else {
        throw new Error(response.error || "Failed to send message");
      }
    } catch (error) {
      let errorMessage = error.message || "Failed to send message";
      if (error.message.includes("HTTP 500")) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message.includes("HTTP 400")) {
        errorMessage = "Invalid message format.";
      } else if (error.message.includes("Network request failed")) {
        errorMessage = "Network error. Please check your connection.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsMessageSending(false);
    }
  }, [currentUser?.user_id, userId, newMessage, navigation, makeRequest]);

  const handleLikeEvent = useCallback(async (eventId) => {
    if (restrictedActions.likeEvent && restrictedActions.likeEvent(navigation)) return;
    if (!currentUser?.user_id) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    const numericEventId = Number(eventId);
    const numericUserId = Number(currentUser?.user_id);
    if (!numericUserId || !numericEventId || isNaN(numericUserId) || isNaN(numericEventId)) {
      Alert.alert("Error", "Invalid ID");
      return;
    }
    
    try {
      const updateEventLike = (eventsList, setter) => {
        setter(prevEvents => 
          prevEvents.map(event => {
            if ((event.event_id || event.id) === numericEventId) {
              const wasLiked = likedEvents.includes(numericEventId);
              const currentLikes = event.likes_count || event.likes || 0;
              return {
                ...event,
                likes_count: wasLiked ? currentLikes - 1 : currentLikes + 1,
                likes: wasLiked ? currentLikes - 1 : currentLikes + 1
              };
            }
            return event;
          })
        );
      };

      updateEventLike(events, setEvents);
      updateEventLike(subscribedEvents, setSubscribedEvents);
      updateEventLike(pastEvents, setPastEvents);

      const response = await interactionService.toggleEventLike(numericEventId, numericUserId);

      if (response && typeof response.like_count !== 'undefined') {
        const updateWithServerResponse = (eventsList, setter) => {
          setter(prevEvents => 
            prevEvents.map(event => {
              if ((event.event_id || event.id) === numericEventId) {
                return {
                  ...event,
                  likes_count: response.like_count,
                  likes: response.like_count
                };
              }
              return event;
            })
          );
        };

        updateWithServerResponse(events, setEvents);
        updateWithServerResponse(subscribedEvents, setSubscribedEvents);
        updateWithServerResponse(pastEvents, setPastEvents);
      }
    } catch (error) {
      const revertEventLike = (eventsList, setter) => {
        setter(prevEvents => 
          prevEvents.map(event => {
            if ((event.event_id || event.id) === numericEventId) {
              const wasLiked = likedEvents.includes(numericEventId);
              const currentLikes = event.likes_count || event.likes || 0;
              return {
                ...event,
                likes_count: wasLiked ? currentLikes + 1 : currentLikes - 1,
                likes: wasLiked ? currentLikes + 1 : currentLikes - 1
              };
            }
            return event;
          })
        );
      };

      revertEventLike(events, setEvents);
      revertEventLike(subscribedEvents, setSubscribedEvents);
      revertEventLike(pastEvents, setPastEvents);
      
      Alert.alert("Error", error.message || "Failed to update like");
    }
  }, [makeRequest, currentUser?.user_id, likedEvents, events, subscribedEvents, pastEvents, restrictedActions, navigation]);

  const handleLikePost = useCallback(async (postId) => {
    if (restrictedActions.likePost && restrictedActions.likePost(navigation)) return;
    if (!currentUser?.user_id) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }
    if (!postId) {
      Alert.alert("Error", "Invalid post ID");
      return;
    }

    try {
      const wasLiked = likedPosts.includes(parseInt(postId));
      
      setLikedPosts(prev => {
        if (wasLiked) {
          return prev.filter(id => id !== parseInt(postId));
        } else {
          return [...prev, parseInt(postId)];
        }
      });
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if ((post.post_id || post.id) === postId) {
            const currentLikes = post.likes_count || post.likes || 0;
            return {
              ...post,
              likes_count: wasLiked ? currentLikes - 1 : currentLikes + 1,
              likes: wasLiked ? currentLikes - 1 : currentLikes + 1
            };
          }
          return post;
        })
      );

      const payload = { 
        post_id: parseInt(postId),
        user_id: parseInt(currentUser.user_id)
      };
      
      const response = await makeRequest(API_URL_POST_LIKES_TOGGLE, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && typeof response.likes_count !== 'undefined') {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if ((post.post_id || post.id) === postId) {
              return {
                ...post,
                likes_count: response.likes_count,
                likes: response.likes_count,
                isLiked: response.liked || response.isLiked
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if ((post.post_id || post.id) === postId) {
            const wasLiked = post.isLiked || false;
            const currentLikes = post.likes_count || post.likes || 0;
            return {
              ...post,
              isLiked: !wasLiked,
              likes_count: wasLiked ? currentLikes + 1 : currentLikes - 1,
              likes: wasLiked ? currentLikes + 1 : currentLikes - 1
            };
          }
          return post;
        })
      );
      
      let errorMessage = "Failed to update like";
      if (error.message.includes('404')) {
        errorMessage = "Post not found";
      } else if (error.message.includes('401')) {
        errorMessage = "Session expired";
      } else if (error.message.includes('500')) {
        errorMessage = "Server error";
      }
      Alert.alert("Error", errorMessage);
    }
  }, [currentUser?.user_id, makeRequest, restrictedActions, navigation, likedPosts]);

  const loadPostComments = useCallback(async (postId) => {
    if (!postId) {
      setPostComments([]);
      return;
    }
    try {
      const response = await makeRequest(API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId));
      let comments = [];
      if (Array.isArray(response.data)) {
        comments = response.data;
      } else if (Array.isArray(response.comments)) {
        comments = response.comments;
      } else if (Array.isArray(response)) {
        comments = response;
      }
      setPostComments(comments);
    } catch (error) {
      setPostComments([]);
    }
  }, [makeRequest]);

  const sendPostComment = useCallback(
    async (postId, content) => {
      if (!currentUser?.user_id) {
        Alert.alert("Error", "You need to be logged in");
        return;
      }
      if (!content.trim()) {
        Alert.alert("Error", "Comment cannot be empty");
        return;
      }
      if (!postId) {
        Alert.alert("Error", "Invalid post ID");
        return;
      }

      try {
        const response = await makeRequest(API_URL_POST_COMMENTS_CREATE, {
          method: "POST",
          body: JSON.stringify({
            post_id: parseInt(postId),
            content: content.trim(),
          }),
        });

        const newCommentData = response.data || response;
        if (newCommentData) {
          const commentWithUser = {
            ...newCommentData,
            user: newCommentData.user || {
              user_id: currentUser.user_id,
              username: currentUser.username,
              display_name: currentUser.display_name
            }
          };
          
          setPostComments(prevComments => [...prevComments, commentWithUser]);
          setNewComment("");
          
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if ((post.post_id || post.id) === postId) {
                return {
                  ...post,
                  comments_count: (post.comments_count || 0) + 1
                };
              }
              return post;
            })
          );
        }
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to send comment");
      }
    },
    [currentUser, makeRequest]
  );

  const normalizeImageUrl = useCallback((url) => {
    if (!url || url === "null" || url === "undefined") return null;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const cleanUrl = url.replace(/http:\/\/localhost:3000http:\/\//, "http://");
        return cleanUrl;
      }
      const cleanPath = url.replace(/^\//, "");
      return `${BASE_URL_IMAGE}/${cleanPath}`;
    } catch (error) {
      return null;
    }
  }, []);

  const getActiveTabData = useCallback(() => {
    switch (activeTab) {
      case "events":
        return events;
      case "posts":
        return posts;
      case "pastEvents":
        return pastEvents;
      case "subscribed":
        return subscribedEvents;
      default:
        return [];
    }
  }, [activeTab, events, posts, pastEvents, subscribedEvents]);

  const renderTabItem = ({ item }) => {
    if (activeTab === "events" || activeTab === "subscribed" || activeTab === "pastEvents") {
      return (
        <EventImageSquare
          item={item}
          darkMode={darkMode}
          onPress={() => navigation.navigate("EventDetails", { event: item })}
          onAction={() => handleLikeEvent(item.event_id || item.id)}
          liked={likedEvents.includes(item.event_id || item.id)}
        />
      );
    } else if (activeTab === "posts") {
      return (
        <PostCard
          item={item}
          darkMode={darkMode}
          onLike={() => handleLikePost(item.post_id || item.id)}
          onComment={(post) => {
            setSelectedPost(post);
            setCommentModal(true);
            loadPostComments(post.post_id || post.id);
          }}
          isLiked={likedPosts.includes(item.post_id || item.id)}
          normalizeImageUrl={normalizeImageUrl}
        />
      );
    }
    return null;
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, darkMode && styles.errorTextDark]}>{error || "User not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <FlatList
        data={getActiveTabData()}
        numColumns={activeTab === "posts" ? 1 : 2}
        key={activeTab}
        keyExtractor={(item, index) => (item?.event_id || item?.post_id || item?.id || `item-${index}`).toString()}
        renderItem={renderTabItem}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
        getItemLayout={(data, index) => {
          const itemHeight = activeTab === 'posts' ? 300 : 260
          return { length: itemHeight, offset: itemHeight * index, index }
        }}
        onScrollToIndexFailed={({ index, highestMeasuredFrameIndex, averageItemLength, distance }) => {
          // FlatList reintenta automáticamente después de medir más ítems; aseguramos que no falle
        }}
        ListHeaderComponent={
          <>
            <View style={styles.bannerContainer}>
              <UserBanner user={user} />
            </View>
            <ProfileHeaderOther
              user={user}
              darkMode={darkMode}
              followersCount={followersCount}
              followingCount={followingCount}
              eventsCount={events.length}
              isFollowing={isFollowing}
              isFollowLoading={isFollowLoading}
              hasSentFriendRequest={hasSentFriendRequest}
              hasReceivedFriendRequest={hasReceivedFriendRequest}
              isFriend={isFriend}
              isBlocked={isBlocked}
              onFollowToggle={handleFollowToggle}
              onFriendRequestToggle={handleFriendRequestToggle}
              onFriendRequestAccept={() => handleFriendRequestAction("accept")}
              onFriendRequestReject={() => handleFriendRequestAction("reject")}
              onMessageUser={handleMessageUser}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              Styles={styles}
              AvatarComponent={(props) => <UserAvatar {...props} size={120} />}
            />
            <View style={[styles.tabContainer, darkMode && styles.tabContainerDark]}>
              <ProfileTabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                accentColor={ACCENT_COLOR}
                darkMode={darkMode}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState activeTab={activeTab} darkMode={darkMode} />
        }
      />

      <CommentsModal
        visible={commentModal}
        onClose={() => setCommentModal(false)}
        darkMode={darkMode}
        selectedPost={selectedPost}
        likedPosts={new Set(likedPosts)}
        postComments={postComments}
        newComment={newComment}
        setNewComment={setNewComment}
        onToggleLike={handleLikePost}
        onSendComment={() => sendPostComment(selectedPost?.post_id || selectedPost?.id, newComment)}
        currentUser={currentUser}
        normalizeImageUrl={normalizeImageUrl}
      />

      <MessageModal
        visible={messageModal}
        onClose={() => {
          setMessageModal(false);
          setNewMessage("");
        }}
        onSend={sendMessage}
        darkMode={darkMode}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isMessageSending={isMessageSending}
        recipientUser={user}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerDark: {
    backgroundColor: "#181A20",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  bannerContainer: {
    width: "100%",
    height: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    marginTop: 8,
    fontSize: 14,
  },
  loadingTextDark: {
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    marginTop: 12,
    textAlign: "center",
  },
  errorTextDark: {
    color: "#FF8787",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#6200EE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
  },
  tabContainerDark: {
    backgroundColor: "#181A20",
  },
  profileSection: {
    backgroundColor: "#fff",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  profileSectionDark: {
    backgroundColor: CARD_BACKGROUND_DARK,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -60,
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  nameTextDark: {
    color: "#fff",
  },
  bioText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  bioTextDark: {
    color: "#aaa",
  },
  usernameText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
  },
  usernameTextDark: {
    color: "#bbb",
  },
  onlineStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  onlineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 12,
    color: "#666",
  },
  onlineStatusTextDark: {
    color: "#aaa",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  statNumberDark: {
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statLabelDark: {
    color: "#aaa",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#aaa",
  },
  blockedButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  unblockButtonText: {
    color: "#4CAF50",
  },
});
