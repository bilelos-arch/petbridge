import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axiosInstance from '../lib/axios';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      console.log('[Push] Ignoré sur web');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Push] Permission existante:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log('[Push] Permission finale:', finalStatus);
    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 'c9751b9e-301a-4f42-895b-ef09e7db6ff6';
    console.log('[Push] Project ID:', projectId);

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Token obtenu:', token.data);
    return token.data;
  } catch (e) {
    console.error('[Push] Erreur:', e);
    return null;
  }
}

const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
  housingType?: string;
  surfaceArea?: number;
  hasGarden?: boolean;
  hasChildren?: boolean;
  childrenAges?: number[];
  hasOtherPets?: boolean;
  otherPetsDesc?: string;
  hoursAbsent?: number;
  hasPetExperience?: boolean;
  petExpDesc?: string;
  preferredSpecies?: string[];
  preferredSize?: string[];
  bio?: string;
  completionBadge?: boolean;
  warningBadge?: boolean;
  warningCount?: number;
  saviorBadge?: boolean;
  saviorCount?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  profile?: UserProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  notifBadgeCount: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setNotifBadgeCount: (count: number) => void;
  clearNotifBadge: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isHydrated: false,
  notifBadgeCount: 0,

  login: async (email: string, password: string) => {
    try {
      console.log('1 - Début login');
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });
      console.log('2 - Réponse reçue:', response.data);
      const { access_token } = response.data;
      await storage.setItem('token', access_token);
      const meResponse = await axiosInstance.get('/users/me');
      const user = meResponse.data;
      console.log('user reçu du login:', JSON.stringify(user));
      console.log('3 - Token:', access_token);
      console.log('4 - Token sauvegardé');
      set({ user, token: access_token, isLoading: false });
      console.log('5 - Store mis à jour');
      
      // Enregistrement push token
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        try {
          await axiosInstance.patch('/users/me/push-token', { token: pushToken });
        } catch (e) {
          console.error('Erreur sauvegarde push token:', e);
        }
      }
      
      router.replace('/(tabs)');
      console.log('6 - Navigation');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async () => {
    await storage.deleteItem('token');
    set({ user: null, token: null, isLoading: false });
    router.replace('/(auth)/onboarding');
  },

  initialize: async () => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        const response = await axiosInstance.get('/users/me');
        set({ user: response.data, token, isLoading: false, isHydrated: true });
        
        // Enregistrement push token
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          try {
            await axiosInstance.patch('/users/me/push-token', { token: pushToken });
          } catch (e) {
            console.error('Erreur sauvegarde push token:', e);
          }
        }
        
        // Envoyer la position au backend
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            await axiosInstance.patch('/users/me/location', {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        } catch (e) {
          console.error('Erreur update location:', e);
        }
        
        router.replace('/(tabs)');
      } else {
        set({ user: null, token: null, isLoading: false, isHydrated: true });
        router.replace('/(auth)/onboarding');
      }
    } catch (error) {
      await storage.deleteItem('token');
      set({ user: null, token: null, isLoading: false, isHydrated: true });
      router.replace('/(auth)/onboarding');
    }
  },

  refreshUser: async () => {
    try {
      const meResponse = await axiosInstance.get('/users/me');
      set({ user: meResponse.data });
    } catch (e) {
      console.error('Erreur refresh user:', e);
    }
  },

  setUser: (user: User | null) => set({ user }),
  setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
  setNotifBadgeCount: (count: number) => set({ notifBadgeCount: count }),
  clearNotifBadge: () => set({ notifBadgeCount: 0 }),
}));