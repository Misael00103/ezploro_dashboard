import { fetchWithAuth } from './userService';
import { 
  API_URL_POSTS,
  API_URL_POSTS_ALL,
  API_URL_POSTS_BY_USER,
  API_URL_POST_COMMENTS,
  API_URL_POST_COMMENTS_BY_POST,
  API_URL_POST_LIKES_TOGGLE,
  API_URL_POST_LIKES_BY_POST,
  DASHBOARD_CONFIG,
  BASE_URL_IMAGE
} from './config';
import { getAuthToken } from './authService';

/**
 * Procesa los datos del post para incluir URLs completas de imágenes
 * @param {Object} post - Datos del post
 * @returns {Object} Post procesado con URLs completas
 */
const processPostData = (post) => {
  if (!post) return post;

  // Función helper para procesar URLs de imágenes
  const processImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Si comienza con /, es una ruta absoluta del servidor
    if (imageUrl.startsWith('/')) {
      return `${BASE_URL_IMAGE}${imageUrl}`;
    }
    // Si es una ruta relativa, agregar la base URL con /
    return `${BASE_URL_IMAGE}/${imageUrl}`;
  };

  // Solo procesar si realmente necesitamos hacerlo
  const needsProcessing = (post.image && !post.image.startsWith('http')) || 
                         (post.user?.profile_picture && !post.user.profile_picture.startsWith('http')) ||
                         (post.user?.avatar && !post.user.avatar.startsWith('http'));

  if (!needsProcessing) {
    return post; // Devolver sin cambios si no necesita procesamiento
  }

  return {
    ...post,
    // Procesar imagen del post solo si existe y no es URL completa
    image: post.image ? processImageUrl(post.image) : post.image,
    
    // Procesar datos del usuario que creó el post
    user: post.user ? {
      ...post.user,
      profile_picture: post.user.profile_picture ? processImageUrl(post.user.profile_picture) : post.user.profile_picture,
      avatar: post.user.avatar ? processImageUrl(post.user.avatar) : post.user.avatar,
    } : post.user,
    
    // Procesar comentarios si existen
    comments: post.comments ? post.comments.map(comment => ({
      ...comment,
      user: comment.user ? {
        ...comment.user,
        profile_picture: comment.user.profile_picture ? processImageUrl(comment.user.profile_picture) : comment.user.profile_picture,
        avatar: comment.user.avatar ? processImageUrl(comment.user.avatar) : comment.user.avatar,
      } : comment.user,
    })) : post.comments,
  };
};

// Create new post
export const createPost = async (postData) => {
  try {
    const formData = new FormData();
    formData.append('title', postData.title);
    if (postData.description) formData.append('description', postData.description);
    if (postData.image) formData.append('image', postData.image);

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(API_URL_POSTS, {
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

    const result = await response.json();
    const post = result.data || result;
    return processPostData(post);
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

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

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

    const result = await response.json();
    const post = result.data || result;
    return processPostData(post);
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
    const url = API_URL_POSTS_BY_USER.replace(':userId', userId);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const posts = response.data || response || [];
    
    // Add likes count and user_liked status for each post
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      try {
        const likesUrl = API_URL_POST_LIKES_BY_POST.replace(':postId', post.post_id);
        const likesResponse = await fetchWithAuth(likesUrl, {
          method: 'GET',
        });
        const likesData = likesResponse.data || likesResponse || [];
        return {
          ...post,
          likes_count: Array.isArray(likesData) ? likesData.length : 0,
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
export const getAllPosts = async () => {
  try {
    const response = await fetchWithAuth(API_URL_POSTS_ALL, {
      method: 'GET',
    });
    const posts = response.data || response || [];
    
    // Obtener ID del usuario actual para verificar likes
    let currentUserId = null;
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        currentUserId = user.user_id || user.id;
      }
    } catch (e) {
      console.error('Error getting current user ID:', e);
    }
    
    // Add additional metadata for dashboard
    const postsWithMetadata = await Promise.all(posts.map(async (post) => {
      try {
        const postId = post.post_id || post.id;
        if (!postId) return post;

        // Get likes count
        const likesUrl = API_URL_POST_LIKES_BY_POST.replace(':postId', postId);
        const likesResponse = await fetchWithAuth(likesUrl, {
          method: 'GET',
        });
        const likesData = likesResponse.data || likesResponse || [];
        
        // Get comments count
        const commentsUrl = API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId);
        const commentsResponse = await fetchWithAuth(commentsUrl, {
          method: 'GET',
        });
        const commentsData = commentsResponse.data || commentsResponse || [];
        
        // Verificar si el usuario actual ha dado like
        let user_liked = false;
        if (currentUserId && Array.isArray(likesData)) {
          user_liked = likesData.some(like => 
            String(like.user_id || like.user?.user_id) === String(currentUserId)
          );
        }
        
        return {
          ...post,
          likes_count: Array.isArray(likesData) ? likesData.length : (typeof likesData === 'object' && likesData.likes ? likesData.likes : 0),
          comments_count: Array.isArray(commentsData) ? commentsData.length : (typeof commentsData === 'object' && commentsData.comments_count ? commentsData.comments_count : 0),
          user_liked: user_liked,
          created_at_formatted: post.created_at ? new Date(post.created_at).toLocaleDateString() : '',
        };
      } catch (error) {
        console.error(`Error processing post ${post.post_id || post.id}:`, error);
        return {
          ...post,
          likes_count: 0,
          comments_count: 0,
          user_liked: false,
          created_at_formatted: post.created_at ? new Date(post.created_at).toLocaleDateString() : '',
        };
      }
    }));
    
    return postsWithMetadata;
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
};

// Create comment
export const createComment = async (commentData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL_POSTS}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const comment = result.data || result;
    
    // Procesar datos del usuario en el comentario
    if (comment && comment.user) {
      comment.user = {
        ...comment.user,
        profile_picture: comment.user.profile_picture ? 
          `${BASE_URL_IMAGE}/${comment.user.profile_picture}` : null,
        avatar: comment.user.avatar ? 
          `${BASE_URL_IMAGE}/${comment.user.avatar}` : null,
      };
    }
    
    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Update comment
export const updateComment = async (commentId, content) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL_POSTS}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const comment = result.data || result;
    
    // Procesar datos del usuario en el comentario
    if (comment && comment.user) {
      comment.user = {
        ...comment.user,
        profile_picture: comment.user.profile_picture ? 
          `${BASE_URL_IMAGE}/${comment.user.profile_picture}` : null,
        avatar: comment.user.avatar ? 
          `${BASE_URL_IMAGE}/${comment.user.avatar}` : null,
      };
    }
    
    return comment;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete comment
export const deleteComment = async (commentId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL_POSTS}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Get post comments
export const getPostComments = async (postId) => {
  try {
    const url = API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const comments = response.data || response || [];
    
    // Procesar fotos de perfil en comentarios y manejar diferentes formatos de ID
    return comments.map(comment => ({
      ...comment,
      comment_post_id: comment.comment_post_id || comment.comment_id || comment.id,
      comment_id: comment.comment_post_id || comment.comment_id || comment.id,
      user: comment.user ? {
        ...comment.user,
        profile_picture: comment.user.profile_picture ? 
          (comment.user.profile_picture.startsWith('http') 
            ? comment.user.profile_picture 
            : `${BASE_URL_IMAGE}/${comment.user.profile_picture}`) : null,
        avatar: comment.user.avatar ? 
          (comment.user.avatar.startsWith('http') 
            ? comment.user.avatar 
            : `${BASE_URL_IMAGE}/${comment.user.avatar}`) : null,
      } : null,
    }));
  } catch (error) {
    console.error('Error getting post comments:', error);
    return [];
  }
};

// Toggle post like
export const togglePostLike = async (postId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(API_URL_POST_LIKES_TOGGLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ post_id: postId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    // El backend devuelve { message: 'Like agregado', liked: true } o { message: 'Like removido', liked: false }
    return {
      liked: result.liked !== undefined ? result.liked : (result.message?.includes('agregado') ? true : false),
      ...result
    };
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

// Get post likes
export const getPostLikes = async (postId) => {
  try {
    const url = API_URL_POST_LIKES_BY_POST.replace(':postId', postId);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    const likes = response.data || response || [];
    
    // Procesar fotos de perfil en likes
    return likes.map(like => ({
      ...like,
      user: like.user ? {
        ...like.user,
        profile_picture: like.user.profile_picture ? 
          `${BASE_URL_IMAGE}/${like.user.profile_picture}` : null,
        avatar: like.user.avatar ? 
          `${BASE_URL_IMAGE}/${like.user.avatar}` : null,
      } : null,
    }));
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

// Alias for backward compatibility
export const getPosts = getAllPosts;