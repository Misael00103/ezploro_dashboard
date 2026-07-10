// services/postService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_URL_POSTS_CREATE,
  API_URL_POSTS_BY_USER,
  API_URL_POSTS_UPDATE,
  API_URL_POSTS_DELETE,
  API_URL_POST_LIKES_TOGGLE,
  API_URL_POST_LIKES_BY_POST,
  API_URL_POST_COMMENTS_CREATE,
  API_URL_POST_COMMENTS_BY_POST
} from '../config';

export const postService = {
  // Posts CRUD
  createPost: async (postData) => {
    console.log("🔧 createPost:", postData);
    
    // Si es FormData, usar fetch directamente
    if (postData instanceof FormData) {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(API_URL_POSTS_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No establecer Content-Type para FormData
        },
        body: postData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    }
    
    // Para datos JSON normales
    return api.post(API_URL_POSTS_CREATE, postData);
  },
  
  getUserPosts: (userId) => {
    console.log("🔧 getUserPosts userId:", userId);
    if (!userId) return Promise.resolve({ data: [] });
    const url = API_URL_POSTS_BY_USER.replace(':userId', userId);
    console.log("🔧 getUserPosts URL:", url);
    return api.get(url);
  },
  
  updatePost: (postId, postData) => {
    console.log("🔧 updatePost:", { postId, postData });
    const url = API_URL_POSTS_UPDATE.replace(':postId', postId);
    return api.put(url, postData);
  },
  
  deletePost: (postId) => {
    console.log("🔧 deletePost postId:", postId);
    const url = API_URL_POSTS_DELETE.replace(':postId', postId);
    return api.delete(url);
  },

  // Post Likes
  togglePostLike: (postId, userId) => {
    console.log("🔧 togglePostLike:", { postId, userId });
    return api.post(API_URL_POST_LIKES_TOGGLE, { 
      post_id: Number(postId), 
      user_id: Number(userId) 
    });
  },
  
  getPostLikes: (postId) => {
    console.log("🔧 getPostLikes postId:", postId);
    if (!postId) return Promise.resolve({ data: [] });
    const url = API_URL_POST_LIKES_BY_POST.replace(':postId', postId);
    console.log("🔧 getPostLikes URL:", url);
    return api.get(url);
  },

  // Post Comments
  createComment: (postId, content, userId) => {
    console.log("🔧 createComment:", { postId, content, userId });
    return api.post(API_URL_POST_COMMENTS_CREATE, { 
      post_id: Number(postId), 
      content: content.trim(),
      user_id: Number(userId)
    });
  },
  
  getPostComments: (postId) => {
    console.log("🔧 getPostComments postId:", postId);
    if (!postId) return Promise.resolve({ data: [] });
    const url = API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId);
    console.log("🔧 getPostComments URL:", url);
    return api.get(url);
  }
};

export default postService;