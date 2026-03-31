///Users/mac/Desktop/pet/petbridge-mobile-v2/app/sightings/all.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/authStore';
import { sightingService, type Sighting } from '../../src/services/sightingService';
import { router } from 'expo-router';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';

const getSituationBadge = (situation: string) => {
  switch (situation) {
    case 'BLESSE':
      return { text: 'Blessé', color: '#FFFFFF', bg: '#FF4444' };
    case 'EN_BONNE_SANTE':
      return { text: 'En bonne santé', color: '#FFFFFF', bg: '#4ECDC4' };
    case 'AGRESSIF':
      return { text: 'Agressif', color: '#FFFFFF', bg: '#FF6B35' };
    case 'AVEC_PETITS':
      return { text: 'Avec petits', color: '#2D3436', bg: '#FFE66D' };
    case 'INCONNU':
    default:
      return { text: 'Inconnu', color: '#FFFFFF', bg: '#b2bec3' };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'SIGNALE':
      return { text: 'Signalé', color: '#FFFFFF', bg: '#FF6B35' };
    case 'PRIS_EN_CHARGE':
      return { text: 'Prise en charge', color: '#FFFFFF', bg: '#4ECDC4' };
    case 'SECOURU':
      return { text: 'Secouru', color: '#FFFFFF', bg: '#00b894' };
    case 'NON_TROUVE':
      return { text: 'Introuvable', color: '#FFFFFF', bg: '#b2bec3' };
  }
};

const getTimeAgo = (input: string | Date): string => {
  const now = new Date();
  const past = typeof input === 'string' ? new Date(input) : input;
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
};

type FilterType = 'SIGNALE' | 'PRIS_EN_CHARGE';

export default function AllSightingsScreen() {
  const { user } = useAuthStore();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [filteredSightings, setFilteredSightings] = useState<Sighting[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('SIGNALE');

  useEffect(() => {
    fetchNearbySightings();
    detectLocation();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [sightings, selectedFilter]);

  const detectLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchNearbySightings = async () => {
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const data = await sightingService.getNearbySightings(
          location.latitude,
          location.longitude
        );
        setSightings(data);
      }
    } catch (error) {
      console.error('Error fetching nearby sightings:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (userLocation) {
      return userLocation;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erreur', 'Permission de localisation refusée');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
      return null;
    }
  };

  const applyFilter = () => {
    let filtered = sightings;
    switch (selectedFilter) {
      case 'SIGNALE':
        filtered = sightings.filter(s => s.status === 'SIGNALE');
        break;
      case 'PRIS_EN_CHARGE':
        filtered = sightings.filter(s => s.status === 'PRIS_EN_CHARGE');
        break;
    }
    setFilteredSightings(filtered);
  };

  const renderSightingItem = ({ item }: { item: Sighting }) => {
    const situationBadge = getSituationBadge(item.situation);
    const statusBadge = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.sightingCard}
        onPress={() => router.push(`/sighting/${item.id}`)}
      >
        <View style={styles.cardLeft}>
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>
                {item.situation === 'BLESSE' ? '🤕' : 
                 item.situation === 'EN_BONNE_SANTE' ? '🐾' : 
                 item.situation === 'AGRESSIF' ? '⚡' : 
                 item.situation === 'AVEC_PETITS' ? '👶' : '❓'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardRight}>
          <View style={styles.badgeContainer}>
            <View style={[styles.situationBadge, { backgroundColor: situationBadge.bg }]}>
              <Text style={[styles.situationBadgeText, { color: situationBadge.color }]}>
                {situationBadge.text}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge?.bg || '#b2bec3' }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge?.color || '#FFFFFF' }]}>
                {statusBadge?.text || 'Inconnu'}
              </Text>
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <Text style={styles.timeText}>
            ⏰ {getTimeAgo(item.createdAt)}
          </Text>
          
          {item.status === 'PRIS_EN_CHARGE' && (
            <Text style={styles.takenChargeText}>🙋 Pris en charge</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      emoji="🚨"
      title="Aucun signalement"
      subtitle="Aucun signalement dans cette catégorie pour le moment"
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Signalements proches ({filteredSightings.length})
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'SIGNALE' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('SIGNALE')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'SIGNALE' && styles.filterButtonTextActive,
          ]}>
            🚨 Actives
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'PRIS_EN_CHARGE' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('PRIS_EN_CHARGE')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'PRIS_EN_CHARGE' && styles.filterButtonTextActive,
          ]}>
            🙋 En cours
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sightings List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <FlatList
            data={filteredSightings}
            renderItem={renderSightingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  placeholder: {
    width: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#b2bec3',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#b2bec3',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  sightingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    marginRight: 12,
  },
  cardRight: {
    flex: 1,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  situationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  situationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#b2bec3',
    marginBottom: 8,
  },
  takenChargeText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
});
