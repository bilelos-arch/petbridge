import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { sightingService } from '../src/services/sightingService';
import { Sighting } from '../src/services/sightingService';
import SightingCard from '../src/components/SightingCard';
import LoadingScreen from '../src/components/LoadingScreen';

export default function SightingsScreen() {
  const { user } = useAuthStore();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSightings();
  }, []);

  const fetchSightings = async () => {
    try {
      const data = await sightingService.getSightings();
      setSightings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSightings();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Signalements</Text>
        <Text style={styles.subtitle}>{sightings.length} signalement(s)</Text>
      </View>

      <FlatList
        data={sightings}
        renderItem={({ item }) => <SightingCard sighting={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#b2bec3',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});