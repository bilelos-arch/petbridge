import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator,
  Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import axiosInstance from '../../src/lib/axios';
import { useAuthStore } from '../../src/store/authStore';
import { checkInService } from '../../src/services/checkInService';
import { threadService } from '../../src/services/threadService';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';

type NotifType = 'adoption_received' | 'adoption_update' | 'checkin' | 'animal_status';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  subtitle: string;
  photoUrl?: string;
  date: string;
  urgent: boolean;
  action?: () => void;
}

interface Thread {
  id: string;
  lastMessage: { id: string; content: string; mediaUrl?: string; 
                  createdAt: string; isRead: boolean; sender: any } | string;
  date: string;
  unreadCount: number;
  photoUrl?: string;
  participants: { firstName: string; lastName: string }[];
  adoption?: { animal: { name: string } };
}

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const { user, setNotifBadgeCount } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      setNotifBadgeCount(0);
      load();
    }, [activeTab])
  );
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildNotifs = async () => {
    const all: Notif[] = [];

    try {
      // Demandes reçues
      const received = await axiosInstance.get('/adoptions/received');
      for (const req of received.data || []) {
        const photo = req.animal?.photos?.find((p: any) => p.isPrimary)?.url || req.animal?.photos?.[0]?.url;
        const adopterName = `${req.adopter?.profile?.firstName || ''} ${req.adopter?.profile?.lastName || ''}`.trim() || 'Quelqu\'un';
        
        if (req.status === 'EN_ATTENTE') {
          all.push({
            id: `adoption_recv_${req.id}`,
            type: 'adoption_received',
            title: `Nouvelle demande pour ${req.animal?.name}`,
            subtitle: `${adopterName} souhaite adopter votre animal`,
            photoUrl: photo,
            date: req.createdAt,
            urgent: true,
            action: () => router.push('/(tabs)/profile'),
          });
        }
      }

      // Demandes envoyées — mise à jour statut
      const sent = await axiosInstance.get('/adoptions/my-requests');
      for (const req of sent.data || []) {
        const photo = req.animal?.photos?.find((p: any) => p.isPrimary)?.url || req.animal?.photos?.[0]?.url;
        if (req.status === 'ACCEPTEE') {
          all.push({
            id: `adoption_acc_${req.id}`,
            type: 'adoption_update',
            title: `✅ Demande acceptée !`,
            subtitle: `Votre demande pour ${req.animal?.name} a été acceptée`,
            photoUrl: photo,
            date: req.decidedAt || req.updatedAt,
            urgent: false,
            action: () => req.thread?.id ? router.push(`/thread/${req.thread.id}`) : router.push('/(tabs)/profile'),
          });
        } else if (req.status === 'REFUSEE') {
          all.push({
            id: `adoption_ref_${req.id}`,
            type: 'adoption_update',
            title: `❌ Demande refusée`,
            subtitle: `Votre demande pour ${req.animal?.name} a été refusée`,
            photoUrl: photo,
            date: req.decidedAt || req.updatedAt,
            urgent: false,
            action: () => router.push('/(tabs)/profile'),
          });
        }
      }

      // Mes annonces — statut admin
      const myAnimals = await axiosInstance.get('/animals/my');
      for (const animal of myAnimals.data || []) {
        const photo = animal.photos?.find((p: any) => p.isPrimary)?.url || animal.photos?.[0]?.url;
        if (animal.status === 'DISPONIBLE' && animal.publishedAt) {
          all.push({
            id: `animal_approved_${animal.id}`,
            type: 'animal_status',
            title: `✅ Annonce validée`,
            subtitle: `${animal.name} est maintenant visible par tous`,
            photoUrl: photo,
            date: animal.publishedAt,
            urgent: false,
            action: () => router.push(`/animal/${animal.id}`),
          });
        } else if (animal.status === 'REJETE') {
          all.push({
            id: `animal_rejected_${animal.id}`,
            type: 'animal_status',
            title: `❌ Annonce rejetée`,
            subtitle: `${animal.name} a été rejeté${animal.rejectedReason ? ` : ${animal.rejectedReason}` : ''}`,
            photoUrl: photo,
            date: animal.updatedAt,
            urgent: true,
            action: () => router.push(`/animal/${animal.id}`),
          });
        }
      }

      // Check-ins à répondre
      const checkIns = await checkInService.getMyCheckIns();
      for (const ci of checkIns || []) {
        const dueDate = ci.dueDate || ci.scheduledFor;
        const isDue = dueDate ? new Date(dueDate) <= new Date() : false;
        
        if (ci.status === 'EN_ATTENTE' && ci.requestedBy?.id !== user?.id && isDue) {
          all.push({
            id: `checkin_${ci.id}`,
            type: 'checkin',
            title: `🐾 Check-in à répondre`,
            subtitle: `Comment va ${ci.adoption?.animal?.name} ?`,
            photoUrl: ci.adoption?.animal?.photoUrl,
            date: ci.scheduledFor || ci.createdAt,
            urgent: true,
            action: () => router.push(`/checkins/${ci.id}`),
          });
        }
      }

    } catch (e) {
      console.error('Erreur notifs:', e);
    }

    // Trier par date décroissante
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setNotifs(all);
  };

  const loadThreads = async () => {
    try {
      const data = await threadService.getThreads();
      setThreads(data);
    } catch (e) {
      console.error('Erreur threads:', e);
    }
  };

  const load = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    if (activeTab === 'notifications') {
      await buildNotifs();
    } else {
      await loadThreads();
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  };


  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}j`;
  };

  const TYPE_COLORS: Record<NotifType, string> = {
    adoption_received: '#FF6B35',
    adoption_update: '#00b894',
    checkin: '#6C5CE7',
    animal_status: '#0984e3',
  };

  const urgentCount = notifs.filter(n => n.urgent).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#2D3436', letterSpacing: -0.5 }}>
            📱 Activité
          </Text>
          {activeTab === 'notifications' && urgentCount > 0 && (
            <Text style={{ fontSize: 13, color: '#FF6B35', fontWeight: '600', marginTop: 2 }}>
              {urgentCount} action{urgentCount > 1 ? 's' : ''} requise{urgentCount > 1 ? 's' : ''}
            </Text>
          )}
      </View>
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

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 12 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: activeTab === 'notifications' ? '#FF6B35' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '800',
            color: activeTab === 'notifications' ? '#FFFFFF' : '#2D3436',
          }}>
            🔔 Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: activeTab === 'messages' ? '#FF6B35' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '800',
            color: activeTab === 'messages' ? '#FFFFFF' : '#2D3436',
          }}>
            💬 Messages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'notifications' ? (
        // Notifications
        isLoading ? (
          <LoadingScreen />
        ) : notifs.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="Tout est à jour"
            subtitle="Vos notifications apparaîtront ici"
          />
        ) : (
          <FlatList
            data={notifs}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} colors={['#FF6B35']} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={item.action}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: item.urgent ? '#FFFAF8' : '#FFFFFF',
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
                  borderLeftWidth: item.urgent ? 3 : 0,
                  borderLeftColor: '#FF6B35',
                }}
              >
                {/* Photo */}
                <View style={{ marginRight: 14 }}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={{ width: 50, height: 50, borderRadius: 25 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 22 }}>🐾</Text>
                    </View>
                  )}
                  <View style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: TYPE_COLORS[item.type],
                    borderWidth: 2, borderColor: '#FFF',
                  }} />
                </View>

                {/* Texte */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: item.urgent ? '800' : '700', color: '#2D3436' }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#636e72', marginTop: 2 }} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </View>

                {/* Temps */}
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 11, color: '#b2bec3' }}>{getTimeAgo(item.date)}</Text>
                  <Text style={{ fontSize: 16, color: '#b2bec3', marginTop: 4 }}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        // Messages
        isLoading ? (
          <LoadingScreen />
        ) : threads.length === 0 ? (
          <EmptyState
            emoji="💬"
            title="Aucune conversation"
            subtitle="Vos messages apparaîtront ici après une adoption acceptée"
          />
        ) : (
          <FlatList
            data={threads}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} colors={['#FF6B35']} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/thread/${item.id}`)}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
                }}
              >
                {/* Photo */}
                <View style={{ marginRight: 14 }}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={{ width: 50, height: 50, borderRadius: 25 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 22 }}>🐾</Text>
                    </View>
                  )}
                </View>

                {/* Texte */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#2D3436' }} numberOfLines={1}>
                    {item.adoption?.animal?.name || item.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#636e72', marginTop: 2 }} numberOfLines={2}>
                    {typeof item.lastMessage === 'string' ? item.lastMessage : item.lastMessage?.content || 'Aucun message'}
                  </Text>
                </View>

                {/* Temps et badge */}
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 11, color: '#b2bec3' }}>{getTimeAgo(item.date)}</Text>
                  {item.unreadCount > 0 && (
                    <View style={{
                      marginTop: 4,
                      backgroundColor: '#FF6B35',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ fontSize: 11, color: 'white', fontWeight: '700' }}>
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 16, color: '#b2bec3', marginTop: 4 }}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}