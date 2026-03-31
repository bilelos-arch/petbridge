import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Alert, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Animal } from '../../src/types/animal';
import { animalService } from '../../src/services/animalService';
import { useAuthStore } from '../../src/store/authStore';
import { adoptionService } from '../../src/services/adoptionService';
import { checkInService } from '../../src/services/checkInService';
import AdoptionTimeline from '../../src/components/AdoptionTimeline';
import { showToast } from '../../src/components/Toast';
import LoadingScreen from '../../src/components/LoadingScreen';


const { width } = Dimensions.get('window');

const formatAge = (age?: number) => {
  if (age === undefined || age === null) return null;
  if (age === 0) return '< 1 mois';
  if (age < 12) return `${age} mois`;
  const years = Math.floor(age / 12);
  const months = age % 12;
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} ${months} mois`;
};

const speciesEmoji: Record<string, string> = {
  CHIEN: '🐶', CHAT: '🐱', AUTRE: '🐾',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DISPONIBLE:         { label: '✅ Disponible',      color: '#00b894', bg: '#EAFAF4' },
  ATTENTE_VALIDATION: { label: '⏳ En validation',   color: '#e17055', bg: '#FFF4F0' },
  ADOPTE:             { label: '🏠 Adopté',           color: '#636e72', bg: '#F5F5F5' },
  REJETE:             { label: '❌ Rejeté',           color: '#d63031', bg: '#FFF0F0' },
  EN_COURS_ADOPTION:  { label: '🐾 En cours d\'adoption', color: '#4ECDC4', bg: '#E8F5F2' },
};

const SEX_LABEL: Record<string, string> = { MALE: '♂ Mâle', FEMELLE: '♀ Femelle' };
const SIZE_LABEL: Record<string, string> = { PETIT: 'Petit', MOYEN: 'Moyen', GRAND: 'Grand' };
const TEMP_LABEL: Record<string, string> = {
  CALME: '😌 Calme', ACTIF: '⚡ Actif', TIMIDE: '🙈 Timide',
  JOUEUR: '🎾 Joueur', PROTECTEUR: '🛡️ Protecteur',
};

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{
      backgroundColor: bg, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      marginRight: 8, marginBottom: 8,
    }}>
      <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </View>
  );
}

export default function AnimalDetailScreen() {
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [timeline, setTimeline] = useState<any>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Appels API parallèles
        const [animalData, matchingData] = await Promise.all([
          animalService.getAnimalById(id),
          animalService.getMatchingAnimals(),
        ]);
        
        setAnimal(animalData);
        
        // Trouver le matchScore de l'animal actuel
        const matchedAnimal = matchingData.find((a: Animal) => a.id === id);
        if (matchedAnimal && matchedAnimal.matchScore !== undefined) {
          setMatchScore(matchedAnimal.matchScore);
        }

        // Load adoption timeline if animal is in EN_COURS_ADOPTION status
        if (animalData.status === 'EN_COURS_ADOPTION') {
          setIsLoadingTimeline(true);
          try {
            // Essayer d'abord les demandes reçues (donneur)
            let adoptionId = null;
            
            try {
              const receivedRequests = await adoptionService.getReceivedRequests();
              const received = receivedRequests.find(
                (request: any) => request.animalId === id && request.status === 'ACCEPTEE'
              );
              if (received) adoptionId = received.id;
            } catch {}
            
            // Si pas trouvé, essayer les demandes envoyées (adoptant)
            if (!adoptionId) {
              try {
                const myRequests = await adoptionService.getMyRequests();
                const sent = myRequests.find(
                  (request: any) => request.animalId === id && request.status === 'ACCEPTEE'
                );
                if (sent) adoptionId = sent.id;
              } catch {}
            }
            
            if (adoptionId) {
              const timelineData = await checkInService.getTimeline(adoptionId);
              setTimeline(timelineData);
            }
          } catch (timelineError) {
            console.error('Error loading adoption timeline:', timelineError);
          } finally {
            setIsLoadingTimeline(false);
          }
        }
      } catch {
        setError('Animal introuvable');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Récupérer la couleur de la barre de progression selon le score
  const getProgressColor = (score: number) => {
    if (score >= 80) return '#4ECDC4';
    if (score >= 50) return '#FFE66D';
    return '#FF6B35';
  };

  if (isLoading) return <LoadingScreen />;

  if (error || !animal) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>😿</Text>
      <Text style={{ color: '#636e72', fontSize: 16 }}>{error}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#FF6B35', fontWeight: '700' }}>← Retour</Text>
      </TouchableOpacity>
    </View>
  );

  const photos = animal.photos || [];
  const status = STATUS_CONFIG[animal.status] || STATUS_CONFIG['DISPONIBLE'];
  const isAvailable = animal.status === 'DISPONIBLE';
  const isOwner = user?.id === animal?.ownerId;
  
  // Check if user is adopter
  const isAdopter = async () => {
    try {
      const myRequests = await adoptionService.getMyRequests();
      const sent = myRequests.find(
        (request: any) => request.animalId === id && request.status === 'ACCEPTEE'
      );
      return !!sent;
    } catch {
      return false;
    }
  };

  const isProfileComplete = () => {
    const p = user?.profile;
    return !!(
      p?.firstName &&
      p?.lastName &&
      p?.phone &&
      p?.city &&
      p?.housingType &&
      p?.hoursAbsent !== undefined
    );
  };

  const handleSendRequest = async () => {
    setIsSendingRequest(true);
    try {
      await adoptionService.createRequest(animal!.id, adoptMessage || undefined);
      setShowAdoptModal(false);
      setAdoptMessage('');
      showToast.success('Demande envoyée !', 'L\'annonceur recevra votre demande et vous contactera.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Photos ── */}
        <View style={{ position: 'relative' }}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  setCurrentPhoto(Math.round(e.nativeEvent.contentOffset.x / width));
                }}
              >
                {photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.url }}
                    style={{ width, height: 320 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={{
                  position: 'absolute', bottom: 12,
                  flexDirection: 'row', width: '100%', justifyContent: 'center',
                }}>
                  {photos.map((_, i) => (
                    <View key={i} style={{
                      width: i === currentPhoto ? 20 : 6, height: 6,
                      borderRadius: 3, marginHorizontal: 3,
                      backgroundColor: i === currentPhoto ? '#FF6B35' : 'rgba(255,255,255,0.7)',
                    }} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{
              width, height: 320, backgroundColor: '#FFF0EB',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 80 }}>{speciesEmoji[animal.species]}</Text>
            </View>
          )}

          {/* Bouton retour */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute', top: 48, left: 16,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 20, width: 40, height: 40,
              alignItems: 'center', justifyContent: 'center',
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>

          {/* Badge statut — overlay sur la photo */}
          <View style={{
            position: 'absolute', top: 48, right: 16,
            backgroundColor: status.bg,
            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
            elevation: 3,
          }}>
            <Text style={{ color: status.color, fontWeight: '700', fontSize: 13 }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* ── Contenu ── */}
        <View style={{ padding: 20 }}>

          {/* Nom + emoji */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#2D3436', flex: 1 }}>
              {animal.name}
            </Text>
            <Text style={{ fontSize: 30 }}>{speciesEmoji[animal.species]}</Text>
          </View>

          {/* Tags principaux */}
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 16,
              padding: 16, marginBottom: 16, elevation: 1,
            }}>
              {[
                animal.breed?.name && { icon: '🐾', label: 'Race', value: animal.breed.name },
                animal.sex && { icon: animal.sex === 'MALE' ? '♂' : '♀', label: 'Sexe', value: animal.sex === 'MALE' ? 'Mâle' : 'Femelle' },
                animal.age !== undefined && { icon: '🎂', label: 'Âge', value: formatAge(animal.age) },
                animal.size && { icon: '📏', label: 'Taille', value: SIZE_LABEL[animal.size] || animal.size },
                animal.temperament && { icon: '💫', label: 'Tempérament', value: TEMP_LABEL[animal.temperament]?.split(' ').slice(1).join(' ') || animal.temperament },
                animal.city && { icon: '📍', label: 'Ville', value: animal.city },
              ].filter(Boolean).map((item: any) => (
                <View key={item.label} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1, borderBottomColor: '#F7F8FA',
                }}>
                  <Text style={{ fontSize: 18, width: 32 }}>{item.icon}</Text>
                  <Text style={{ fontSize: 14, color: '#b2bec3', fontWeight: '600', width: 100 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#2D3436', fontWeight: '700', flex: 1 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

          {/* ── Score de Compatibilité ── */}
          {matchScore !== null && (
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 16,
              padding: 16, marginBottom: 16, elevation: 1,
            }}>
              <Text style={{ fontSize: 14, color: '#b2bec3', fontWeight: '600', marginBottom: 12 }}>
                Compatibilité avec vous
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{
                  flex: 1, height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${matchScore}%`,
                    height: '100%',
                    backgroundColor: getProgressColor(matchScore),
                    borderRadius: 5,
                  }} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D3436', minWidth: 50, textAlign: 'right' }}>
                  {matchScore}%
                </Text>
              </View>
            </View>
          )}

          {/* ── Section Santé ── */}
          <View style={{
            backgroundColor: '#FFFFFF', borderRadius: 16,
            padding: 16, marginBottom: 16, elevation: 1,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 12 }}>
              🏥 Santé
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[
                { label: 'Vacciné',    value: animal.vaccinated, icon: '💉' },
                { label: 'Stérilisé', value: animal.spayed,     icon: '✂️' },
                { label: 'Déparasité', value: animal.dewormed,   icon: '💊' },
              ].map((item) => (
                <View key={item.label} style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: item.value ? '#EAFAF4' : '#F5F5F5',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                  }}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#2D3436', fontWeight: '600' }}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: item.value ? '#00b894' : '#b2bec3',
                    marginTop: 2,
                  }}>
                    {item.value ? 'Oui ✓' : 'Non'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Description ── */}
          {animal.description && (
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 16,
              padding: 16, marginBottom: 16, elevation: 1,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 8 }}>
                📝 À propos
              </Text>
              <Text style={{ fontSize: 15, color: '#636e72', lineHeight: 24 }}>
                {animal.description}
              </Text>
            </View>
          )}

          {/* ── Donneur ── */}
          <TouchableOpacity
            onPress={() => router.push(`/user/${animal.owner?.id}`)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#FFFFFF', marginHorizontal: 16,
              marginTop: 12, borderRadius: 14, padding: 14,
              elevation: 1, borderWidth: 1, borderColor: '#F0F0F0',
            }}
          >
            {animal.owner?.profile?.avatarUrl ? (
              <Image
                source={{ uri: animal.owner.profile.avatarUrl }}
                style={{ width: 46, height: 46, borderRadius: 23, marginRight: 12 }}
              />
            ) : (
              <View style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: '#FF6B35', alignItems: 'center',
                justifyContent: 'center', marginRight: 12,
              }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 18 }}>
                  {animal.owner?.profile?.firstName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#b2bec3' }}>Proposé par</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#2D3436' }}>
                {animal.owner?.profile?.firstName} {animal.owner?.profile?.lastName}
              </Text>
              {animal.owner?.profile?.city && (
                <Text style={{ fontSize: 12, color: '#b2bec3' }}>📍 {animal.owner.profile.city}</Text>
              )}
            </View>
            <Text style={{ fontSize: 18, color: '#b2bec3' }}>›</Text>
          </TouchableOpacity>
          
          {/* ── Bouton conditionnel ── */}
          {animal.status === 'EN_COURS_ADOPTION' ? (
            <View style={{ gap: 10 }}>
              {/* Show adoption timeline if user is adoptant or donneur */}
              {isLoadingTimeline && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color="#4ECDC4" />
                  <Text style={{ color: '#b2bec3', marginTop: 8 }}>
                    Chargement du parcours...
                  </Text>
                </View>
              )}
              {!isLoadingTimeline && timeline && (
                <AdoptionTimeline
                  checkIns={timeline.checkIns}
                  progress={timeline.progress}
                  total={timeline.total}
                />
              )}

              {isOwner ? (
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#6C5CE7',
                      borderRadius: 16, paddingVertical: 16,
                      alignItems: 'center', elevation: 4,
                    }}
                    onPress={() => router.push(`/(tabs)/publish?edit=${animal?.id}`)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                      ✏️ Modifier l'annonce
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#FFF0F0',
                      borderRadius: 16, paddingVertical: 16,
                      alignItems: 'center', elevation: 1,
                      borderWidth: 1, borderColor: '#FFD0CC',
                    }}
                    onPress={() => {
                      Alert.alert(
                        'Supprimer l\'annonce',
                        `Êtes-vous sûr de vouloir supprimer l'annonce de ${animal.name} ? Cette action est irréversible.`,
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await animalService.deleteAnimal(animal.id);
                              showToast.success('Annonce supprimée');
                              router.replace('/(tabs)/profile');
                            } catch {
                              showToast.error('Impossible de supprimer cette annonce');
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: '#d63031', fontSize: 16, fontWeight: '700' }}>
                      🗑️ Supprimer l'annonce
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Check if user is adopter or simple visitor
                <View style={{
                  backgroundColor: '#E8F5F2', borderRadius: 16,
                  paddingVertical: 16, alignItems: 'center',
                }}>
                  <Text style={{ color: '#4ECDC4', fontSize: 15, fontWeight: '700' }}>
                    🐾 Adoption en cours de suivi
                  </Text>
                  <Text style={{ color: '#b2bec3', fontSize: 13, marginTop: 4 }}>
                    Cet animal a trouvé sa famille 🎉
                  </Text>
                </View>
              )}
            </View>
          ) : isOwner ? (
            <View style={{ gap: 10 }}>
              {animal.status !== 'ADOPTE' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: '#6C5CE7',
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center', elevation: 4,
                  }}
                  onPress={() => router.push(`/(tabs)/publish?edit=${animal?.id}`)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    ✏️ Modifier l'annonce
                  </Text>
                </TouchableOpacity>
              )}

              {animal.status !== 'ADOPTE' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: '#FFF0F0',
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center', elevation: 1,
                    borderWidth: 1, borderColor: '#FFD0CC',
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Supprimer l\'annonce',
                      `Êtes-vous sûr de vouloir supprimer l'annonce de ${animal.name} ? Cette action est irréversible.`,
                      [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Supprimer',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await animalService.deleteAnimal(animal.id);
                            showToast.success('Annonce supprimée');
                            router.replace('/(tabs)/profile');
                          } catch {
                            showToast.error('Impossible de supprimer cette annonce');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: '#d63031', fontSize: 16, fontWeight: '700' }}>
                    🗑️ Supprimer l'annonce
                  </Text>
                </TouchableOpacity>
              )}

              {animal.status === 'ADOPTE' && (
                <View style={{
                  backgroundColor: '#F5F5F5', borderRadius: 16,
                  paddingVertical: 16, alignItems: 'center',
                }}>
                  <Text style={{ color: '#636e72', fontSize: 15, fontWeight: '600' }}>
                    🏠 Animal adopté — annonce archivée
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={isAvailable ? 0.85 : 1}
              disabled={!isAvailable}
              style={{
                backgroundColor: isAvailable ? '#FF6B35' : '#dfe6e9',
                borderRadius: 16, paddingVertical: 18,
                alignItems: 'center', elevation: isAvailable ? 4 : 0,
              }}
              onPress={() => {
                if (!isProfileComplete()) {
                  Alert.alert(
                    'Profil incomplet',
                    'Veuillez compléter votre profil avant de faire une demande.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Compléter', onPress: () => router.push('/profile/edit') },
                    ]
                  );
                  return;
                }
                setShowAdoptModal(true);
              }}
            >
              <Text style={{
                color: isAvailable ? '#FFFFFF' : '#b2bec3',
                fontSize: 17, fontWeight: '700',
              }}>
                {isAvailable ? '🐾 Demander l\'adoption' : '🔒 Non disponible'}
              </Text>
            </TouchableOpacity>
          )}


        </View>
      </ScrollView>

      <Modal
        visible={showAdoptModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdoptModal(false)}
      >
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
            borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
          }}>
            {/* Handle */}
            <View style={{
              width: 40, height: 4, backgroundColor: '#E8ECEF',
              borderRadius: 2, alignSelf: 'center', marginBottom: 20,
            }} />

            <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D3436', marginBottom: 4 }}>
              🐾 Demande d'adoption
            </Text>
            <Text style={{ fontSize: 14, color: '#b2bec3', marginBottom: 20 }}>
              pour {animal?.name}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636e72', marginBottom: 8 }}>
              Message à l'annonceur (optionnel)
            </Text>
            <TextInput
              value={adoptMessage}
              onChangeText={setAdoptMessage}
              placeholder="Présentez-vous, parlez de votre situation..."
              placeholderTextColor="#b2bec3"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{
                backgroundColor: '#F7F8FA', borderWidth: 1.5,
                borderColor: '#E8ECEF', borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 14, color: '#2D3436',
                height: 120, textAlignVertical: 'top',
                marginBottom: 8,
              }}
            />
            <Text style={{ fontSize: 12, color: '#b2bec3', textAlign: 'right', marginBottom: 20 }}>
              {adoptMessage.length}/500
            </Text>

            <TouchableOpacity
              onPress={handleSendRequest}
              disabled={isSendingRequest}
              style={{
                backgroundColor: '#FF6B35', borderRadius: 14,
                paddingVertical: 16, alignItems: 'center',
                opacity: isSendingRequest ? 0.7 : 1, marginBottom: 12,
              }}
            >
              {isSendingRequest
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    Envoyer la demande
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAdoptModal(false)}
              style={{
                paddingVertical: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#636e72', fontSize: 15, fontWeight: '600' }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}