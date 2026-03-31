import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('screen');

const slides = [
  {
    id: '1',
    emoji: '🐾',
    title: 'Adopter responsable',
    description: "Notre algorithme analyse votre profil et vous propose les animaux les plus compatibles avec votre style de vie",
    bg: '#FF6B35',
    textColor: '#FFFFFF',
    btnBg: '#FFFFFF',
    btnText: '#FF6B35',
    dotActive: '#FFFFFF',
    dotInactive: 'rgba(255,255,255,0.4)',
    linkColor: 'rgba(255,255,255,0.85)',
    features: ['🏠 Type de logement', '👶 Présence d\'enfants', '⚡ Niveau d\'activité'],
  },
  {
    id: '2',
    emoji: '🚨',
    title: 'Sauvez des animaux',
    description: "Signalez un animal abandonné ou blessé près de chez vous. La communauté PetBridge intervient en quelques minutes",
    bg: '#2D3436',
    textColor: '#FFFFFF',
    btnBg: '#FF6B35',
    btnText: '#FFFFFF',
    dotActive: '#FF6B35',
    dotInactive: 'rgba(255,255,255,0.3)',
    linkColor: 'rgba(255,255,255,0.7)',
    features: ['📍 Localisation GPS', '🦸 Bénévoles alertés', '🏆 Badge Sauveur'],
  },
  {
    id: '3',
    emoji: '💚',
    title: 'Un suivi jusqu\'au bout',
    description: "Après l'adoption, suivez le bien-être de l'animal avec des check-ins réguliers. Ensemble pour son bonheur",
    bg: '#4ECDC4',
    textColor: '#FFFFFF',
    btnBg: '#FFFFFF',
    btnText: '#4ECDC4',
    dotActive: '#FFFFFF',
    dotInactive: 'rgba(255,255,255,0.4)',
    linkColor: 'rgba(255,255,255,0.85)',
    features: ['✅ J+1, J+3, J+14, J+30', '📸 Photos de suivi', '🏆 Badge Exemplaire'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <View style={{ width, height, backgroundColor: item.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              
              {/* Bouton passer en haut à droite */}
              {index < slides.length - 1 && (
                <TouchableOpacity
                  onPress={goToLogin}
                  style={{ alignSelf: 'flex-end', paddingHorizontal: 24, paddingTop: 8 }}
                >
                  <Text style={{ color: item.linkColor, fontSize: 14, fontWeight: '600' }}>
                    Passer
                  </Text>
                </TouchableOpacity>
              )}

              {/* Zone centrale */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                
                {/* Emoji grand */}
                <Text style={{ fontSize: 90, marginBottom: 24 }}>{item.emoji}</Text>
                
                {/* Titre */}
                <Text style={{
                  fontSize: 28, fontWeight: '800',
                  color: item.textColor, textAlign: 'center', marginBottom: 12,
                }}>
                  {item.title}
                </Text>
                
                {/* Description */}
                <Text style={{
                  fontSize: 15, color: item.textColor, textAlign: 'center',
                  lineHeight: 22, opacity: 0.9, maxWidth: 300, marginBottom: 24,
                }}>
                  {item.description}
                </Text>

                {/* Features list */}
                <View style={{ alignSelf: 'stretch', gap: 8 }}>
                  {item.features.map((feature: string, i: number) => (
                    <View key={i} style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                    }}>
                      <Text style={{ fontSize: 14, color: item.textColor, fontWeight: '600' }}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Zone basse */}
              <View style={{ paddingHorizontal: 32, paddingBottom: 48, alignItems: 'center' }}>
                
                {/* Dots */}
                <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                  {slides.map((_, i) => (
                    <View key={i} style={{
                      width: i === index ? 24 : 8, height: 8,
                      borderRadius: 4, marginHorizontal: 4,
                      backgroundColor: i === index ? item.dotActive : item.dotInactive,
                    }} />
                  ))}
                </View>

                {/* Bouton principal */}
                <TouchableOpacity
                  onPress={goToNext}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: item.btnBg, borderRadius: 16,
                    paddingVertical: 16, width: '100%', alignItems: 'center',
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: item.btnText, fontSize: 17, fontWeight: '700' }}>
                    {index < slides.length - 1 ? 'Suivant →' : 'Commencer 🐾'}
                  </Text>
                </TouchableOpacity>

                {/* Lien connexion */}
                <TouchableOpacity onPress={goToLogin} style={{ marginTop: 16 }}>
                  <Text style={{ color: item.linkColor, fontSize: 14, fontWeight: '500' }}>
                    J'ai déjà un compte
                  </Text>
                </TouchableOpacity>
              </View>

            </SafeAreaView>
          </View>
        )}
      />
    </View>
  );
}
