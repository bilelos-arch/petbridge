import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useEffect, useCallback } from 'react';
import { useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axiosInstance from '../../src/lib/axios';
import { useAuthStore } from '../../src/store/authStore';
import { checkInService } from '../../src/services/checkInService';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  const iconName = focused ? name : `${name}-outline` as IoniconsName;
  return (
    <Ionicons
      name={iconName}
      size={24}
      color={focused ? '#FF6B35' : '#b2bec3'}
    />
  );
}

function BadgeIcon({ name, focused, count }: { name: IoniconsName; focused: boolean; count: number }) {
  const iconName = focused ? name : `${name}-outline` as IoniconsName;
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons
        name={iconName}
        size={24}
        color={focused ? '#FF6B35' : '#b2bec3'}
      />
      {count > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: '#FF3B30', borderRadius: 10,
          minWidth: 18, height: 18, alignItems: 'center',
          justifyContent: 'center', paddingHorizontal: 4,
          borderWidth: 2, borderColor: '#FFFFFF',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user, token, notifBadgeCount, setNotifBadgeCount } = useAuthStore();
  const insets = useSafeAreaInsets();
  const currentRouteName = useNavigationState(state =>
    state?.routes?.[state?.index]?.name
  );
  const isOnNotifTab = currentRouteName === 'notifications';

  const fetchBadges = useCallback(async () => {
    if (!token) return;
    
    // Si on est sur l'onglet notifications, ne pas recalculer le badge
    if (isOnNotifTab) {
      setNotifBadgeCount(0);
      return;
    }
    
    try {
      // Notifications urgentes
      const [receivedRes, myAnimalsRes, checkInsRes, sentRes] = await Promise.all([
        axiosInstance.get('/adoptions/received'),
        axiosInstance.get('/animals/my'),
        checkInService.getMyCheckIns(),
        axiosInstance.get('/adoptions/my-requests'),
      ]);

      let urgentCount = 0;

      // Demandes reçues EN_ATTENTE
      urgentCount += (receivedRes.data || []).filter((r: any) => r.status === 'EN_ATTENTE').length;

      // Annonces rejetées
      urgentCount += (myAnimalsRes.data || []).filter((a: any) => a.status === 'REJETE').length;

      // Check-ins à répondre (seulement ceux dont la date est arrivée)
      urgentCount += (checkInsRes || []).filter((c: any) => {
        const dueDate = c.dueDate || c.scheduledFor;
        const isDue = dueDate ? new Date(dueDate) <= new Date() : false;
        return c.status === 'EN_ATTENTE' && c.requestedBy?.id !== user?.id && isDue;
      }).length;

      // Demandes acceptées/refusées
      urgentCount += (sentRes.data || []).filter((r: any) =>
        r.status === 'ACCEPTEE' || r.status === 'REFUSEE'
      ).length;

      setNotifBadgeCount(urgentCount);
    } catch (e) {}
  }, [token, user?.id, setNotifBadgeCount, isOnNotifTab]);

  useEffect(() => {
    if (!isOnNotifTab) {
      fetchBadges();
    }
    const interval = setInterval(() => {
      if (!isOnNotifTab) {
        fetchBadges();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchBadges, isOnNotifTab]);

  return (
    <Tabs
     screenOptions={{
       headerShown: false,
       tabBarStyle: {
         backgroundColor: '#FFFFFF',
         borderTopWidth: 0.5,
         borderTopColor: '#E0E0E0',
         height: 60 + insets.bottom,
         paddingBottom: insets.bottom || 10,
         paddingTop: 5,
       },
       tabBarActiveTintColor: '#FF6B35',
       tabBarInactiveTintColor: '#b2bec3',
       tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
     }}
   >
     <Tabs.Screen
       name="index"
       options={{
         title: 'Accueil',
         tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
       }}
     />
     <Tabs.Screen
       name="explorer"
       options={{
         title: 'Explorer',
         tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} />,
       }}
     />
     <Tabs.Screen
       name="publish"
       options={{
         title: '',
         tabBarIcon: () => (
           <View style={{
             width: 52, height: 52, borderRadius: 26,
             backgroundColor: '#FF6B35',
             alignItems: 'center', justifyContent: 'center',
             marginBottom: 20,
             elevation: 8,
             borderWidth: 4,
             borderColor: '#FFF8F5',
           }}>
             <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
           </View>
         ),
         tabBarLabel: () => null,
       }}
     />
     <Tabs.Screen
       name="sightings"
       options={{
         title: 'Signaler',
         tabBarIcon: ({ focused }) => <TabIcon name="alert-circle" focused={focused} />,
       }}
     />
     <Tabs.Screen
       name="notifications"
       options={{
         title: 'Activité',
         tabBarIcon: ({ focused }) => (
           <BadgeIcon name="notifications" focused={focused} count={notifBadgeCount} />
         ),
       }}
     />
     <Tabs.Screen
       name="profile"
       options={{ href: null }}
     />
    </Tabs>
  );
}