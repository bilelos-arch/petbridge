import React, { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuthStore();

const handleLogin = async () => {
  if (!email || !password) {
    setError('Veuillez remplir tous les champs');
    return;
  }
  setError('');
  setIsLoading(true);
  try {
    await login(email, password);
  } catch (error: any) {
    setError(error?.response?.data?.message || 'Email ou mot de passe incorrect');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 60 }}>

            {/* Logo / Titre */}
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
              🐾
            </Text>
            <Text style={{
              fontSize: 28, fontWeight: '800',
              color: '#2D3436', textAlign: 'center', marginBottom: 8,
            }}>
              Bon retour !
            </Text>
            <Text style={{
              fontSize: 16, color: '#636e72',
              textAlign: 'center', marginBottom: 40,
            }}>
              Connectez-vous à votre compte
            </Text>

            {/* Erreur */}
            {error ? (
              <View style={{
                backgroundColor: '#ffe0e0', borderRadius: 12,
                padding: 12, marginBottom: 16,
              }}>
                <Text style={{ color: '#d63031', fontSize: 14, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Champ Email */}
            <Text style={{
              fontSize: 14, fontWeight: '600',
              color: '#2D3436', marginBottom: 8,
            }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor="#b2bec3"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5, borderColor: '#dfe6e9',
                borderRadius: 14, paddingHorizontal: 16,
                paddingVertical: 14, fontSize: 16,
                color: '#2D3436', marginBottom: 20,
              }}
            />

            {/* Champ Mot de passe */}
            <Text style={{
              fontSize: 14, fontWeight: '600',
              color: '#2D3436', marginBottom: 8,
            }}>
              Mot de passe
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5, borderColor: '#dfe6e9',
              borderRadius: 14, marginBottom: 32,
            }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#b2bec3"
                secureTextEntry={!showPassword}
                style={{
                  flex: 1, paddingHorizontal: 16,
                  paddingVertical: 14, fontSize: 16, color: '#2D3436',
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 16 }}
              >
                <Text style={{ fontSize: 18 }}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bouton connexion */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#FF6B35',
                borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', elevation: 4,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{
                  color: '#FFFFFF', fontSize: 17, fontWeight: '700',
                }}>
                  Se connecter
                </Text>
              )}
            </TouchableOpacity>

            {/* Lien register */}
            <View style={{
              flexDirection: 'row', justifyContent: 'center',
              marginTop: 24,
            }}>
              <Text style={{ fontSize: 15, color: '#636e72' }}>
                Pas encore de compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{
                  fontSize: 15, fontWeight: '700', color: '#FF6B35',
                }}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}