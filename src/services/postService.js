import { fetchWithAuth } from './userService';
import { 
  API_URL_POSTS,
  API_URL_POSTS_ALL,
  API_URL_POSTS_BY_USER,
  API_URL_POST_COMMENTS,
  API_URL_POST_COMMENTS_BY_POST,
  API_URL_POST_COMMENTS_CREATE,
  API_URL_POST_COMMENTS_UPDATE,
  API_URL_POST_COMMENTS_DELETE,
  API_URL_POST_LIKES_TOGGLE,
  API_URL_POST_LIKES_BY_POST,
  API_URL_POST_REPLIES,
  API_URL_POST_REPLIES_BY_COMMENT,
  API_URL_POST_REPLIES_UPDATE,
  API_URL_POST_REPLIES_DELETE,
  DASHBOARD_CONFIG,
  BASE_URL,
  BASE_URL_IMAGE,
  formatImageUrl
} from './config';
import { getAuthToken, getCurrentUserId } from './authService';

/**
 * Procesa los datos del comentario para incluir URLs completas de imágenes
 * @param {Object} comment - Datos del comentario
 * @returns {Object} Comentario procesado con URLs completas
 */
const processCommentData = (comment) => {
  if (!comment) return comment;

  return {
    ...comment,
    // Procesar imágenes del comentario (puede ser un array o string)
    image: comment.image ? (Array.isArray(comment.image) ? comment.image.map(formatImageUrl) : formatImageUrl(comment.image)) : comment.image,
    
    // Procesar datos del usuario que hizo el comentario
    user: comment.user ? {
      ...comment.user,
      profile_picture: formatImageUrl(comment.user.profile_picture || comment.user.avatar),
      avatar: formatImageUrl(comment.user.avatar || comment.user.profile_picture),
    } : comment.user,
  };
};

/**
 * Procesa los datos del post para incluir URLs completas de imágenes
 * @param {Object} post - Datos del post
 * @returns {Object} Post procesado con URLs completas
 */
const processPostData = (post) => {
  if (!post) return post;

  return {
    ...post,
    image: formatImageUrl(post.image),
    user: post.user ? {
      ...post.user,
      profile_picture: formatImageUrl(post.user.profile_picture || post.user.avatar),
      avatar: formatImageUrl(post.user.avatar || post.user.profile_picture),
    } : post.user,
    comments: post.comments ? post.comments.map(comment => ({
      ...comment,
      image: comment.image ? (Array.isArray(comment.image) ? comment.image.map(formatImageUrl) : formatImageUrl(comment.image)) : comment.image,
      user: comment.user ? {
        ...comment.user,
        profile_picture: formatImageUrl(comment.user.profile_picture || comment.user.avatar),
        avatar: formatImageUrl(comment.user.avatar || comment.user.profile_picture),
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
    
    // Add additional metadata for dashboard using properties already returned by the backend
    const postsWithMetadata = posts.map((post) => {
      const commentsArray = Array.isArray(post.comments) ? post.comments : [];
      return {
        ...post,
        likes_count: post.likes_count !== undefined ? post.likes_count : (post.likes || 0),
        comments_count: post.comments_count !== undefined ? post.comments_count : commentsArray.length,
        user_liked: !!post.user_liked,
        created_at_formatted: post.created_at ? new Date(post.created_at).toLocaleDateString() : '',
      };
    });
    
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
    console.log('🔍 Fetching comments for post:', postId);
    const url = API_URL_POST_COMMENTS_BY_POST.replace(':postId', postId);
    console.log('🔗 URL:', url);
    
    const response = await fetchWithAuth(url);
    console.log('📦 Raw response:', response);
    
    // Intentar múltiples formatos de respuesta
    let comments = [];
    if (Array.isArray(response)) {
      comments = response;
    } else if (response && response.data) {
      comments = Array.isArray(response.data) ? response.data : [];
    } else if (response && Array.isArray(response.comments)) {
      comments = response.comments;
    }
    
    console.log('📋 Comments array:', comments);
    
    if (!comments || comments.length === 0) {
      console.log('⚠️ No comments found, returning empty array');
      return [];
    }
    
    // Procesar comentarios y manejar diferentes formatos de ID
    const processedComments = comments.map(comment => {
      const processed = processCommentData(comment);
      return {
        ...processed,
        comment_post_id: processed.comment_post_id || processed.comment_id || processed.id,
        comment_id: processed.comment_post_id || processed.comment_id || processed.id,
        id: processed.comment_post_id || processed.comment_id || processed.id,
      };
    });
    
    console.log('✅ Processed comments:', processedComments);
    return processedComments;
  } catch (error) {
    console.error('❌ Error getting post comments:', error);
    return [];
  }
};

// Create post comment
export const createPostComment = async (postId, { text, images = [] }) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Obtener user_id del usuario actual
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    // Si hay imágenes, usar FormData, sino usar JSON
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
    };

    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append('post_id', postId);
      formData.append('user_id', userId);
      formData.append('content', text);
      images.forEach(img => formData.append('images', img));
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        post_id: postId,
        user_id: userId,
        content: text
      });
    }

    console.log('💬 Creando comentario:', { post_id: postId, user_id: userId, content: text });

    const response = await fetch(API_URL_POST_COMMENTS_CREATE, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error al crear comentario:', errorData);
      throw new Error(errorData.message || errorData.error || 'Error al comentar');
    }

    const result = await response.json();
    return { data: processCommentData(result.data || result) };
  } catch (error) {
    console.error('Error creating post comment:', error);
    throw error;
  }
};

// Get comment replies
export const getCommentReplies = async (commentPostId) => {
  try {
    const url = API_URL_POST_REPLIES_BY_COMMENT.replace(':comment_post_id', commentPostId);
    const response = await fetchWithAuth(url);
    const replies = response.data || response || [];
    console.log('📨 Replies obtenidas del backend:', replies);
    return replies.map(processCommentData);
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};

// Create comment reply
export const createCommentReply = async ({ postId, commentId, text, images = [] }) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Obtener user_id del usuario actual
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    // Si hay imágenes, usar FormData, sino usar JSON
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
    };

    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append('comment_post_id', commentId);
      formData.append('user_id', userId);
      formData.append('content', text);
      images.forEach(img => formData.append('images', img));
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        comment_post_id: commentId,
        user_id: userId,
        content: text
      });
    }

    const response = await fetch(API_URL_POST_REPLIES, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear la respuesta');
    }

    const result = await response.json();
    return processCommentData(result.data || result);
  } catch (error) {
    console.error('Error creating comment reply:', error);
    throw error;
  }
};

// Update post comment
export const updatePostComment = async (commentId, { text }) => {
  try {
    const formData = new FormData();
    formData.append('text', text);

    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const url = API_URL_POST_COMMENTS_UPDATE.replace(':commentId', commentId);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al editar');
    }

    const result = await response.json();
    return processCommentData(result.data || result);
  } catch (error) {
    console.error('Error updating post comment:', error);
    throw error;
  }
};

// Delete post comment
export const deletePostComment = async (commentId) => {
  try {
    const url = API_URL_POST_COMMENTS_DELETE.replace(':commentId', commentId);
    await fetchWithAuth(url, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting post comment:', error);
    throw error;
  }
};

// Update reply
export const updatePostReply = async (replyId, { text }) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const url = API_URL_POST_REPLIES_UPDATE.replace(':reply_id', replyId);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al editar la respuesta');
    }

    const result = await response.json();
    return processCommentData(result.data || result);
  } catch (error) {
    console.error('Error updating post reply:', error);
    throw error;
  }
};

// Delete reply
export const deletePostReply = async (replyId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Obtener user_id del usuario actual
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    // Validar que el replyId existe y es válido
    if (!replyId || replyId === 'undefined' || replyId === 'null') {
      throw new Error('ID de respuesta inválido');
    }

    const url = API_URL_POST_REPLIES_DELETE.replace(':reply_id', String(replyId));
    console.log('🗑️ URL de eliminación:', url);
    console.log('🗑️ Reply ID:', replyId);
    console.log('🗑️ User ID:', userId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error del backend:', errorData);
      throw new Error(errorData.message || errorData.error || `Error al eliminar la respuesta: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting post reply:', error);
    throw error;
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

// Create reply to comment (legacy function - mantiene compatibilidad)
export const createReply = async (commentId, replyData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Intentar crear reply usando el endpoint de comentarios con parent_comment_id
    const response = await fetch(`${API_URL_POSTS}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        post_id: replyData.post_id,
        content: replyData.content,
        parent_comment_id: commentId, // Campo para indicar que es una respuesta
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const result = await response.json();
    const reply = result.data || result;
    
    // Procesar datos del usuario en la respuesta
    if (reply && reply.user) {
      reply.user = {
        ...reply.user,
        profile_picture: reply.user.profile_picture ? 
          `${BASE_URL_IMAGE}/${reply.user.profile_picture}` : null,
        avatar: reply.user.avatar ? 
          `${BASE_URL_IMAGE}/${reply.user.avatar}` : null,
      };
    }
    
    return reply;
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const getPosts = getAllPosts;