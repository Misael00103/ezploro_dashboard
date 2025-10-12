import { API_URL_EVENTS } from './config';
import { fetchWithAuth } from './userService';

export const getEvents = async () => {
  try {
    // Events endpoint doesn't require auth according to backend
    const response = await fetch(API_URL_EVENTS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('Error en getEvents:', error);
    return [];
  }
};

export const updateEvent = async (eventData) => {
  try {
    const response = await fetchWithAuth(`${API_URL_EVENTS}/${eventData.id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    return response.data;
  } catch (error) {
    console.error('Error en updateEvent:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_EVENTS}/${eventId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    console.error('Error en deleteEvent:', error);
    throw error;
  }
};

export const updateEvents = updateEvent;