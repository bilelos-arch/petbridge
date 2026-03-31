import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator,
  Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { checkInService } from '../../src/services/checkInService';
import { useAuthStore } from '../../src/store/authStore';
import LoadingScreen from '../../src/components/LoadingScreen';

const SCORE_EMOJI = ['', '😢', '😕', '😐', '😊', '🤩'];

export default function CheckInsScreen() {
  const { user } = useAuthStore();
  const { adoptionId } = useLocalSearchParams<{ adoptionId?: string }>();
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = adoptionId
        ? await checkInService.getByAdoption(adoptionId)
        : await checkInService.getMyCheckIns();
      setCheckIns(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isPast = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const pending = checkIns.filter(c => c.status === 'EN_ATTENTE');
  const completed = checkIns.filter(c => c.status === 'COMPLETE');

  const renderCheckIn = ({ item }: { item: any }) => {
    const isRequester = item.requestedBy?.id === user?.id;
    const needsResponse = item.status === 'EN_ATTENTE' && !isRequester && isPast(item.scheduledFor);
    const canRespond = item.status === 'EN_ATTENTE' && !isRequester;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/checkins/${item.id}`)}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 10,
          padding: 14, borderWidth: 1,
          borderColor: needsResponse ? '#FF6B35' : '#F0F0F0',
          elevation: needsResponse ? 3 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {item.adoption?.animal?.photoUrl ? (
            <Image source={{ uri: item.adoption.animal.photoUrl }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 22 }}>🐾</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D3436' }} numberOfLines={1}>
              {item.adoption?.animal?.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#b2bec3' }}>
              {isRequester ? 'Demandé par vous' : `Demandé par ${item.requestedBy?.name}`}
            </Text>
          </View>
          <View style={{
            backgroundColor: item.status === 'COMPLETE' ? '#EAFAF4' : needsResponse ? '#FFF0EB' : '#F7F8FA',
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{
              fontSize: 11, fontWeight: '700',
              color: item.status === 'COMPLETE' ? '#00b894' : needsResponse ? '#FF6B35' : '#b2bec3',
            }}>
              {item.status === 'COMPLETE' ? '✅ Complété' : needsResponse ? '⚠️ À répondre' : '⏳ En attente'}
            </Text>
          </View>
        </View>

        {item.scheduledFor && (
          <Text style={{ fontSize: 12, color: '#b2bec3', marginBottom: 6 }}>
            📅 Prévu le {formatDate(item.scheduledFor)}
          </Text>
        )}

        {item.message && (
          <Text style={{ fontSize: 13, color: '#636e72', fontStyle: 'italic', marginBottom: 8 }} numberOfLines={2}>
            "{item.message}"
          </Text>
        )}

        {item.status === 'COMPLETE' && item.wellbeingScore && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#b2bec3', marginRight: 6 }}>Bien-être :</Text>
            <Text style={{ fontSize: 20 }}>{SCORE_EMOJI[item.wellbeingScore]}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3436', marginLeft: 4 }}>
              {item.wellbeingScore}/5
            </Text>
          </View>
        )}

        {canRespond && (
          <TouchableOpacity
            onPress={() => router.push(`/checkins/${item.id}`)}
            style={{ backgroundColor: '#FF6B35', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>📸 Répondre au check-in</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D3436' }}>🐾 Check-ins</Text>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : checkIns.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🐾</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 8 }}>Aucun check-in</Text>
          <Text style={{ fontSize: 14, color: '#b2bec3', textAlign: 'center' }}>
            Les check-ins apparaissent après une adoption acceptée
          </Text>
        </View>
      ) : (
        <FlatList
          data={checkIns}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} colors={['#FF6B35']} />}
          ListHeaderComponent={
            pending.length > 0 ? (
              <View style={{ backgroundColor: '#FFF0EB', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF6B35' }}>
                  {pending.length} check-in{pending.length > 1 ? 's' : ''} en attente
                </Text>
              </View>
            ) : null
          }
          renderItem={renderCheckIn}
        />
      )}
    </SafeAreaView>
  );
}