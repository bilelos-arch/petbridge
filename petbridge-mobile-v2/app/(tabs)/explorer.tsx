import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAnimals } from '../../src/services/animalService';
import { Animal } from '../../src/types/animal';
import { useAuthStore } from '../../src/store/authStore';
import EmptyState from '../../src/components/EmptyState';
import AnimalCard from '../../src/components/AnimalCard';
import LoadingScreen from '../../src/components/LoadingScreen';

const { height } = Dimensions.get('window');

export default function ExplorerScreen() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    species: '',
    size: '',
    temperament: '',
  });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFiltersModalVisible, setIsFiltersModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const speciesOptions = [
    { label: 'Tous', value: '' },
    { label: 'Chien', value: 'CHIEN' },
    { label: 'Chat', value: 'CHAT' },
    { label: 'Autre', value: 'AUTRE' },
  ];

  const sizeOptions = [
    { label: 'Tous', value: '' },
    { label: 'Petit', value: 'PETIT' },
    { label: 'Moyen', value: 'MOYEN' },
    { label: 'Grand', value: 'GRAND' },
  ];

  const temperamentOptions = [
    { label: 'Tous', value: '' },
    { label: 'Calme', value: 'CALME' },
    { label: 'Actif', value: 'ACTIF' },
    { label: 'Timide', value: 'TIMIDE' },
    { label: 'Joueur', value: 'JOUEUR' },
    { label: 'Protecteur', value: 'PROTECTEUR' },
  ];

  const fetchAnimals = async (pageNumber: number = 1, refresh: boolean = false) => {
    if (!hasMore && !refresh) return;
    
    setLoading(true);
    try {
      const response = await getAnimals({
        ...filters as any,
        page: pageNumber,
        limit: 10,
      });
      
      const newAnimals = response || [];
      
      if (refresh) {
        setAnimals(newAnimals);
      } else {
        setAnimals(prev => [...prev, ...newAnimals]);
      }
      
      setHasMore(newAnimals.length === 10);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchAnimals(page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchAnimals(1, true);
  };

  const applyFilters = () => {
    setPage(1);
    setHasMore(true);
    setIsFiltersModalVisible(false);
    fetchAnimals(1, true);
  };

  const resetFilters = () => {
    setFilters({
      species: '',
      size: '',
      temperament: '',
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredAnimals(animals);
    } else {
      setFilteredAnimals(
        animals.filter(a => 
          a.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, animals]);

  useEffect(() => {
    fetchAnimals(1, true);
  }, []);

  const getSpeciesEmoji = (species: string) => {
    switch (species) {
      case 'CHIEN':
        return '🐶';
      case 'CHAT':
        return '🐱';
      default:
        return '🐾';
    }
  };

  const getTemperamentStyles = (temperament: string) => {
    switch (temperament) {
      case 'ACTIF':
        return { backgroundColor: '#FF6B35', color: 'white' };
      case 'CALME':
        return { backgroundColor: '#4ECDC4', color: 'white' };
      case 'JOUEUR':
        return { backgroundColor: '#FFE66D', color: '#2D3436' };
      case 'TIMIDE':
        return { backgroundColor: '#b2bec3', color: 'white' };
      case 'PROTECTEUR':
        return { backgroundColor: '#2D3436', color: 'white' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#666' };
    }
  };

  const renderAnimalItem = ({ item }: { item: Animal }) => (
    viewMode === 'grid' ? (
      <View style={{ flex: 1, paddingRight: 8 }}>
        <AnimalCard animal={item} variant="vertical" />
      </View>
    ) : (
      <AnimalCard animal={item} variant="list" />
    )
  );

  const renderEmptyState = () => (
    <EmptyState
      emoji="🔍"
      title="Aucun animal trouvé"
      subtitle="Essayez de modifier vos filtres ou votre recherche"
    />
  );

  return (
    <View style={styles.container}>
      {/* Header with search, filters button and avatar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un animal..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setIsFiltersModalVisible(true)}
        >
          <Text style={styles.filtersButtonText}>🎛️ Filtres</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* View Mode Toggle */}
        <TouchableOpacity
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#FFF0EB',
            alignItems: 'center', justifyContent: 'center',
          }}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons
            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
            size={18}
            color="#FF6B35"
          />
        </TouchableOpacity>
        {/* Avatar */}
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#FFF0EB',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {user?.profile?.avatarUrl ? (
            <Image source={{ uri: user.profile.avatarUrl }}
                   style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 13 }}>
              {user?.profile?.firstName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Animals List */}
      <FlatList
        data={filteredAnimals}
        renderItem={renderAnimalItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={viewMode === 'grid' ? styles.gridContent : styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        numColumns={viewMode === 'grid' ? 2 : 1}
        ItemSeparatorComponent={viewMode === 'list' ? () => <View style={styles.itemSeparator} /> : null}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF6B35" />
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={isFiltersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFiltersModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFiltersModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetButton}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Species Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Espèce</Text>
                <View style={styles.filterChipsContainer}>
                  {speciesOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        filters.species === option.value && styles.activeFilterChip,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, species: option.value }))}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.species === option.value && styles.activeFilterChipText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Size Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Taille</Text>
                <View style={styles.filterChipsContainer}>
                  {sizeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        filters.size === option.value && styles.activeFilterChip,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, size: option.value }))}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.size === option.value && styles.activeFilterChipText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Temperament Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tempérament</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.temperamentScrollView}
                >
                  <View style={styles.filterChipsContainerHorizontal}>
                    {temperamentOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterChip,
                          filters.temperament === option.value && styles.activeFilterChip,
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, temperament: option.value }))}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filters.temperament === option.value && styles.activeFilterChipText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  filtersButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  filtersBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 80,
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  animalImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
  },
  animalImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImagePlaceholderText: {
    fontSize: 40,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  animalBreed: {
    fontSize: 13,
    color: '#b2bec3',
  },
  ageBadge: {
    backgroundColor: '#FFF0EB',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  ageText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  animalCity: {
    fontSize: 12,
    color: '#4ECDC4',
    marginBottom: 6,
  },
  temperamentChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  temperamentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#b2bec3',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 102,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    fontSize: 14,
    color: '#999',
  },
  modalBody: {
    flex: 1,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChipsContainerHorizontal: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  activeFilterChip: {
    backgroundColor: '#FF6B35',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterChipText: {
    color: 'white',
  },
  temperamentScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  modalFooter: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});