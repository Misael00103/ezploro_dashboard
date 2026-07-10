import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';

console.log('Notifications module (pushNotifications):', Notifications);

if (Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
export const pushNotifications = {
  registerForPushNotifications: async () => {
    let token;
    try {
      if (!Notifications) {
        console.warn('Notifications module not available');
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (!Device.isDevice) {
        alert('Must use physical device for push notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      })).data;

      await AsyncStorage.setItem('pushToken', token);
      await notificationService.registerDevice(token);

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  setupNotificationListeners: (navigation) => {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return { notificationListener: null, responseListener: null };
    }

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      if (data.eventId) {
        navigation.navigate('EventDetails', { eventId: data.eventId });
      } else if (data.userId) {
        navigation.navigate('OtherProfile', { userId: data.userId });
      } else if (data.screen) {
        navigation.navigate(data.screen, data.params || {});
      }
    });

    return { notificationListener, responseListener };
  },

  removeNotificationListeners: ({ notificationListener, responseListener }) => {
    if (notificationListener) {
      Notifications.removeNotificationSubscription(notificationListener);
    }
    if (responseListener) {
      Notifications.removeNotificationSubscription(responseListener);
    }
  },

  scheduleLocalNotification: async (title, body, data = {}, seconds = 1) => {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: 'default' },
        trigger: { seconds },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  cancelAllScheduledNotifications: async () => {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return;
    }
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },

  getBadgeCount: async () => {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return 0;
    }
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  },

  setBadgeCount: async (count) => {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return;
    }
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },
};