import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import axiosInstance from '../../src/lib/axios';
import { showToast } from '../../src/components/Toast';

const HOUSING_TYPES = ['APPARTEMENT', 'MAISON', 'STUDIO', 'AUTRE'];
const HOUSING_LABELS: Record<string, string> = {
  APPARTEMENT: '🏢 Appartement',
  MAISON: '🏠 Maison',
  STUDIO: '🏨 Studio',
  AUTRE: '🏗️ Autre',
};

const SPECIES_TYPES = ['CHIEN', 'CHAT', 'AUTRE'];
const SPECIES_LABELS: Record<string, string> = {
  CHIEN: '🐶 Chien',
  CHAT: '🐱 Chat',
  AUTRE: '🦜 Autre',
};

const SIZE_TYPES = ['PETIT', 'MOYEN', 'GRAND'];
const SIZE_LABELS: Record<string, string> = {
  PETIT: '🐭 Petit',
  MOYEN: '🐰 Moyen',
  GRAND: '🐻 Grand',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D3436', marginBottom: 14 }}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, color: '#636e72', fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType, multiline }: any) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#b2bec3"
      keyboardType={keyboardType || 'default'}
      multiline={multiline}
      style={{
        backgroundColor: '#F7F8FA', borderWidth: 1.5, borderColor: '#E8ECEF',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 14, color: '#2D3436',
        minHeight: multiline ? 80 : undefined,
        textAlignVertical: multiline ? 'top' : undefined,
      }}
    />
  );
}

function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F7F8FA' }}>
      <Text style={{ fontSize: 14, color: '#2D3436', fontWeight: '600' }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E8ECEF', true: '#FF6B35' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Infos de base
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');

  // Logement
  const [housingType, setHousingType] = useState(user?.profile?.housingType || '');
  const [surfaceArea, setSurfaceArea] = useState(user?.profile?.surfaceArea?.toString() || '');
  const [hasGarden, setHasGarden] = useState(user?.profile?.hasGarden || false);

  // Famille
  const [hasChildren, setHasChildren] = useState(user?.profile?.hasChildren || false);
  const [hasOtherPets, setHasOtherPets] = useState(user?.profile?.hasOtherPets || false);
  const [otherPetsDesc, setOtherPetsDesc] = useState(user?.profile?.otherPetsDesc || '');

  // Expérience
  const [hasPetExperience, setHasPetExperience] = useState(user?.profile?.hasPetExperience || false);
  const [petExpDesc, setPetExpDesc] = useState(user?.profile?.petExpDesc || '');
  const [hoursAbsent, setHoursAbsent] = useState(user?.profile?.hoursAbsent?.toString() || '');

  // Préférences
  const [preferredSpecies, setPreferredSpecies] = useState<string[]>(user?.profile?.preferredSpecies || []);
  const [preferredSize, setPreferredSize] = useState<string[]>(user?.profile?.preferredSize || []);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
      const res = await axiosInstance.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Mettre à jour le store
      if (user) {
        setUser({ ...user, profile: { ...user.profile, avatarUrl: res.data.avatarUrl } });
      }
      showToast.success('Photo mise à jour !');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
        housingType: housingType || 'APPARTEMENT',
        surfaceArea: surfaceArea ? parseInt(surfaceArea) : null,
        hasGarden: Boolean(hasGarden),
        hasChildren: Boolean(hasChildren),
        childrenAges: [],
        hasOtherPets: Boolean(hasOtherPets),
        otherPetsDesc: hasOtherPets ? otherPetsDesc.trim() : null,
        hasPetExperience: Boolean(hasPetExperience),
        petExpDesc: hasPetExperience ? petExpDesc.trim() : null,
        hoursAbsent: hoursAbsent ? parseInt(hoursAbsent) : 0,
        preferredSpecies: Array.isArray(preferredSpecies) ? [...preferredSpecies] : [],
        preferredSize: Array.isArray(preferredSize) ? [...preferredSize] : [],
      };

      await axiosInstance.patch('/users/me/profile', profileData);
      
      // Refresh user data
      const meRes = await axiosInstance.get('/users/me');
      if (user) {
        setUser(meRes.data);
      }

      // Changement de mot de passe si rempli
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 8) {
          Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères');
          setIsSaving(false);
          return;
        }
        await axiosInstance.patch('/users/me/password', {
          currentPassword,
          newPassword,
        });
      }

      showToast.success('Profil mis à jour !', undefined);
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de sauvegarder');
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim() || 'Mon Profil';
  const avatarUrl = user?.profile?.avatarUrl;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 16, color: '#FF6B35', fontWeight: '700' }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '900', color: '#2D3436' }}>Modifier le profil</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: '#FF6B35', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Sauvegarder</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploadingAvatar} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
            ) : (
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFF' }}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2D3436', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' }}>
              {isUploadingAvatar
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={{ color: '#FFF', fontSize: 13 }}>✏️</Text>
              }
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#b2bec3', marginTop: 8 }}>Toucher pour changer la photo</Text>
        </View>

        {/* Infos de base */}
        <Section title="👤 Infos personnelles">
          <Field label="Prénom">
            <Input value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" />
          </Field>
          <Field label="Nom">
            <Input value={lastName} onChangeText={setLastName} placeholder="Votre nom" />
          </Field>
          <Field label="Ville">
            <Input value={city} onChangeText={setCity} placeholder="Votre ville" />
          </Field>
          <Field label="À propos de moi">
            <Input value={bio} onChangeText={setBio} placeholder="Parlez de vous..." multiline />
          </Field>
        </Section>

        {/* Logement */}
        <Section title="🏠 Mon logement">
          <Field label="Type de logement">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {HOUSING_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setHousingType(type)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: 20, borderWidth: 1.5,
                    borderColor: housingType === type ? '#FF6B35' : '#E8ECEF',
                    backgroundColor: housingType === type ? '#FFF0EB' : '#F7F8FA',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: housingType === type ? '#FF6B35' : '#636e72' }}>
                    {HOUSING_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Field label="Surface (m²)">
            <Input value={surfaceArea} onChangeText={setSurfaceArea} placeholder="Ex: 65" keyboardType="numeric" />
          </Field>
          <SwitchRow label="🌿 Jardin / espace extérieur" value={hasGarden} onValueChange={setHasGarden} />
        </Section>

        {/* Famille */}
        <Section title="👨‍👩‍👧 Ma famille">
          <SwitchRow label="👶 Enfants à la maison" value={hasChildren} onValueChange={setHasChildren} />
          <SwitchRow label="🐶 Autres animaux" value={hasOtherPets} onValueChange={setHasOtherPets} />
          {hasOtherPets && (
            <View style={{ marginTop: 10 }}>
              <Field label="Décrivez vos animaux">
                <Input value={otherPetsDesc} onChangeText={setOtherPetsDesc} placeholder="Ex: 1 chat adulte, très calme" multiline />
              </Field>
            </View>
          )}
        </Section>

        {/* Préférences */}
        <Section title="❤️ Mes préférences">
          <Field label="Espèces préférées">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SPECIES_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setPreferredSpecies(prev =>
                      prev.includes(type)
                        ? prev.filter(s => s !== type)
                        : [...prev, type]
                    );
                  }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: 20, borderWidth: 1.5,
                    borderColor: preferredSpecies.includes(type) ? '#FF6B35' : '#E8ECEF',
                    backgroundColor: preferredSpecies.includes(type) ? '#FFF0EB' : '#F7F8FA',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: preferredSpecies.includes(type) ? '#FF6B35' : '#636e72' }}>
                    {SPECIES_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Taille préférée">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SIZE_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setPreferredSize(prev =>
                      prev.includes(type)
                        ? prev.filter(s => s !== type)
                        : [...prev, type]
                    );
                  }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: 20, borderWidth: 1.5,
                    borderColor: preferredSize.includes(type) ? '#FF6B35' : '#E8ECEF',
                    backgroundColor: preferredSize.includes(type) ? '#FFF0EB' : '#F7F8FA',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: preferredSize.includes(type) ? '#FF6B35' : '#636e72' }}>
                    {SIZE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </Section>

        {/* Expérience */}
        <Section title="✨ Mon expérience">
          <Field label="Heures d'absence par jour">
            <Input value={hoursAbsent} onChangeText={setHoursAbsent} placeholder="Ex: 8" keyboardType="numeric" />
          </Field>
          <SwitchRow label="J'ai déjà eu des animaux" value={hasPetExperience} onValueChange={setHasPetExperience} />
          {hasPetExperience && (
            <View style={{ marginTop: 10 }}>
              <Field label="Décrivez votre expérience">
                <Input value={petExpDesc} onChangeText={setPetExpDesc} placeholder="Ex: J'ai eu des chiens pendant 10 ans" multiline />
              </Field>
            </View>
          )}
        </Section>

        {/* Mot de passe */}
        <Section title="🔒 Changer le mot de passe">
          <Field label="Mot de passe actuel">
            <Input value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" secureTextEntry />
          </Field>
          <Field label="Nouveau mot de passe">
            <Input value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <Input value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
          </Field>
          <Text style={{ fontSize: 12, color: '#b2bec3', marginTop: 4 }}>
            Laissez vide si vous ne souhaitez pas changer le mot de passe
          </Text>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}