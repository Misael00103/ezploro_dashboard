// services/interactionService.js
import {
    API_URL_BOOKMARKS_ADD,
    API_URL_BOOKMARKS_LIST_USER,
    API_URL_BOOKMARKS_REMOVE,
    API_URL_EVENT_LIKES_BY_USER,
    API_URL_EVENT_LIKES_COUNT,
    API_URL_EVENT_LIKES_STATUS,
    API_URL_EVENT_LIKES_TOGGLE,
    API_URL_EVENT_SUBSCRIPTIONS_BY_USER,
    API_URL_EVENT_SUBSCRIPTIONS_COUNT,
    API_URL_EVENT_SUBSCRIPTIONS_TOGGLE,
    API_URL_FOLLOW,
    API_URL_FOLLOW_FOLLOWERS,
    API_URL_FOLLOW_STATUS,
    API_URL_FOLLOW_UNFOLLOW,
    API_URL_FOLLOWERS_COUNT,
    API_URL_FOLLOWING_COUNT,
    API_URL_POST_COMMENTS_BY_POST,
    API_URL_POST_COMMENTS_CREATE,
    API_URL_POST_COMMENTS_DELETE,
    API_URL_POST_COMMENTS_UPDATE,
    API_URL_POST_LIKES_BY_POST,
    API_URL_POST_LIKES_COUNT,
    API_URL_POST_LIKES_TOGGLE
} from '../config';
import api from './api';

export const interactionService = {
  // Event Likes - usando endpoints correctos de tu backend
  toggleEventLike: (eventId, userId) => {
    console.log("🔧 toggleEventLike:", { eventId, userId });
    
    // Para usuarios guest, bloquear la acción
    if (userId.toString().startsWith('guest_')) {
      console.log('👤 Usuario guest detectado, bloqueando toggle de like');
      throw new Error('Debes iniciar sesión para dar like a eventos');
    }
    
    return api.post(API_URL_EVENT_LIKES_TOGGLE, { event_id: Number(eventId), user_id: Number(userId) });
  },
  getEventLikesCount: async (eventId) => {
    console.log("🔧 getEventLikesCount eventId:", eventId);
    if (!eventId) return Promise.resolve({ like_count: 0 });
    
    try {
      const url = API_URL_EVENT_LIKES_COUNT.replace(':event_id', eventId);
      console.log("🔧 getEventLikesCount URL:", url);
      const result = await api.get(url);
      console.log("👍 Likes count received:", result?.count || result?.like_count || 0);
      return result;
    } catch (error) {
      console.error("❌ Error al obtener los likes del evento:", error.message);
      // Para errores de autenticación o usuarios guest, devolver 0
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        console.log("👍 Likes count received: 0");
        return { count: 0, like_count: 0, userLiked: false };
      }
      throw error;
    }
  },
  getEventLikeStatus: async (eventId, userId) => {
    console.log("🔧 getEventLikeStatus:", { eventId, userId });
    if (!eventId || !userId) return Promise.resolve({ liked: false });
    
    // Para usuarios guest, siempre devolver false
    if (userId.toString().startsWith('guest_')) {
      console.log('👤 Usuario guest detectado, devolviendo like status false');
      return Promise.resolve({ liked: false });
    }
    
    try {
      const url = API_URL_EVENT_LIKES_STATUS.replace(':event_id', eventId).replace(':user_id', userId);
      console.log("🔧 getEventLikeStatus URL:", url);
      return await api.get(url);
    } catch (error) {
      console.error("❌ Error al obtener el status de like del evento:", error.message);
      // Para errores de autenticación, devolver false
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return { liked: false };
      }
      throw error;
    }
  },
  getUserLikedEvents: (userId) => {
    if (!userId) return Promise.resolve({ likedEventIds: [] });
    const url = API_URL_EVENT_LIKES_BY_USER.replace(':user_id', userId);
    return api.get(url);
  },
  
  // Event Subscriptions
  toggleEventSubscription: (eventId, userId) => {
    console.log("🔧 toggleEventSubscription:", { eventId, userId });
    return api.post(API_URL_EVENT_SUBSCRIPTIONS_TOGGLE, { event_id: Number(eventId), user_id: Number(userId) });
  },
  getEventSubscriptionsCount: (eventId) => {
    console.log("🔧 getEventSubscriptionsCount eventId:", eventId);
    if (!eventId) return Promise.resolve({ subscribers_count: 0 });
    const url = API_URL_EVENT_SUBSCRIPTIONS_COUNT.replace(':event_id', eventId);
    console.log("🔧 getEventSubscriptionsCount URL:", url);
    return api.get(url);
  },
  getEventSubscribersList: (eventId) => {
    console.log("🔧 getEventSubscribersList eventId:", eventId);
    if (!eventId) return Promise.resolve([]);
    const url = API_URL_EVENT_SUBSCRIPTIONS_LIST.replace(':event_id', eventId);
    console.log("🔧 getEventSubscribersList URL:", url);
    return api.get(url);
  },
  getUserSubscribedEvents: (userId) => {
    if (!userId || !API_URL_EVENT_SUBSCRIPTIONS_BY_USER) return Promise.resolve([]);
    
    // Para usuarios guest, devolver array vacío sin hacer llamadas API
    if (userId.toString().startsWith('guest_')) {
      console.log('👤 Usuario guest detectado, devolviendo suscripciones vacías');
      return Promise.resolve([]);
    }
    
    return api.get(API_URL_EVENT_SUBSCRIPTIONS_BY_USER.replace(':user_id', userId));
  },
  
  // Follow System
  followUser: (followedId) => api.post(API_URL_FOLLOW, { followedId }),
  unfollowUser: (followedId) => {
    if (!followedId || !API_URL_FOLLOW_UNFOLLOW) return Promise.resolve();
    return api.delete(API_URL_FOLLOW_UNFOLLOW.replace(':followedId', followedId));
  },
  getFollowers: (userId) => {
    if (!userId || !API_URL_FOLLOW_FOLLOWERS) return Promise.resolve([]);
    return api.get(API_URL_FOLLOW_FOLLOWERS.replace(':userId', userId));
  },
  getFollowersCount: (userId) => {
    if (!userId || !API_URL_FOLLOWERS_COUNT) return Promise.resolve(0);
    return api.get(API_URL_FOLLOWERS_COUNT.replace(':userId', userId));
  },
  getFollowingCount: (userId) => {
    if (!userId || !API_URL_FOLLOWING_COUNT) return Promise.resolve(0);
    return api.get(API_URL_FOLLOWING_COUNT.replace(':userId', userId));
  },
  getFollowStatus: (followedId) => {
    if (!followedId || !API_URL_FOLLOW_STATUS) return Promise.resolve(false);
    return api.get(API_URL_FOLLOW_STATUS.replace(':followedId', followedId));
  },
  
  // Post Likes
  togglePostLike: (postId, userId) => {
    console.log("🔧 togglePostLike:", { postId, userId });
    return api.post(API_URL_POST_LIKES_TOGGLE, { post_id: Number(postId), user_id: Number(userId) });
  },
  getPostLikesCount: (postId) => {
    console.log("🔧 getPostLikesCount postId:", postId);
    if (!postId) return Promise.resolve({ likes_count: 0 });
    const url = API_URL_POST_LIKES_COUNT.replace(':postId', postId);
    console.log("🔧 getPostLikesCount URL:", url);
    return api.get(url);
  },
  getPostLikes: (postId) => {
    console.log("🔧 getPostLikes postId:", postId);
    if (!postId) return Promise.resolve([]);
    const url = API_URL_POST_LIKES_BY_POST.replace(':postId', postId);
    console.log("🔧 getPostLikes URL:", url);
    return api.get(url);
  },

  // Post Comments
  createPostComment: (postId, content) => {
    console.log("🔧 createPostComment:", { postId, content });
    return api.post(API_URL_POST_COMMENTS_CREATE, { post_id: Number(postId), content });
  },
  getPostComments: (postId) => {
    console.log("🔧 getPostComments postId:", postId);
    if (!postId) return Promise.resolve([]);
    const url = API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId);
    console.log("🔧 getPostComments URL:", url);
    return api.get(url);
  },
  updatePostComment: (commentId, content) => {
    console.log("🔧 updatePostComment:", { commentId, content });
    const url = API_URL_POST_COMMENTS_UPDATE.replace(':commentId', commentId);
    return api.put(url, { content });
  },
  deletePostComment: (commentId) => {
    console.log("🔧 deletePostComment commentId:", commentId);
    const url = API_URL_POST_COMMENTS_DELETE.replace(':commentId', commentId);
    return api.delete(url);
  },

  // Bookmarks
  addBookmark: (eventId) => api.post(API_URL_BOOKMARKS_ADD, { eventId }),
  removeBookmark: (eventId) => api.post(API_URL_BOOKMARKS_REMOVE, { eventId }),
  getUserBookmarks: (userId) => {
    if (!userId || !API_URL_BOOKMARKS_LIST_USER) return Promise.resolve([]);
    return api.get(API_URL_BOOKMARKS_LIST_USER.replace(':userId', userId));
  },
};