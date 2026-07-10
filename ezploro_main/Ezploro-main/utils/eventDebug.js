// utils/eventDebug.js - Debug utility for event creation
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugEventCreation = async (eventData) => {
  console.log('🔍 EVENT DEBUG: Starting event creation debug...');
  
  // Check authentication
  const token = await AsyncStorage.getItem('token');
  const user = await AsyncStorage.getItem('user');
  
  console.log('🔍 EVENT DEBUG: Auth status:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'NO TOKEN',
    hasUser: !!user,
    userPreview: user ? JSON.parse(user).user_id : 'NO USER'
  });
  
  // Check event data
  console.log('🔍 EVENT DEBUG: Event data validation:', {
    hasTitle: !!eventData.title,
    hasResume: !!eventData.resume,
    hasImage: !!eventData.coverImageFile,
    hasDate: !!eventData.date_time,
    hasOrganizer: !!eventData.organizer_id,
    isOnline: eventData.online,
    hasLocation: !!eventData.location || !!eventData.address,
    fullData: eventData
  });
  
  // Check required fields
  const requiredFields = ['title', 'organizer_id', 'date_time'];
  const missingFields = requiredFields.filter(field => !eventData[field]);
  
  if (missingFields.length > 0) {
    console.error('🔍 EVENT DEBUG: Missing required fields:', missingFields);
    return false;
  }
  
  console.log('🔍 EVENT DEBUG: All validations passed!');
  return true;
};

export const testEventCreationAPI = async () => {
  console.log('🔍 EVENT DEBUG: Testing event creation API...');
  
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('🔍 EVENT DEBUG: No token found');
      return false;
    }
    
    const testUrl = 'https://api-v5-backend-ezploro.apps.ezploro.com/api/events';
    
    // Test with a simple GET request first
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔍 EVENT DEBUG: API test response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (response.ok) {
      console.log('🔍 EVENT DEBUG: API is accessible!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('🔍 EVENT DEBUG: API error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('🔍 EVENT DEBUG: Network error:', error.message);
    return false;
  }
};