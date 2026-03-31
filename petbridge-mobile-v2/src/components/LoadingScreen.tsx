import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F5',
                           alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={{ marginTop: 12, color: '#b2bec3', fontSize: 14 }}>{message}</Text>
    </SafeAreaView>
  );
}