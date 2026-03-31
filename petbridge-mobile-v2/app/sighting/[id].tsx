///Users/mac/Desktop/pet/petbridge-mobile-v2/app/sighting/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { sightingService } from '../../src/services/sightingService';
import { showToast } from '../../src/components/Toast';
import LoadingScreen from '../../src/components/LoadingScreen';
import { WebView } from 'react-native-webview';


const SITUATION_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  BLESSE:          { label: 'Blessé',         color: '#fff', bg: '#FF4444', emoji: '🤕' },
  EN_BONNE_SANTE:  { label: 'En bonne santé', color: '#fff', bg: '#4ECDC4', emoji: '🐾' },
  AGRESSIF:        { label: 'Agressif',        color: '#fff', bg: '#FF6B35', emoji: '⚡' },
  AVEC_PETITS:     { label: 'Avec petits',     color: '#2D3436', bg: '#FFE66D', emoji: '🐣' },
  INCONNU:         { label: 'Inconnu',         color: '#fff', bg: '#b2bec3', emoji: '❓' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SIGNALE:         { label: '🚨 Signalé',           color: '#FF6B35', bg: '#FFF0EB' },
  PRIS_EN_CHARGE:  { label: '🙋 Pris en charge',    color: '#4ECDC4', bg: '#E8FAF9' },
  SECOURU:         { label: '✅ Secouru',            color: '#00b894', bg: '#EAFAF4' },
  NON_TROUVE:      { label: '❌ Introuvable',        color: '#b2bec3', bg: '#F5F5F5' },
};

const getTimeAgo = (input: string | Date): string => {
  const now = new Date();
  const past = new Date(input);
  const diffMins = Math.floor((now.getTime() - past.getTime()) / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.floor(diffHours / 24)}j`;
};

export default function SightingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [sighting, setSighting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const data = await sightingService.getSightingById(id);
      setSighting(data);
    } catch (e) {
      console.error('Erreur chargement signalement:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeCharge = async () => {
    setIsActing(true);
    try {
      await sightingService.takeCharge(id);
      await load();
      showToast.success('Signalement pris en charge');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible');
    } finally {
      setIsActing(false);
    }
  };

  const handleResolve = async (status: 'SECOURU' | 'NON_TROUVE') => {
    Alert.alert(
      status === 'SECOURU' ? 'Animal secouru ✅' : 'Animal introuvable ❌',
      'Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsActing(true);
            try {
              await sightingService.resolve(id, status);
              Alert.alert(
                status === 'SECOURU' ? '🦸 Merci !' : 'Dommage',
                status === 'SECOURU'
                  ? 'Vous avez sauvé un animal ! Badge Sauveur débloqué 🏆'
                  : 'Merci d\'avoir essayé.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (e: any) {
              Alert.alert('Erreur', e?.response?.data?.message || 'Impossible');
            } finally {
              setIsActing(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  if (!sighting) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
      <Text style={{ color: '#b2bec3' }}>Signalement introuvable</Text>
    </View>
  );

  const situation = SITUATION_CONFIG[sighting.situation] || SITUATION_CONFIG['INCONNU'];
  const statusConfig = STATUS_CONFIG[sighting.status] || STATUS_CONFIG['SIGNALE'];
  const isReporter = user?.id === sighting.reporterId;
  const isVolunteer = user?.id === sighting.volunteerId;
  const canTakeCharge = sighting.status === 'SIGNALE' && !isReporter;
  const canResolve = sighting.status === 'PRIS_EN_CHARGE' && isVolunteer;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D3436', flex: 1 }}>
            Détail du signalement
          </Text>
          {/* Badge statut */}
          <View style={{
            backgroundColor: statusConfig.bg, borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ color: statusConfig.color, fontSize: 12, fontWeight: '700' }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Carte Leaflet / OSM */}
        <View style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, marginBottom: 16, height: 220 }}>
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
                  const map = L.map('map', { zoomControl: false, dragging: false }).setView([${sighting.latitude}, ${sighting.longitude}], 16);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                  const icon = L.divIcon({ html: '<div style="font-size:30px">🐾</div>', iconSize:[36,36], iconAnchor:[18,36], className:'' });
                  L.marker([${sighting.latitude}, ${sighting.longitude}], { icon }).addTo(map);
                  L.circle([${sighting.latitude}, ${sighting.longitude}], { radius:50, color:'#FF6B35', fillColor:'#FF6B35', fillOpacity:0.2, weight:2 }).addTo(map);
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
            backgroundColor: 'rgba(0,0,0,0.55)', padding: 10,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              📍 {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${sighting.latitude}&mlon=${sighting.longitude}#map=16/${sighting.latitude}/${sighting.longitude}`)}
              style={{ backgroundColor: '#FF6B35', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Ouvrir Maps →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo si disponible */}
        {sighting.photoUrl && (
          <View style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, marginBottom: 16 }}>
            <Image
              source={{ uri: sighting.photoUrl }}
              style={{ width: '100%', height: 200 }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Infos */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16, margin: 16,
          padding: 16, elevation: 1,
        }}>
          {/* Badge situation */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{
              backgroundColor: situation.bg, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}>
              <Text style={{ fontSize: 16 }}>{situation.emoji}</Text>
              <Text style={{ color: situation.color, fontSize: 13, fontWeight: '700' }}>
                {situation.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          {sighting.description && (
            <Text style={{ fontSize: 14, color: '#636e72', lineHeight: 22, marginBottom: 12 }}>
              {sighting.description}
            </Text>
          )}

          {/* Temps */}
          <Text style={{ fontSize: 13, color: '#b2bec3', marginBottom: 8 }}>
            ⏰ {getTimeAgo(sighting.createdAt)}
          </Text>

          {/* Signaleur */}
          {sighting.reporter?.profile && (
            <Text style={{ fontSize: 13, color: '#b2bec3' }}>
              👤 Signalé par {sighting.reporter.profile.firstName} {sighting.reporter.profile.lastName}
            </Text>
          )}

          {/* Bénévole */}
          {sighting.volunteer?.profile && (
            <Text style={{ fontSize: 13, color: '#4ECDC4', marginTop: 4 }}>
              🙋 Pris en charge par {sighting.volunteer.profile.firstName} {sighting.volunteer.profile.lastName}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={{ marginHorizontal: 16 }}>
          {canTakeCharge && (
            <TouchableOpacity
              onPress={handleTakeCharge}
              disabled={isActing}
              style={{
                backgroundColor: '#FF6B35', borderRadius: 16,
                paddingVertical: 16, alignItems: 'center',
                opacity: isActing ? 0.7 : 1, marginBottom: 12,
              }}
            >
              {isActing
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    🙋 Je prends en charge
                  </Text>
              }
            </TouchableOpacity>
          )}

          {canResolve && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleResolve('SECOURU')}
                disabled={isActing}
                style={{
                  flex: 1, backgroundColor: '#00b894', borderRadius: 16,
                  paddingVertical: 16, alignItems: 'center',
                  opacity: isActing ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>✅ Secouru</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleResolve('NON_TROUVE')}
                disabled={isActing}
                style={{
                  flex: 1, backgroundColor: '#b2bec3', borderRadius: 16,
                  paddingVertical: 16, alignItems: 'center',
                  opacity: isActing ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>❌ Introuvable</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}