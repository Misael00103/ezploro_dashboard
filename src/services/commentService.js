import { fetchWithAuth } from './userService';
import { API_URL_EVENT_COMMENTS, API_URL_COMMENTS_UPDATE, API_URL_COMMENTS_DELETE, API_URL_COMMENT_REPLIES, API_URL_COMMENT_REPLIES_CREATE } from './config';

// Get event comments
export const getEventComments = async (eventId) => {
  try {
    const response = await fetchWithAuth(API_URL_EVENT_COMMENTS.replace(':event_id', eventId), {
      method: 'GET',
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting event comments:', error);
    return [];
  }
};

// Create event comment
export const createEventComment = async (eventId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(API_URL_EVENT_COMMENTS.replace(':event_id', eventId), {
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
    console.error('Error creating event comment:', error);
    throw error;
  }
};

// Update comment
export const updateEventComment = async (commentId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('text', commentData.text);
    
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    if (commentData.clearImages) {
      formData.append('clearImages', 'true');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(API_URL_COMMENTS_UPDATE.replace(':id', commentId), {
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
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete comment
export const deleteEventComment = async (commentId) => {
  try {
    const response = await fetchWithAuth(API_URL_COMMENTS_DELETE.replace(':id', commentId), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Get comment replies
export const getCommentReplies = async (eventId, commentId) => {
  try {
    const response = await fetchWithAuth(API_URL_COMMENT_REPLIES.replace(':eventId', eventId).replace(':commentId', commentId), {
      method: 'GET',
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};

// Create comment reply
export const createCommentReply = async (replyData) => {
  try {
    const formData = new FormData();
    formData.append('userId', replyData.userId);
    formData.append('commentId', replyData.commentId);
    formData.append('eventId', replyData.eventId);
    formData.append('text', replyData.text);
    
    if (replyData.images && replyData.images.length > 0) {
      replyData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(API_URL_COMMENT_REPLIES_CREATE, {
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
    console.error('Error creating comment reply:', error);
    throw error;
  }
};