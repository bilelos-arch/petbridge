import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView, Alert, Image, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animal } from '../../src/types/animal';
import { getMatchingAnimals, animalService } from '../../src/services/animalService';
import { useAuthStore } from '../../src/store/authStore';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { sightingService, type Sighting } from '../../src/services/sightingService';
import EmptyState from '../../src/components/EmptyState';
import AnimalCard from '../../src/components/AnimalCard';
import LoadingScreen from '../../src/components/LoadingScreen';

const { width } = Dimensions.get('window');

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

const styles = StyleSheet.create({
  latestAnimalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  latestAnimalPhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12
  },
  latestAnimalPhotoImg: {
    width: '100%',
    height: '100%'
  },
  latestAnimalPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  latestAnimalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  latestAnimalBreed: {
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
  latestAnimalCity: {
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
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 102,
  },
});

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

const getTimeAgo = (input: string | Date) => {
const date = typeof input === 'string' ? new Date(input) : input;
const now = new Date();
const diffMs = now.getTime() - date.getTime();
const diffMins = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMins < 60) {
  return `${diffMins} min`;
} else if (diffHours < 24) {
  return `${diffHours}h`;
} else {
  return `${diffDays}j`;
}
};

export default function HomeScreen() {
  const [matchingAnimals, setMatchingAnimals] = useState<Animal[]>([]);
  const [nearbySightings, setNearbySightings] = useState<Sighting[]>([]);
  const [latestAnimals, setLatestAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [isLatestLoading, setIsLatestLoading] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const { user, token } = useAuthStore();
  const matchingFlatListRef = useRef<FlatList>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    if (!token) return;
    const loadAllData = async () => {
      if (!token) return;
      setIsLoading(true);
      
      setIsMatchingLoading(true);
      try {
        const result = await getMatchingAnimals();
        setMatchingAnimals(result);
      } catch (error) {
        console.error('Error loading matching animals:', error);
      } finally {
        setIsMatchingLoading(false);
      }

      // Load nearby sightings
      setIsNearbyLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const sightings = await sightingService.getNearbySightings(
            location.coords.latitude,
            location.coords.longitude
          );
          setNearbySightings(sightings);
        }
      } catch (error) {
        console.error('Error loading nearby sightings:', error);
      } finally {
        setIsNearbyLoading(false);
      }

      setIsLatestLoading(true);
      try {
        const result = await animalService.getLatestAnimals(5);
        setLatestAnimals(result);
      } catch (error) {
        console.error('Error loading latest animals:', error);
      } finally {
        setIsLatestLoading(false);
      }

      setIsLoading(false);
    };

    loadAllData();
  }, [user, token]);

  const isProfileComplete = user?.profile?.preferredSpecies && user.profile.preferredSize;

  const handleMatchingScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / 172); // 160 + 12 margin
    setActiveDot(index);
  };

  const renderMatchingCard = ({ item }: { item: Animal }) => (
    <AnimalCard animal={item} variant="horizontal" showMatchScore={true} />
  );

  const renderNearbyCard = ({ item }: { item: Animal }) => {
    const primaryPhoto = item.photos?.find(photo => photo.isPrimary) || item.photos?.[0] || null;
    
    return (
      <TouchableOpacity
        style={{ width: 160, height: 200, marginRight: 12, borderRadius: 16, overflow: 'hidden' }}
        onPress={() => router.push(`/animal/${item.id}`)}
      >
        {/* Background Image */}
        {primaryPhoto ? (
          <Image
            source={{ uri: primaryPhoto.url }}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#E8ECEF', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}

        {/* Dark Overlay */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }} />

        {/* Animal Info */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 4,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {item.name}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#FFFFFF',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            📍 {item.city || 'Ville inconnue'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLatestItem = ({ item }: { item: Animal }) => (
    <View style={{ paddingHorizontal: 16 }}>
      <AnimalCard animal={item} variant="list" />
    </View>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F5' }}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      
      {/* Header nouveau */}
      <View style={{ backgroundColor: '#FF6B35', paddingBottom: 24 }}>
        <SafeAreaView edges={['top']}>
          {/* Ligne avatar + salutation */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'flex-start', paddingHorizontal: 20,
            paddingTop: 12, marginBottom: 16,
          }}>
            <View>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Bonjour {user?.profile?.firstName || 'Toi'} 👋
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 }}>
                Trouvez votre compagnon
              </Text>
            </View>
            {/* Avatar → Profil */}
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
              }}
            >
              {user?.profile?.avatarUrl ? (
                <Image source={{ uri: user.profile.avatarUrl }}
                       style={{ width: 38, height: 38, borderRadius: 19 }} />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  {user?.profile?.firstName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explorer')}
            style={{
              backgroundColor: '#fff', borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center',
              marginHorizontal: 20, gap: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: '#b2bec3' }}>🔍</Text>
            <Text style={{ fontSize: 14, color: '#b2bec3' }}>Rechercher un animal...</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Filtres rapides */}
      <View style={{
        backgroundColor: '#fff', paddingHorizontal: 16,
        paddingVertical: 12, flexDirection: 'row', gap: 8,
        borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0',
      }}>
        {['Tous', 'Chiens', 'Chats', 'Autres'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => router.push(`/(tabs)/explorer`)}
            style={{
              backgroundColor: f === 'Tous' ? '#FF6B35' : '#F5F5F5',
              borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: '600',
              color: f === 'Tous' ? '#fff' : '#636e72',
            }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Compatibles avec vous */}
        <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 20, marginBottom: 0 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D3436' }}>🐾 Compatibles avec vous</Text>
            <Text style={{ fontSize: 14, color: '#b2bec3', marginTop: 2 }}>Glissez pour voir plus</Text>
          </View>

          {!isProfileComplete ? (
            <EmptyState
              emoji="🐾"
              title="Complétez votre profil"
              subtitle="Pour voir les animaux compatibles avec vous"
              buttonLabel="Compléter le profil"
              onPress={() => router.push('/profile/edit')}
            />
          ) : isMatchingLoading ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={{ marginTop: 8, color: '#b2bec3', fontSize: 14 }}>Chargement...</Text>
            </View>
          ) : matchingAnimals.length > 0 ? (
            <View>
              <FlatList
                ref={matchingFlatListRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                data={matchingAnimals}
                keyExtractor={(item) => item.id}
                renderItem={renderMatchingCard}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
                onScroll={handleMatchingScroll}
                scrollEventThrottle={16}
              />
              {/* Pagination Dots */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                {matchingAnimals.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: index === activeDot ? 12 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === activeDot ? '#FF6B35' : '#E8ECEF',
                      marginHorizontal: 4,
                    }}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
              <Text style={{ fontSize: 14, color: '#b2bec3', textAlign: 'center' }}>
                Aucun animal compatible pour le moment
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: Alertes proches */}
        {locationPermission !== 'denied' && (
          <View style={{ backgroundColor: '#FFF5F5', paddingVertical: 20, marginBottom: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D3436' }}>
                🚨 Alertes proches
              </Text>
              <TouchableOpacity onPress={() => router.push('/sightings/all')}>
                <Text style={{ fontSize: 13, color: '#FF6B35', fontWeight: '700' }}>
                  Voir tous →
                </Text>
              </TouchableOpacity>
            </View>

            {isNearbyLoading ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={{ marginTop: 8, color: '#b2bec3', fontSize: 14 }}>Chargement...</Text>
              </View>
            ) : nearbySightings.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={nearbySightings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const situationBadge = getSituationBadge(item.situation);
                  return (
                    <TouchableOpacity
                      style={{
                        width: 200, marginRight: 12, borderRadius: 16,
                        backgroundColor: '#FFFFFF', overflow: 'hidden',
                        elevation: 3, shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08, shadowRadius: 8,
                      }}
                      onPress={() => router.push(`/sighting/${item.id}`)}
                    >
                      {/* Photo ou fond coloré */}
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }}
                               style={{ width: '100%', height: 100 }} resizeMode="cover" />
                      ) : (
                        <View style={{
                          width: '100%', height: 100,
                          backgroundColor: situationBadge.bg,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 36 }}>
                            {item.situation === 'BLESSE' ? '🤕' :
                             item.situation === 'EN_BONNE_SANTE' ? '🐾' :
                             item.situation === 'AGRESSIF' ? '⚡' :
                             item.situation === 'AVEC_PETITS' ? '🐣' : '❓'}
                          </Text>
                        </View>
                      )}

                      {/* Badge EN COURS si pris en charge */}
                      {item.status === 'PRIS_EN_CHARGE' && (
                        <View style={{
                          position: 'absolute', top: 8, right: 8,
                          backgroundColor: '#4ECDC4', borderRadius: 10,
                          paddingHorizontal: 8, paddingVertical: 4,
                        }}>
                          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                            🙋 En cours
                          </Text>
                        </View>
                      )}

                      {/* Contenu */}
                      <View style={{ padding: 12 }}>
                        {/* Badge situation */}
                        <View style={{
                          backgroundColor: situationBadge.bg, borderRadius: 8,
                          paddingHorizontal: 8, paddingVertical: 3,
                          alignSelf: 'flex-start', marginBottom: 8,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: situationBadge.color }}>
                            {situationBadge.text}
                          </Text>
                        </View>

                        {/* Description */}
                        {item.description ? (
                          <Text style={{ fontSize: 12, color: '#636e72', marginBottom: 8 }}
                                numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}

                        {/* Localisation exacte */}
                        <Text style={{ fontSize: 11, color: '#4ECDC4', fontWeight: '600', marginBottom: 4 }}>
                          📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </Text>

                        {/* Temps */}
                        <Text style={{ fontSize: 11, color: '#b2bec3' }}>
                          ⏰ Il y a {getTimeAgo(item.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
              />
            ) : (
              <EmptyState
                emoji="✅"
                title="Aucune alerte proche"
                subtitle="Votre zone est calme pour le moment"
              />
            )}
          </View>
        )}

        {/* Section 3: Nouveaux arrivants */}
        <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 20, marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D3436' }}>🆕 Nouveaux arrivants</Text>
          </View>

          {isLatestLoading ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={{ marginTop: 8, color: '#b2bec3', fontSize: 14 }}>Chargement...</Text>
            </View>
          ) : latestAnimals.length > 0 ? (
            <View>
              {latestAnimals.map((item) => (
                <AnimalCard key={item.id} animal={item} variant="list" />
              ))}
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
              <Text style={{ fontSize: 14, color: '#b2bec3', textAlign: 'center' }}>
                Aucun nouveau animal
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}