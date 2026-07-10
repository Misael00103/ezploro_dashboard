import { fetchWithAuth } from './userService';
import { API_URL_CONTACTS, API_URL_CONTACTS_REPLY, API_URL_CONTACTS_LIST } from './config';

// Send a reply for a contact message (Admin)
export const replyContact = async (contactId, replyData = {}) => {
  try {
    const responseMessage = replyData.message || replyData.reply || replyData.body || replyData.content || '';
    const payload = {
      response_message: responseMessage,
      reply: responseMessage,
      message: responseMessage,
      body: responseMessage,
      content: responseMessage,
      contact_id: contactId,
      contactId,
      id: contactId,
      subject: replyData.subject || '',
      email: replyData.email || '',
      name: replyData.name || '',
      ...replyData,
    };

    const response = await fetchWithAuth(`${API_URL_CONTACTS_REPLY}/${contactId}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return { ok: true, response };
  } catch (error) {
    console.error('Error replying to contact:', error);
    throw error;
  }
};

// Create new contact message
export const createContact = async (contactData) => {
  try {
    const response = await fetchWithAuth(API_URL_CONTACTS, {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    return response;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

// Get all contacts (Admin)
export const getContacts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    
    // Default limit to 100 to load all contacts as requested
    const limit = params.limit || 100;
    queryParams.append('limit', limit);
    
    if (params.offset) queryParams.append('offset', params.offset);
    
    const url = queryParams.toString() ? `${API_URL_CONTACTS_LIST}?${queryParams}` : API_URL_CONTACTS_LIST;
    console.log('🔵 Fetching contacts from:', url);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    console.log('✅ Contacts API response:', response);
    const contacts = response.data?.messages || response.messages || response.data || response || [];
    console.log('✅ Processed contacts:', contacts);
    return contacts;
  } catch (error) {
    console.error('❌ Error getting contacts:', error);
    // Return empty array instead of throwing to prevent dashboard from breaking
    return [];
  }
};

// Update contact status (Admin)
export const updateContactStatus = async (contactId, status) => {
  try {
    // Map frontend statuses to the valid backend statuses: pending, read, responded, archived
    let backendStatus = status;
    if (status === 'resolved') {
      backendStatus = 'responded';
    } else if (status === 'unread') {
      backendStatus = 'pending';
    }

    const response = await fetchWithAuth(`${API_URL_CONTACTS_LIST}/${contactId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: backendStatus }),
    });
    return response;
  } catch (error) {
    console.error('Error updating contact status:', error);
    throw error;
  }
};

// Delete contact message (Admin)
export const deleteContact = async (contactId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_CONTACTS_LIST}/${contactId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};

// Get newsletter stats (Admin)
export const getNewsletterStats = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL_CONTACTS}/newsletter/stats`, {
      method: 'GET',
    });
    return response.data || response;
  } catch (error) {
    console.error('Error getting newsletter stats:', error);
    return {
      total_subscribers: 0,
      recent_subscribers: 0
    };
  }
};