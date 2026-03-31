import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const { initialize, isHydrated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isHydrated) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="animal/[id]" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="thread/[id]" />
        <Stack.Screen name="checkins/[id]" />
        <Stack.Screen name="sighting/[id]" />
        <Stack.Screen name="sightings/all" />
        <Stack.Screen name="profile/edit" />
      </Stack>
      <Toast />
    </SafeAreaProvider>
  );
}