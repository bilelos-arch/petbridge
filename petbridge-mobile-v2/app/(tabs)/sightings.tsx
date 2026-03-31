import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../src/store/authStore';
import { sightingService } from '../../src/services/sightingService';
import { Sighting } from '../../src/services/sightingService';
import { showToast } from '../../src/components/Toast';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function SightingsScreen() {
  const { user } = useAuthStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbySightings, setNearbySightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [situation, setSituation] = useState<'BLESSE' | 'EN_BONNE_SANTE' | 'AGRESSIF' | 'AVEC_PETITS' | 'INCONNU'>('INCONNU');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation refusée');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      fetchNearbySightings(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Erreur location:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbySightings = async (lat: number, lng: number) => {
    try {
      const data = await sightingService.getNearbySightings(lat, lng);
      setNearbySightings(data);
    } catch (error) {
      console.error('Erreur signalements proches:', error);
    }
  };

  const handleTakeCharge = async (id: string) => {
    try {
      await sightingService.takeCharge(id);
      fetchNearbySightings(location!.coords.latitude, location!.coords.longitude);
    } catch (error) {
      console.error('Erreur prise en charge:', error);
      Alert.alert('Erreur', 'Impossible de prendre en charge ce signalement');
    }
  };

  const handleResolve = async (id: string, status: 'SECOURU' | 'NON_TROUVE') => {
    try {
      await sightingService.resolve(id, status);
      fetchNearbySightings(location!.coords.latitude, location!.coords.longitude);
    } catch (error) {
      console.error('Erreur résolution:', error);
      Alert.alert('Erreur', 'Impossible de résoudre ce signalement');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur photo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Erreur', 'Position GPS non disponible');
      return;
    }

    setSubmitting(true);

    try {
      const newSighting = await sightingService.createSighting({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        situation,
        description: description.trim(),
      });

      if (photoUri) {
        await sightingService.uploadPhoto(newSighting.id, photoUri);
      }

      showToast.success('Signalement envoyé');
      resetForm();
      fetchNearbySightings(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Erreur envoi:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSituation('INCONNU');
    setDescription('');
    setPhotoUri(null);
  };

  const getSituationColor = (situation: string) => {
    switch (situation) {
      case 'BLESSE': return '#FF4444';
      case 'EN_BONNE_SANTE': return '#4ECDC4';
      case 'AGRESSIF': return '#FF6B35';
      case 'AVEC_PETITS': return '#FFE66D';
      default: return '#b2bec3';
    }
  };

  const getSituationTextColor = (situation: string) => {
    return situation === 'AVEC_PETITS' ? '#2D3436' : '#FFF';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNALE': return '#FF6B35';
      case 'PRIS_EN_CHARGE': return '#4ECDC4';
      case 'SECOURU': return '#4ECDC4';
      case 'NON_TROUVE': return '#b2bec3';
      default: return '#b2bec3';
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} j`;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const firstSighting = nearbySightings[0];

  return (
    <View style={styles.container}>
      {/* Header with avatar */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' }}>
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
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚨 Signalements proches</Text>
            {nearbySightings.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/sightings/all')}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>Voir tous ({nearbySightings.length}) →</Text>
              </TouchableOpacity>
            )}
          </View>

          {firstSighting ? (
            <TouchableOpacity
              style={styles.sightingCard}
              onPress={() => router.push(`/sighting/${firstSighting.id}`)}
            >
              <View style={styles.cardImageContainer}>
                {firstSighting.photoUrl ? (
                  <Image
                    source={{ uri: firstSighting.photoUrl }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.noImageContainer,
                      { backgroundColor: getSituationColor(firstSighting.situation) },
                    ]}
                  >
                    <Text style={styles.noImageText}>
                      {firstSighting.situation === 'BLESSE' ? '🩹' :
                       firstSighting.situation === 'EN_BONNE_SANTE' ? '😊' :
                       firstSighting.situation === 'AGRESSIF' ? '⚠️' :
                       firstSighting.situation === 'AVEC_PETITS' ? '👶' : '❓'}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.situationBadge,
                    { backgroundColor: getSituationColor(firstSighting.situation) },
                  ]}
                >
                  <Text style={styles.situationBadgeText}>
                    {firstSighting.situation}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(firstSighting.status) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {firstSighting.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                {firstSighting.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {firstSighting.description}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.timeAgo}>⏰ {getTimeAgo(firstSighting.createdAt)}</Text>

                  <View style={styles.cardActions}>
                    {firstSighting.status === 'SIGNALE' && user?.id !== firstSighting.reporterId && (
                      <TouchableOpacity
                        style={styles.takeChargeButton}
                        onPress={() => handleTakeCharge(firstSighting.id)}
                      >
                        <Text style={styles.takeChargeText}>🙋 Je prends en charge</Text>
                      </TouchableOpacity>
                    )}

                    {firstSighting.status === 'PRIS_EN_CHARGE' && user?.id === firstSighting.volunteerId && (
                      <View style={styles.resolveButtons}>
                        <TouchableOpacity
                          style={styles.resolveButton}
                          onPress={() => handleResolve(firstSighting.id, 'SECOURU')}
                        >
                          <Text style={styles.resolveText}>✅ Secouru</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.resolveButton, styles.resolveButtonSecondary]}
                          onPress={() => handleResolve(firstSighting.id, 'NON_TROUVE')}
                        >
                          <Text style={styles.resolveText}>❌ Introuvable</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noSightingsContainer}>
              <Text style={styles.noSightingsText}>✅ Aucune alerte dans votre zone</Text>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>➕ Signaler un animal</Text>

          {location ? (
            <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12, height: 200 }}>
              <WebView
                source={{ html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>* { margin:0; padding:0; } html,body,#map { width:100%; height:100%; }</style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script>
                      const map = L.map('map', { zoomControl: false, dragging: false }).setView([${location.coords.latitude}, ${location.coords.longitude}], 16);
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                      const icon = L.divIcon({ html: '<div style="font-size:30px">🐾</div>', iconSize:[36,36], iconAnchor:[18,36], className:'' });
                      L.marker([${location.coords.latitude}, ${location.coords.longitude}], { icon }).addTo(map);
                      L.circle([${location.coords.latitude}, ${location.coords.longitude}], { radius:50, color:'#FF6B35', fillColor:'#FF6B35', fillOpacity:0.2, weight:2 }).addTo(map);
                    </script>
                  </body>
                  </html>
                ` }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled
              />
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', padding: 8,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{
              height: 200, backgroundColor: '#F0F0F0',
              borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <ActivityIndicator color="#FF6B35" />
              <Text style={{ color: '#b2bec3', marginTop: 8 }}>Détection GPS...</Text>
            </View>
          )}

          <View style={styles.situationChipsContainer}>
            {(['BLESSE', 'EN_BONNE_SANTE', 'AGRESSIF', 'AVEC_PETITS', 'INCONNU'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.situationChip,
                  {
                    backgroundColor: situation === s ? getSituationColor(s) : '#F5F6F8',
                  },
                ]}
                onPress={() => setSituation(s)}
              >
                <Text
                  style={[
                    styles.situationChipText,
                    {
                      color: situation === s ? getSituationTextColor(s) : '#636e72',
                    },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.photoContainer}>
            <TouchableOpacity style={styles.photoPicker} onPress={handlePickImage}>
              <Text style={styles.photoPickerText}>📷 Ajouter une photo</Text>
            </TouchableOpacity>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            )}
          </View>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Description de l'animal et de la situation..."
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: location ? '#FF6B35' : '#b2bec3',
              },
            ]}
            onPress={handleSubmit}
            disabled={!location || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Envoi en cours...' : 'Envoyer le signalement 🚨'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B35',
  },
  noSightingsContainer: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSightingsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sightingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
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
  situationBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  description: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  timeAgo: {
    fontSize: 12,
    color: '#b2bec3',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  takeChargeButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  takeChargeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  resolveButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resolveButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveButtonSecondary: {
    backgroundColor: '#b2bec3',
  },
  resolveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  gpsContainer: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  gpsText: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 4,
  },
  gpsCoords: {
    fontSize: 12,
    color: '#b2bec3',
  },
  situationChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  situationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  situationChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoPicker: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  photoPickerText: {
    fontSize: 14,
    color: '#636e72',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    resizeMode: 'cover',
  },
  descriptionInput: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});