import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  onPress?: () => void;
}

export default function EmptyState({ emoji, title, subtitle, buttonLabel, onPress }: EmptyStateProps) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 48, paddingHorizontal: 32,
    }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</Text>
      <Text style={{
        fontSize: 18, fontWeight: '800', color: '#2D3436',
        textAlign: 'center', marginBottom: 8,
      }}>{title}</Text>
      {subtitle && (
        <Text style={{
          fontSize: 14, color: '#b2bec3',
          textAlign: 'center', lineHeight: 22, marginBottom: 24,
        }}>{subtitle}</Text>
      )}
      {buttonLabel && onPress && (
        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: '#FF6B35', borderRadius: 14,
            paddingHorizontal: 24, paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}