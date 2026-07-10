import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useNotifications = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🚀 Initializing notifications hook...');
        
        // Initialize notification service
        const initialized = await notificationService.initialize();
        if (!initialized) {
          console.warn('⚠️ Notification service failed to initialize');
          return;
        }

        // Register device if user is logged in
        if (user?.user_id) {
          const deviceData = await notificationService.registerDevice(user.user_id);
          if (deviceData) {
            console.log('✅ Device registered for notifications');
          }
        }

        // Get push token
        const token = await notificationService.getExpoPushToken();
        if (token) {
          setExpoPushToken(token);
        }

      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      setNotification(notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification tap/response
  const handleNotificationResponse = (response) => {
    const data = response.notification.request.content.data;
    
    try {
      console.log('🎯 Handling notification response:', data);

      if (data.deepLink) {
        handleDeepLink(data.deepLink);
      } else if (data.type) {
        handleNotificationByType(data);
      }
    } catch (error) {
      console.error('❌ Error handling notification response:', error);
    }
  };

  // Handle deep links from notifications
  const handleDeepLink = (deepLink) => {
    console.log('🔗 Handling deep link:', deepLink);
    
    const [screen, id] = deepLink.split('/');
    
    switch (screen) {
      case 'event':
        navigation.navigate('EventDetails', { eventId: id });
        break;
      case 'chat':
        navigation.navigate('Chat', { conversationId: id });
        break;
      case 'group':
        navigation.navigate('GroupChat', { groupId: id });
        break;
      case 'profile':
        navigation.navigate('Profile', { userId: id });
        break;
      default:
        console.warn('⚠️ Unknown deep link:', deepLink);
    }
  };

  // Handle notifications by type
  const handleNotificationByType = (data) => {
    console.log('📋 Handling notification by type:', data.type);
    
    switch (data.type) {
      case 'message':
        if (data.conversationId) {
          navigation.navigate('Chat', { conversationId: data.conversationId });
        }
        break;
      case 'group_message':
        if (data.groupId) {
          navigation.navigate('GroupChat', { groupId: data.groupId });
        }
        break;
      case 'event_join':
      case 'event_reminder':
      case 'event_comment':
      case 'event_like':
        if (data.eventId) {
          navigation.navigate('EventDetails', { eventId: data.eventId });
        }
        break;
      case 'friend_request':
        navigation.navigate('Profile', { tab: 'friends' });
        break;
      default:
        console.warn('⚠️ Unknown notification type:', data.type);
    }
  };

  // Send local notification
  const sendLocalNotification = async (title, body, data = {}) => {
    try {
      return await notificationService.sendLocalNotification(title, body, data);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      return null;
    }
  };

  // Schedule notification
  const scheduleNotification = async (title, body, triggerDate, data = {}) => {
    try {
      return await notificationService.scheduleNotification(title, body, triggerDate, data);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  };

  // Cancel notification
  const cancelNotification = async (identifier) => {
    try {
      return await notificationService.cancelNotification(identifier);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      return false;
    }
  };

  // Get badge count
  const getBadgeCount = async () => {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  };

  // Set badge count
  const setBadgeCount = async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
      return false;
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await setBadgeCount(0);
      console.log('✅ All notifications cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
      return false;
    }
  };

  return {
    expoPushToken,
    notification,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    getBadgeCount,
    setBadgeCount,
    clearAllNotifications,
    handleNotificationResponse,
    handleDeepLink,
  };
};

export default useNotifications;