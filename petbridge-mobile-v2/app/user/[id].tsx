import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Image, TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import axiosInstance from '../../src/lib/axios';
import { threadService } from '../../src/services/threadService';
import { useAuthStore } from '../../src/store/authStore';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedThread, setSharedThread] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/users/${id}/public`);
        setProfile(res.data);

        // Chercher un thread commun
        try {
          const threads = await threadService.getThreads();
          const found = threads.find((t: any) => t.otherUser?.id === id);
          if (found) setSharedThread(found);
        } catch {}
      } catch (e) {
        console.error('Erreur profil public:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const isViewingAdopter = currentUser?.id !== id;

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );

  if (!profile) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
      <Text style={{ color: '#b2bec3' }}>Profil introuvable</Text>
    </View>
  );

  const fullName = `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim() || 'Utilisateur';
  const isAdopter = profile.role === 'ADOPTANT';

  const InfoRow = ({ icon, label, value }: any) => value != null && value !== '' ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
      <Text style={{ fontSize: 18, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#b2bec3', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: '#2D3436', fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          {profile.profile?.avatarUrl ? (
            <Image source={{ uri: profile.profile.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
          ) : (
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 36, color: '#FFF', fontWeight: '700' }}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D3436', marginTop: 12 }}>{fullName}</Text>
          {profile.profile?.city && (
            <Text style={{ fontSize: 14, color: '#b2bec3', marginTop: 4 }}>📍 {profile.profile.city}</Text>
          )}
          <View style={{ backgroundColor: isAdopter ? '#EEF3FF' : '#FFF0EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isAdopter ? '#5B8DEF' : '#FF6B35' }}>
              {isAdopter ? '🐾 Adoptant' : '🏡 Annonceur'}
            </Text>
          </View>
        </View>

        {/* Infos complètes si adoptant */}
        {isAdopter && profile.profile && (
          <View style={{ backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3436', marginBottom: 12 }}>Dossier d'adoption</Text>
            <InfoRow icon="📞" label="Téléphone" value={profile.profile.phone} />
            <InfoRow icon="🏠" label="Type de logement" value={profile.profile.housingType} />
            <InfoRow icon="📐" label="Surface" value={profile.profile.surfaceArea ? `${profile.profile.surfaceArea} m²` : null} />
            <InfoRow icon="🌿" label="Jardin" value={profile.profile.hasGarden != null ? (profile.profile.hasGarden ? 'Oui' : 'Non') : null} />
            <InfoRow icon="👶" label="Enfants" value={profile.profile.hasChildren != null ? (profile.profile.hasChildren ? 'Oui' : 'Non') : null} />
            <InfoRow icon="🐶" label="Autres animaux" value={profile.profile.hasOtherPets != null ? (profile.profile.hasOtherPets ? profile.profile.otherPetsDesc || 'Oui' : 'Non') : null} />
            <InfoRow icon="⏰" label="Heures d'absence/jour" value={profile.profile.hoursAbsent != null ? `${profile.profile.hoursAbsent}h` : null} />
            <InfoRow icon="✨" label="Expérience animaux" value={profile.profile.hasPetExperience != null ? (profile.profile.hasPetExperience ? profile.profile.petExpDesc || 'Oui' : 'Non') : null} />
          </View>
        )}

        {/* Infos minimales si annonceur */}
        {!isAdopter && profile.profile && (
          <View style={{ backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3436', marginBottom: 12 }}>À propos</Text>
            <InfoRow icon="📞" label="Téléphone" value={profile.profile.phone} />
            <InfoRow icon="📍" label="Ville" value={profile.profile.city} />
          </View>
        )}
        {sharedThread && (
          <TouchableOpacity
            onPress={() => router.push(`/thread/${sharedThread.id}`)}
            style={{
              marginHorizontal: 16, marginBottom: 24,
              backgroundColor: '#EEF3FF', borderRadius: 14,
              paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>💬</Text>
            <Text style={{ color: '#5B8DEF', fontWeight: '800', fontSize: 15 }}>
              Ouvrir la conversation
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}