import { fetchWithAuth } from './userService';
import { API_URL_POSTS } from './config';

// Create new post
export const createPost = async (postData) => {
  try {
    const formData = new FormData();
    formData.append('title', postData.title);
    if (postData.description) formData.append('description', postData.description);
    if (postData.image) formData.append('image', postData.image);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL_POSTS}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Update post
export const updatePost = async (postId, postData) => {
  try {
    const formData = new FormData();
    if (postData.title) formData.append('title', postData.title);
    if (postData.description) formData.append('description', postData.description);
    if (postData.image) formData.append('image', postData.image);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL_POSTS}/${postId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete post
export const deletePost = async (postId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/${postId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Get user posts
export const getUserPosts = async (userId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/user/${userId}`, {
      method: 'GET',
    });
    const posts = response.data || response || [];
    
    // Add likes count and user_liked status for each post
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      try {
        const likesResponse = await fetchWithAuth(`${API_URL_POSTS}/${post.post_id}/likes`, {
          method: 'GET',
        });
        return {
          ...post,
          likes_count: likesResponse.likes || 0,
          comments_count: post.comments?.length || 0,
          user_liked: false // This would need to be determined by checking if current user liked it
        };
      } catch (error) {
        return {
          ...post,
          likes_count: 0,
          comments_count: post.comments?.length || 0,
          user_liked: false
        };
      }
    }));
    
    return postsWithLikes;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

// Get all posts (for admin dashboard)
export const getPosts = async () => {
  try {
    // Since there's no general posts endpoint, return empty array
    console.log('Posts endpoint not available for general listing');
    return [];
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

// Create comment
export const createComment = async (commentData) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response.data || response;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Update comment
export const updateComment = async (commentId, content) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data || response;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete comment
export const deleteComment = async (commentId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/comments/${commentId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Get post comments
export const getPostComments = async (postId) => {
  try {
    console.log('Fetching comments for post:', postId);
    console.log('API URL:', `${API_URL_POSTS}/comments/${postId}`);
    const response = await fetchWithAuth(`${API_URL_POSTS}/comments/${postId}`, {
      method: 'GET',
    });
    console.log('Comments API response:', response);
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting post comments:', error);
    return [];
  }
};

// Toggle post like
export const togglePostLike = async (postId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/likes/toggle`, {
      method: 'POST',
      body: JSON.stringify({ post_id: postId }),
    });
    return response;
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

// Get post likes
export const getPostLikes = async (postId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_POSTS}/${postId}/likes`, {
      method: 'GET',
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting post likes:', error);
    return [];
  }
};

// Create reply to comment (not implemented in backend yet)
export const createReply = async (commentId, content) => {
  try {
    // This endpoint doesn't exist in the backend yet
    console.warn('Reply functionality not implemented in backend yet');
    return { message: 'Reply functionality not available' };
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

// Get comment replies (not implemented in backend yet)
export const getCommentReplies = async (commentId) => {
  try {
    // This endpoint doesn't exist in the backend yet
    console.warn('Reply functionality not implemented in backend yet');
    return [];
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
};