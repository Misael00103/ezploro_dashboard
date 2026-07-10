import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    API_URL_NOTIFICATIONS,
    API_URL_NOTIFICATIONS_PREFERENCES,
    API_URL_NOTIFICATIONS_READ,
    API_URL_NOTIFICATIONS_READ_ALL,
    API_URL_NOTIFICATIONS_REGISTER_DEVICE,
    API_URL_NOTIFICATIONS_STATS,
} from '../config';

console.log('🔔 Notifications module loaded:', !!Notifications);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('📱 Received notification:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Configure notification categories for interactive notifications
const setupNotificationCategories = async () => {
  try {
    await Notifications.setNotificationCategoryAsync('message', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'mark_read',
        buttonTitle: 'Mark as Read',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('event', [
      {
        identifier: 'view_event',
        buttonTitle: 'View Event',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'remind_later',
        buttonTitle: 'Remind Later',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    console.log('✅ Notification categories configured');
  } catch (error) {
    console.error('❌ Error setting up notification categories:', error);
  }
};

export const notificationService = {
  // Initialize notification system
  initialize: async () => {
    try {
      console.log('🚀 Initializing notification service...');
      
      // Setup notification categories
      await setupNotificationCategories();
      
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  },

  // Request notification permissions
  requestPermissions: async () => {
    try {
      console.log('🔐 Requesting notification permissions...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  },

  // Get Expo push token
  getExpoPushToken: async () => {
    try {
      console.log('🎫 Getting Expo push token...');
      
      const projectId = '9dfeb152-c479-48d7-91fb-c7b8d4715aba'; // Expo project ID from app.json
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('✅ Expo push token obtained:', token.data);
      await AsyncStorage.setItem('expoPushToken', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error);
      return null;
    }
  },

  // Register device with backend
  registerDevice: async (userId) => {
    try {
      console.log('📱 Registering device for user:', userId);
      
      const hasPermissions = await notificationService.requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      const expoPushToken = await notificationService.getExpoPushToken();
      if (!expoPushToken) {
        return null;
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_REGISTER_DEVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: expoPushToken,
          deviceType: 'mobile',
          platform: Platform.OS,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Device registered successfully');
      return data;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }
  },

  // Send local notification
  sendLocalNotification: async (title, body, data = {}, categoryIdentifier = null) => {
    try {
      console.log('📢 Sending local notification:', title);
      
      const notificationContent = {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidImportance.HIGH,
        vibrate: [0, 250, 250, 250],
      };

      if (categoryIdentifier) {
        notificationContent.categoryIdentifier = categoryIdentifier;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });

      console.log('✅ Local notification sent with ID:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      return null;
    }
  },

  // Schedule notification for later
  scheduleNotification: async (title, body, triggerDate, data = {}) => {
    try {
      console.log('⏰ Scheduling notification for:', triggerDate);
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log('✅ Notification scheduled with ID:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  },

  // Cancel scheduled notification
  cancelNotification: async (identifier) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('✅ Notification cancelled:', identifier);
      return true;
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      return false;
    }
  },

  // Get all scheduled notifications
  getScheduledNotifications: async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Scheduled notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Fetch notifications from server
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const timestamp = Date.now();
      const url = `${API_URL_NOTIFICATIONS}?page=${page}&limit=${limit}&_t=${timestamp}`;
      
      console.log('📥 Fetching notifications from server...');
      console.log('🔗 URL:', url);
      console.log('🎫 Token available:', !!token);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('📱 Raw response data:', data);
      console.log('📱 Data type:', typeof data);
      console.log('📱 Is array:', Array.isArray(data));
      
      // Handle different response formats
      if (Array.isArray(data)) {
        console.log('✅ Direct array format, length:', data.length);
        return data;
      } else if (data && Array.isArray(data.notifications)) {
        console.log('✅ Nested notifications format, length:', data.notifications.length);
        return data.notifications;
      } else if (data && Array.isArray(data.data)) {
        console.log('✅ Nested data format, length:', data.data.length);
        return data.data;
      } else {
        console.warn('⚠️ Unexpected notifications response format:', data);
        console.log('📱 Available keys:', Object.keys(data || {}));
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_READ.replace(':id', notificationId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Notification marked as read:', notificationId);
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_READ_ALL, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ All notifications marked as read');
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_PREFERENCES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.preferences || data;
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      return null;
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_PREFERENCES, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      return false;
    }
  },

  // Get notification statistics
  getStats: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(API_URL_NOTIFICATIONS_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      return { total: 0, unread: 0 };
    }
  },
};

export default notificationService;