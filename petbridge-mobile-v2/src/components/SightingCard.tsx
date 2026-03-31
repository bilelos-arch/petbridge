import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Sighting } from '../services/sightingService';

interface SightingCardProps {
  sighting: Sighting;
}

export default function SightingCard({ sighting }: SightingCardProps) {
  const getSituationColor = (situation: string) => {
    switch (situation) {
      case 'BLESSE':
        return '#FF6B35';
      case 'EN_BONNE_SANTE':
        return '#00b894';
      case 'AGRESSIF':
        return '#d63031';
      case 'AVEC_PETITS':
        return '#FFE66D';
      default:
        return '#b2bec3';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNALE':
        return '#FF6B35';
      case 'PRIS_EN_CHARGE':
        return '#4ECDC4';
      case 'SECOURU':
        return '#00b894';
      case 'NON_TROUVE':
        return '#b2bec3';
      default:
        return '#b2bec3';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} h`;
    }
    const days = Math.floor(hours / 24);
    return `${days} j`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/sighting/${sighting.id}`)}
    >
      <View style={styles.imageContainer}>
        {sighting.photoUrl ? (
          <Image
            source={{ uri: sighting.photoUrl }}
            style={styles.image}
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>📷</Text>
          </View>
        )}
        <View style={[styles.situationBadge, { backgroundColor: getSituationColor(sighting.situation) }]}>
          <Text style={styles.situationText}>{sighting.situation}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.situation}>{sighting.situation}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(sighting.createdAt)}</Text>
        </View>

        {sighting.description && (
          <Text style={styles.description} numberOfLines={2}>
            {sighting.description}
          </Text>
        )}

        <View style={styles.footerContainer}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(sighting.status) }]} />
            <Text style={styles.statusText}>{sighting.status}</Text>
          </View>
          
          <Text style={styles.coordinates}>
            📍 {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 40,
  },
  situationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  situationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  situation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  timeAgo: {
    fontSize: 12,
    color: '#b2bec3',
  },
  description: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 12,
    lineHeight: 20,
  },
  footerContainer: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#636e72',
  },
  coordinates: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
});