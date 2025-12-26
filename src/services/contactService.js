import { fetchWithAuth } from './userService';
import { API_URL_CONTACTS } from './config';

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
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const url = queryParams.toString() ? `${API_URL_CONTACTS}?${queryParams}` : API_URL_CONTACTS;
    console.log('🔵 Fetching contacts from:', url);
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    console.log('✅ Contacts API response:', response);
    const contacts = response.data || response || [];
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
    const response = await fetchWithAuth(`${API_URL_CONTACTS}/${contactId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response;
  } catch (error) {
    console.error('Error updating contact status:', error);
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