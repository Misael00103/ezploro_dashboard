import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNotifications as useNotificationsContext } from '../context/NotificationsContext';
import { useNotifications as useNotificationsHook } from '../hooks/useNotifications';

const NotificationExample = () => {
    // Use context for server notifications
    const {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        sendLocalNotification: sendLocalFromContext,
    } = useNotificationsContext();

    // Use hook for push notifications
    const {
        expoPushToken,
        notification,
        sendLocalNotification,
        scheduleNotification,
        clearAllNotifications,
    } = useNotificationsHook();

    useEffect(() => {
        console.log('📱 Expo Push Token:', expoPushToken);
        if (expoPushToken) {
            console.log('✅ Push token is available for testing');
        } else {
            console.log('⚠️ Push token not available yet');
        }
    }, [expoPushToken]);

    useEffect(() => {
        if (notification) {
            console.log('📱 New notification received:', notification);
            console.log('📱 Notification content:', notification.request.content);
        }
    }, [notification]);

    // Debug effect to log notifications state
    useEffect(() => {
        console.log('🔔 Notifications state updated:', {
            count: notifications.length,
            unread: unreadCount,
            loading: loading
        });
    }, [notifications, unreadCount, loading]);

    const handleSendLocalNotification = async () => {
        try {
            const result = await sendLocalNotification(
                'Test Notification',
                'This is a test local notification!',
                { type: 'test', timestamp: Date.now() }
            );

            if (result) {
                Alert.alert('Success', 'Local notification sent!');
            } else {
                Alert.alert('Error', 'Failed to send local notification');
            }
        } catch (error) {
            console.error('Error sending local notification:', error);
            Alert.alert('Error', 'Failed to send local notification');
        }
    };

    const handleScheduleNotification = async () => {
        try {
            const triggerDate = new Date(Date.now() + 10000); // 10 seconds from now

            const result = await scheduleNotification(
                'Scheduled Notification',
                'This notification was scheduled 10 seconds ago!',
                triggerDate,
                { type: 'scheduled', timestamp: Date.now() }
            );

            if (result) {
                Alert.alert('Success', 'Notification scheduled for 10 seconds from now!');
            } else {
                Alert.alert('Error', 'Failed to schedule notification');
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
            Alert.alert('Error', 'Failed to schedule notification');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const success = await markAllAsRead();
            if (success) {
                Alert.alert('Success', 'All notifications marked as read!');
            } else {
                Alert.alert('Error', 'Failed to mark notifications as read');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Error', 'Failed to mark notifications as read');
        }
    };

    const handleClearAllNotifications = async () => {
        try {
            const success = await clearAllNotifications();
            if (success) {
                Alert.alert('Success', 'All notifications cleared!');
            } else {
                Alert.alert('Error', 'Failed to clear notifications');
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
            Alert.alert('Error', 'Failed to clear notifications');
        }
    };

    const handleTestPushNotification = async () => {
        if (!expoPushToken) {
            Alert.alert('Error', 'Push token not available. Make sure you have granted notification permissions.');
            return;
        }

        try {
            // This would normally be sent from your server
            // For testing, we'll just show the token
            Alert.alert(
                'Push Token Ready',
                `Your push token is ready for testing:\n\n${expoPushToken.substring(0, 50)}...`,
                [
                    { text: 'Copy Token', onPress: () => console.log('Full token:', expoPushToken) },
                    { text: 'OK' }
                ]
            );
        } catch (error) {
            console.error('Error with push notification test:', error);
            Alert.alert('Error', 'Failed to test push notification');
        }
    };

    const handleCreateTestNotification = async () => {
        try {
            console.log('🧪 Creating test notification on server...');

            // This would create a notification on your server
            // For now, we'll just trigger a refresh to see if the API works
            const result = await fetchNotifications();

            if (result && result.length >= 0) {
                Alert.alert('Success', `API call successful! Found ${result.length} notifications.`);
            } else {
                Alert.alert('Info', 'API call completed but no notifications returned.');
            }
        } catch (error) {
            console.error('Error creating test notification:', error);
            Alert.alert('Error', 'Failed to create test notification');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notification Testing</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Server Notifications</Text>
                <Text style={styles.info}>Total: {notifications.length}</Text>
                <Text style={styles.info}>Unread: {unreadCount}</Text>
                <Text style={styles.info}>Loading: {loading ? 'Yes' : 'No'}</Text>

                <TouchableOpacity style={styles.button} onPress={fetchNotifications}>
                    <Text style={styles.buttonText}>Refresh Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleMarkAllAsRead}>
                    <Text style={styles.buttonText}>Mark All as Read</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleCreateTestNotification}>
                    <Text style={styles.buttonText}>Test API Connection</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Local Notifications</Text>
                <Text style={styles.info}>Push Token: {expoPushToken ? 'Available ✅' : 'Not available ❌'}</Text>
                <Text style={styles.info}>Token Length: {expoPushToken ? expoPushToken.length : 0}</Text>

                <TouchableOpacity style={styles.button} onPress={handleSendLocalNotification}>
                    <Text style={styles.buttonText}>Send Local Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleScheduleNotification}>
                    <Text style={styles.buttonText}>Schedule Notification (10s)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleClearAllNotifications}>
                    <Text style={styles.buttonText}>Clear All Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleTestPushNotification}>
                    <Text style={styles.buttonText}>Test Push Token</Text>
                </TouchableOpacity>
            </View>

            {notification && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Last Notification</Text>
                    <Text style={styles.info}>Title: {notification.request.content.title}</Text>
                    <Text style={styles.info}>Body: {notification.request.content.body}</Text>
                    <Text style={styles.info}>Data: {JSON.stringify(notification.request.content.data)}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debug Info</Text>
                <Text style={styles.info}>Component Loaded: ✅</Text>
                <Text style={styles.info}>Context Available: {notifications ? '✅' : '❌'}</Text>
                <Text style={styles.info}>Hook Available: {expoPushToken !== undefined ? '✅' : '❌'}</Text>
                <Text style={styles.info}>Timestamp: {new Date().toLocaleTimeString()}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    info: {
        fontSize: 14,
        marginBottom: 5,
        color: '#666',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NotificationExample;