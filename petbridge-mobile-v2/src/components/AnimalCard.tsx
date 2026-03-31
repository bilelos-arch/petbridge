import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Animal } from '../types/animal';

interface AnimalCardProps {
  animal: Animal;
  variant?: 'horizontal' | 'vertical' | 'list';
  showMatchScore?: boolean;
  showStatus?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DISPONIBLE:         { label: '🟢 Disponible',    color: '#00b894', bg: '#EAFAF4' },
  ATTENTE_VALIDATION: { label: '⏳ En validation', color: '#e17055', bg: '#FFF4F0' },
  EN_COURS_ADOPTION:  { label: '🐾 En cours',      color: '#4ECDC4', bg: '#E8F5F2' },
  ADOPTE:             { label: '🏠 Adopté',         color: '#636e72', bg: '#F5F5F5' },
  REJETE:             { label: '❌ Rejeté',         color: '#d63031', bg: '#FFF0F0' },
};

const SPECIES_EMOJI: Record<string, string> = {
  CHIEN: '🐶', CHAT: '🐱', AUTRE: '🐾',
};

const formatAge = (age?: number) => {
  if (age === undefined || age === null) return null;
  if (age < 12) return `${age} mois`;
  return `${Math.floor(age / 12)} an${Math.floor(age / 12) > 1 ? 's' : ''}`;
};

export default function AnimalCard({ animal, variant = 'vertical', showMatchScore = false, showStatus = false }: AnimalCardProps) {
  const photo = animal.photos?.find((p: any) => p.isPrimary) || animal.photos?.[0];
  const status = STATUS_CONFIG[animal.status] || STATUS_CONFIG['DISPONIBLE'];
  const ageLabel = formatAge(animal.age);

  const handlePress = () => router.push(`/animal/${animal.id}`);

  // ── Variant HORIZONTAL (carousel accueil) ──
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={{
          width: 160, height: 200, marginRight: 12,
          borderRadius: 16, overflow: 'hidden',
          backgroundColor: '#E8ECEF',
        }}
      >
        {photo ? (
          <Image source={{ uri: photo.url }}
                 style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#FFF0EB',
                         alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 48 }}>{SPECIES_EMOJI[animal.species]}</Text>
          </View>
        )}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 80, backgroundColor: 'rgba(0,0,0,0.6)',
        }} />
        {showMatchScore && animal.matchScore && (
          <View style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: '#FF6B35', borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 4,
          }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              {animal.matchScore}%
            </Text>
          </View>
        )}
        {animal.status === 'EN_COURS_ADOPTION' && (
          <View style={{
            position: 'absolute', top: 8, left: 8,
            backgroundColor: '#4ECDC4', borderRadius: 8,
            paddingHorizontal: 6, paddingVertical: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>🐾 En cours</Text>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {animal.name}
          </Text>
          {animal.city && (
            <Text style={{ color: '#fff', fontSize: 11, opacity: 0.85 }}>
              📍 {animal.city}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── Variant LIST (Explorer, Nouveaux arrivants) ──
  if (variant === 'list') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#fff', borderRadius: 14,
          padding: 12, marginBottom: 8,
          borderWidth: 0.5, borderColor: '#F0F0F0',
          elevation: 1,
        }}
      >
        <View style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 12 }}>
          {photo ? (
            <Image source={{ uri: photo.url }}
                   style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#FFF0EB',
                           alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>{SPECIES_EMOJI[animal.species]}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D3436', marginBottom: 2 }}>
            {animal.name}
          </Text>
          {animal.status === 'EN_COURS_ADOPTION' && (
            <View style={{
              backgroundColor: '#4ECDC4', borderRadius: 8,
              paddingHorizontal: 6, paddingVertical: 2,
              alignSelf: 'flex-start', marginBottom: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>🐾 En cours</Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: '#b2bec3', marginBottom: 3 }}>
            {animal.breed?.name || SPECIES_EMOJI[animal.species] + ' ' + animal.species}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {ageLabel && (
              <View style={{ backgroundColor: '#FFF0EB', borderRadius: 8,
                             paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: '#FF6B35', fontWeight: '600' }}>
                  🎂 {ageLabel}
                </Text>
              </View>
            )}
            {animal.city && (
              <Text style={{ fontSize: 11, color: '#4ECDC4', fontWeight: '600' }}>
                📍 {animal.city}
              </Text>
            )}
          </View>
          {showStatus && (
            <View style={{ backgroundColor: status.bg, borderRadius: 8, marginTop: 4,
                           paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, color: status.color, fontWeight: '700' }}>
                {status.label}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 20, color: '#b2bec3' }}>›</Text>
      </TouchableOpacity>
    );
  }

  // ── Variant VERTICAL (grille Explorer) ──
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: '#fff', borderRadius: 16,
        overflow: 'hidden', borderWidth: 0.5,
        borderColor: '#F0F0F0', elevation: 2,
        marginBottom: 16,
      }}
    >
      <View style={{ height: 160 }}>
        {photo ? (
          <Image source={{ uri: photo.url }}
                 style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#FFF0EB',
                         alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 48 }}>{SPECIES_EMOJI[animal.species]}</Text>
          </View>
        )}
        {animal.status === 'EN_COURS_ADOPTION' && (
          <View style={{
            position: 'absolute', top: 8, left: 8,
            backgroundColor: '#4ECDC4', borderRadius: 8,
            paddingHorizontal: 6, paddingVertical: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>🐾 En cours</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D3436', marginBottom: 4 }}>
          {animal.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#b2bec3', marginBottom: 6 }}>
          {animal.breed?.name || animal.species}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {ageLabel && (
            <Text style={{ fontSize: 11, color: '#FF6B35', fontWeight: '600' }}>🎂 {ageLabel}</Text>
          )}
          {animal.city && (
            <Text style={{ fontSize: 11, color: '#4ECDC4', fontWeight: '600' }}>📍 {animal.city}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}