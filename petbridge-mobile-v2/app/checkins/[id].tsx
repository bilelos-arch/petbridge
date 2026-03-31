import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { checkInService } from '../../src/services/checkInService';
import { useAuthStore } from '../../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '../../src/lib/axios';
import { showToast } from '../../src/components/Toast';
import LoadingScreen from '../../src/components/LoadingScreen';

const SCORES = [
  { value: 1, emoji: '😢', label: 'Très mal' },
  { value: 2, emoji: '😕', label: 'Pas bien' },
  { value: 3, emoji: '😐', label: 'Correct' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🤩', label: 'Excellent' },
];

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [checkIn, setCheckIn] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseNote, setResponseNote] = useState('');
  const [wellbeingScore, setWellbeingScore] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // On charge via getMyCheckIns et on filtre par id
        const all = await checkInService.getMyCheckIns();
        const found = all.find((c: any) => c.id === id);
        setCheckIn(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    setIsUploading(true);
    try {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: 'checkin.jpg' } as any);
      const res = await axiosInstance.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(res.data.url);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'uploader la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!wellbeingScore) {
      Alert.alert('Attention', 'Veuillez donner une note de bien-être');
      return;
    }
    setIsSubmitting(true);
    try {
      await checkInService.respond(id, { responseNote, photoUrl: photoUrl || undefined, wellbeingScore });
      showToast.success('Réponse envoyée !');
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (!checkIn) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
      <Text style={{ color: '#b2bec3' }}>Check-in introuvable</Text>
    </View>
  );

  const isRequester = checkIn.requestedBy?.id === user?.id;
  const canRespond = checkIn.status === 'EN_ATTENTE' && !isRequester;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D3436' }}>Détail check-in</Text>
        </View>

        {/* Animal card */}
        <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 }}>
          {checkIn.adoption?.animal?.photoUrl ? (
            <Image source={{ uri: checkIn.adoption.animal.photoUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 14 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 26 }}>🐾</Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D3436' }}>{checkIn.adoption?.animal?.name}</Text>
            <Text style={{ fontSize: 13, color: '#b2bec3', marginTop: 2 }}>
              {checkIn.status === 'COMPLETE' ? '✅ Check-in complété' : '⏳ En attente de réponse'}
            </Text>
          </View>
        </View>

        {/* Message demande */}
        {checkIn.message && (
          <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 16, elevation: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3436', marginBottom: 8 }}>
              💬 Message de {checkIn.requestedBy?.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#636e72', fontStyle: 'italic', lineHeight: 22 }}>"{checkIn.message}"</Text>
          </View>
        )}

        {/* Réponse si complété */}
        {checkIn.status === 'COMPLETE' && (
          <View style={{ backgroundColor: '#EAFAF4', marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#00b894', marginBottom: 12 }}>✅ Réponse de {checkIn.respondedBy?.name}</Text>
            {checkIn.wellbeingScore && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, color: '#636e72', marginRight: 8 }}>Bien-être :</Text>
                <Text style={{ fontSize: 24 }}>{['', '😢', '😕', '😐', '😊', '🤩'][checkIn.wellbeingScore]}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D3436', marginLeft: 6 }}>{checkIn.wellbeingScore}/5</Text>
              </View>
            )}
            {checkIn.responseNote && (
              <Text style={{ fontSize: 14, color: '#2D3436', lineHeight: 22 }}>{checkIn.responseNote}</Text>
            )}
            {checkIn.photoUrl && (
              <Image source={{ uri: checkIn.photoUrl }} style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 12 }} resizeMode="cover" />
            )}
          </View>
        )}

        {/* Formulaire de réponse */}
        {canRespond && (
          <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, padding: 16, elevation: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3436', marginBottom: 16 }}>📸 Votre réponse</Text>

            {/* Score bien-être */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636e72', marginBottom: 10 }}>Note de bien-être *</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              {SCORES.map(s => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setWellbeingScore(s.value)}
                  style={{ alignItems: 'center', opacity: wellbeingScore === s.value ? 1 : 0.4 }}
                >
                  <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
                  <Text style={{ fontSize: 10, color: '#636e72', marginTop: 2 }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636e72', marginBottom: 8 }}>Photo de l'animal</Text>
            <TouchableOpacity
              onPress={pickPhoto}
              style={{ borderWidth: 2, borderColor: '#E8ECEF', borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }}
            >
              {isUploading ? (
                <ActivityIndicator color="#FF6B35" />
              ) : photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 160, borderRadius: 10 }} resizeMode="cover" />
              ) : (
                <>
                  <Text style={{ fontSize: 32, marginBottom: 6 }}>📷</Text>
                  <Text style={{ fontSize: 13, color: '#b2bec3' }}>Ajouter une photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Message */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636e72', marginBottom: 8 }}>Message (optionnel)</Text>
            <TextInput
              value={responseNote}
              onChangeText={setResponseNote}
              placeholder="Comment va l'animal ? Racontez-nous..."
              placeholderTextColor="#b2bec3"
              multiline
              numberOfLines={4}
              style={{ backgroundColor: '#F7F8FA', borderWidth: 1.5, borderColor: '#E8ECEF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3436', height: 100, textAlignVertical: 'top', marginBottom: 16 }}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !wellbeingScore}
              style={{ backgroundColor: wellbeingScore ? '#FF6B35' : '#E8ECEF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting
                ? <ActivityIndicator color="#FFF" />
                : <Text style={{ color: wellbeingScore ? '#FFF' : '#b2bec3', fontSize: 16, fontWeight: '700' }}>Envoyer ma réponse</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}