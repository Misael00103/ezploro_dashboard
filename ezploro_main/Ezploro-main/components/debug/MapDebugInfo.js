import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MapDebugInfo = ({ events, userLocation, visible = false }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Map Debug Info</Text>
        
        <Text style={styles.section}>User Location:</Text>
        <Text style={styles.text}>
          Lat: {userLocation?.latitude?.toFixed(6) || 'N/A'}
        </Text>
        <Text style={styles.text}>
          Lon: {userLocation?.longitude?.toFixed(6) || 'N/A'}
        </Text>
        
        <Text style={styles.section}>Events:</Text>
        <Text style={styles.text}>Total: {events?.length || 0}</Text>
        
        {events?.slice(0, 3).map((event, index) => (
          <View key={index} style={styles.eventItem}>
            <Text style={styles.eventTitle}>
              {event.title || 'No title'}
            </Text>
            <Text style={styles.text}>
              ID: {event.event_id || event.id || 'N/A'}
            </Text>
            <Text style={styles.text}>
              Image: {event.cover_image ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.text}>
              Coords: {event.latitude || event.lat || 'N/A'}, {event.longitude || event.lon || 'N/A'}
            </Text>
          </View>
        ))}
        
        {events?.length > 3 && (
          <Text style={styles.text}>... and {events.length - 3} more</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 250,
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 10,
    zIndex: 1000,
  },
  scrollView: {
    maxHeight: 280,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  eventItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 5,
    borderRadius: 4,
    marginBottom: 5,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
});

export default MapDebugInfo;