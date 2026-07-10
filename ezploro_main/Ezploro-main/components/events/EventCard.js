import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEventImageUrl } from '../../hooks/useImageUrl';

const EventCard = ({ event, onPress, onLike, isLiked = false }) => {
  const imageUrl = useEventImageUrl(event.cover_image);
  
  const formatPrice = (price) => {
    if (price === 0 || price === '0') return 'Gratis';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const dateInfo = {
    month: new Date(event.date_time).toLocaleDateString('en', { month: 'short' }),
    day: new Date(event.date_time).getDate(),
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.9}
    >
      {/* Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Date Badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        <Text style={styles.dateDay}>{dateInfo.day}</Text>
      </View>

      {/* Heart Icon */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onLike && onLike(event.event_id);
        }}
        style={styles.heartButton}
      >
        <Ionicons 
          name={isLiked ? "heart" : "heart-outline"} 
          size={24} 
          color={isLiked ? "#EF4444" : "#FFFFFF"} 
        />
      </TouchableOpacity>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <Text style={styles.price}>
          {formatPrice(event.price)}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#D1D5DB" />
          <Text style={styles.location} numberOfLines={1}>
            {event.city || event.address || 'Ubicación TBD'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Attendees */}
          <View style={styles.attendees}>
            <View style={styles.avatarGroup}>
              <View style={[styles.avatar, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.avatar, { backgroundColor: '#3B82F6', marginLeft: -8 }]} />
              <View style={[styles.avatar, { backgroundColor: '#10B981', marginLeft: -8 }]} />
            </View>
            <Text style={styles.attendeeCount}>
              +{event.interested_count || event.subscribers_count || 0}
            </Text>
          </View>

          {/* Get Now Button */}
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Ver Más</Text>
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  dateBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateMonth: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  dateDay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    color: '#D1D5DB',
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  attendeeCount: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EventCard;
