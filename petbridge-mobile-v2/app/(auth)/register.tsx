import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axiosInstance from '../../src/lib/axios';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/register', {
        firstName, lastName, email, password,
      });
      router.replace('/(auth)/login');
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Erreur lors de l\'inscription');
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

            {/* Titre */}
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
              🐾
            </Text>
            <Text style={{
              fontSize: 28, fontWeight: '800',
              color: '#2D3436', textAlign: 'center', marginBottom: 8,
            }}>
              Créer un compte
            </Text>
            <Text style={{
              fontSize: 16, color: '#636e72',
              textAlign: 'center', marginBottom: 40,
            }}>
              Rejoignez la communauté PetBridge
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

            {/* Prénom */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
              Prénom
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jean"
              placeholderTextColor="#b2bec3"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5, borderColor: '#dfe6e9',
                borderRadius: 14, paddingHorizontal: 16,
                paddingVertical: 14, fontSize: 16,
                color: '#2D3436', marginBottom: 20,
              }}
            />

            {/* Nom */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
              Nom
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Dupont"
              placeholderTextColor="#b2bec3"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5, borderColor: '#dfe6e9',
                borderRadius: 14, paddingHorizontal: 16,
                paddingVertical: 14, fontSize: 16,
                color: '#2D3436', marginBottom: 20,
              }}
            />

            {/* Email */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
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

            {/* Mot de passe */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
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
                placeholder="Min. 8 caractères"
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

            {/* Bouton */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#4ECDC4',
                borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', elevation: 4,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                  Créer mon compte
                </Text>
              )}
            </TouchableOpacity>

            {/* Lien login */}
            <View style={{
              flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40,
            }}>
              <Text style={{ fontSize: 15, color: '#636e72' }}>
                Déjà un compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FF6B35' }}>
                  Se connecter
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}