// services/socialService.js
import api from './api';
import {
  API_URL_FRIEND_REQUEST_TOGGLE,
  API_URL_FRIEND_REQUEST_RECEIVED,
  API_URL_FRIEND_REQUEST_SENT,
  API_URL_FRIEND_REQUEST_ACCEPT,
  API_URL_POSTS,
  API_URL_POSTS_CREATE,
  API_URL_POSTS_UPDATE,
  API_URL_POSTS_DELETE,
  API_URL_POSTS_BY_USER,
  API_URL_POST_COMMENTS_CREATE,
  API_URL_POST_COMMENTS_UPDATE,
  API_URL_POST_COMMENTS_DELETE,
  API_URL_POST_COMMENTS_BY_POST,
  API_URL_FOLLOW_FOLLOWERS_COUNT,
  API_URL_FOLLOW_FOLLOWING_COUNT
} from '../config';

export const socialService = {
  // Friend Requests
  toggleFriendRequest: (userId) => api.post(API_URL_FRIEND_REQUEST_TOGGLE, { userId }),
  getReceivedRequests: () => api.get(API_URL_FRIEND_REQUEST_RECEIVED),
  getSentRequests: () => api.get(API_URL_FRIEND_REQUEST_SENT),
  acceptFriendRequest: (requestId) => api.post(API_URL_FRIEND_REQUEST_ACCEPT, { requestId }),
  
  // Follow System
  getFollowersCount: async (userId) => {
    if (!userId) return 0;
    const url = API_URL_FOLLOW_FOLLOWERS_COUNT.replace(':userId', userId);
    const response = await api.get(url);
    return response.data?.followers_count || response.followers_count || 0;
  },
  getFollowingCount: async (userId) => {
    if (!userId) return 0;
    const url = API_URL_FOLLOW_FOLLOWING_COUNT.replace(':userId', userId);
    const response = await api.get(url);
    return response.data?.following_count || response.following_count || 0;
  },
  
  // Posts
  createPost: (postData) => api.post(API_URL_POSTS_CREATE, postData),
  updatePost: (postId, postData) => api.put(API_URL_POSTS_UPDATE.replace(':postId', postId), postData),
  deletePost: (postId) => api.delete(API_URL_POSTS_DELETE.replace(':postId', postId)),
  getUserPosts: (userId) => api.get(API_URL_POSTS_BY_USER.replace(':userId', userId)),
  
  // Post Comments
  createPostComment: (commentData) => api.post(API_URL_POST_COMMENTS_CREATE, commentData),
  updatePostComment: (commentId, commentData) => 
    api.put(API_URL_POST_COMMENTS_UPDATE.replace(':commentId', commentId), commentData),
  deletePostComment: (commentId) => api.delete(API_URL_POST_COMMENTS_DELETE.replace(':commentId', commentId)),
  getPostComments: (postId) => api.get(API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId)),
};