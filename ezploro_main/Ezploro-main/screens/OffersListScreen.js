import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { normalizeImageUrl } from '../utils/image';

export default function OffersListScreen({ route, navigation }) {
  const { offers, title } = route.params;
  const { t } = useTranslation();
  const parsedOffers = Array.isArray(offers) ? offers : [];

  const renderOfferCard = ({ item }) => (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => navigation.navigate('OfferDetails', { offer: item })}
      activeOpacity={0.8}
    >
      <View style={styles.offerCardImageContainer}>
        <Image source={{ uri: normalizeImageUrl(item.image) }} style={styles.offerCardImage} />
        <View style={styles.offerPointsBadge}>
          <Text style={styles.offerPointsText}>{item.points}</Text>
        </View>
      </View>
      <View style={styles.offerCardContent}>
        <Text style={styles.offerCardCompany}>{item.company}</Text>
        <Text style={styles.offerCardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.offerClaimedContainer}>
          <View style={styles.offerClaimedAvatars}>
            <View style={[styles.attendeeAvatar, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.attendeeAvatar, { backgroundColor: '#4ECDC4', marginLeft: -8 }]} />
            <View style={[styles.attendeeAvatar, { backgroundColor: '#45B7D1', marginLeft: -8 }]} />
          </View>
          <Text style={styles.offerClaimedText}>{item.claimedCount} {item.claimedText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t(title)}</Text>
      <FlatList
        data={parsedOffers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.offersList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1B69',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  offersList: {
    paddingBottom: 20,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 15,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    height: 120,
  },
  offerCardImageContainer: {
    width: '35%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#2D1B69',
  },
  offerCardImage: {
    width: '90%',
    height: '90%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  offerPointsBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  offerPointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerCardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  offerCardCompany: {
    color: '#B8B8B9',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  offerCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  offerClaimedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerClaimedAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  offerClaimedText: {
    color: '#B8B8B9',
    fontSize: 12,
  },
});