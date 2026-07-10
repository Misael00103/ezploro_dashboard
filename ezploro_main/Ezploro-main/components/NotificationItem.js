import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationItem = ({ notification, onPress, onMarkAsRead }) => {
  const getIcon = (type) => {
    const icons = {
      like: 'heart',
      comment: 'chatbubble',
      event: 'calendar',
      reminder: 'alarm',
      social: 'people',
      marketing: 'megaphone',
      broadcast: 'radio'
    };
    return icons[type] || 'notifications';
  };

  const getColor = (priority) => {
    const colors = {
      urgent: '#FF4444',
      high: '#FF8800',
      normal: '#4A90E2',
      low: '#888888'
    };
    return colors[priority] || '#4A90E2';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !notification.is_read && styles.unread]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon(notification.type)} 
          size={24} 
          color={getColor(notification.priority)} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>
          {new Date(notification.created_at).toLocaleDateString()}
        </Text>
      </View>

      {!notification.is_read && (
        <TouchableOpacity 
          style={styles.markReadButton}
          onPress={() => onMarkAsRead(notification.notification_id)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center'
  },
  unread: {
    backgroundColor: '#F0F8FF'
  },
  iconContainer: {
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4
  },
  time: {
    fontSize: 12,
    color: '#999999'
  },
  markReadButton: {
    padding: 8
  }
});

export default NotificationItem;