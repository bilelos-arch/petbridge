import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator,
  ScrollView, Image, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { animalService } from '../../src/services/animalService';
import axiosInstance from '../../src/lib/axios';

const SPECIES_OPTIONS = [
  { value: 'CHIEN', label: '🐶', labelText: 'Chien' },
  { value: 'CHAT', label: '🐱', labelText: 'Chat' },
  { value: 'AUTRE', label: '🐾', labelText: 'Autre' },
];

const SEX_OPTIONS = [
  { value: 'MALE', label: '♂', labelText: 'Mâle' },
  { value: 'FEMELLE', label: '♀', labelText: 'Femelle' },
];

const SIZE_OPTIONS = [
  { value: 'PETIT', label: '🐾', labelText: 'Petit' },
  { value: 'MOYEN', label: '🐕', labelText: 'Moyen' },
  { value: 'GRAND', label: '🦮', labelText: 'Grand' },
];

const TEMPERAMENT_OPTIONS = [
  { value: 'CALME', label: '😌', labelText: 'Calme' },
  { value: 'ACTIF', label: '⚡', labelText: 'Actif' },
  { value: 'TIMIDE', label: '🙈', labelText: 'Timide' },
  { value: 'JOUEUR', label: '🎾', labelText: 'Joueur' },
  { value: 'PROTECTEUR', label: '🛡️', labelText: 'Protecteur' },
];

const ACTIVITY_OPTIONS = [
  { value: 'FAIBLE', label: '🛋️', labelText: 'Faible' },
  { value: 'MODERE', label: '🚶', labelText: 'Modéré' },
  { value: 'ELEVE', label: '🏃', labelText: 'Élevé' },
];

export default function PublishScreen() {
  const { token } = useAuthStore();
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = !!editId;
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [breeds, setBreeds] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    species: 'CHIEN' as 'CHIEN' | 'CHAT' | 'AUTRE',
    breedId: '',
    breedName: '',
    age: '',
    sex: '',
    size: '',
    temperament: '',
    activityLevel: '',
    city: '',
    description: '',
    medicalConditions: '',
    compatibleChildren: false,
    compatibleAnimals: false,
    vaccinated: false,
    spayed: false,
    dewormed: false,
  });

  // Charger les races selon l'espèce
  useEffect(() => {
    const loadBreeds = async () => {
      try {
        const response = await axiosInstance.get(`/breeds?species=${form.species}`);
        setBreeds(response.data);
        setForm(f => ({ ...f, breedId: '' }));
      } catch (e: any) {
        console.error('Erreur chargement races:', e);
      }
    };
    loadBreeds();
  }, [form.species]);

  // Load animal data if in edit mode
  useEffect(() => {
    if (!editId) return;
    const loadAnimal = async () => {
      try {
        const animal = await animalService.getAnimalById(editId);
        setForm({
          name: animal.name || '',
          species: animal.species || 'CHIEN',
          breedId: animal.breedId || '',
          breedName: animal.breed?.name || '',
          age: animal.age?.toString() || '',
          sex: animal.sex || '',
          size: animal.size || '',
          temperament: animal.temperament || '',
          activityLevel: (animal as any).activityLevel || '',
          city: animal.city || '',
          description: animal.description || '',
          medicalConditions: (animal as any).medicalConditions || '',
          compatibleChildren: (animal as any).compatibleChildren || false,
          compatibleAnimals: (animal as any).compatibleAnimals || false,
          vaccinated: animal.vaccinated || false,
          spayed: animal.spayed || false,
          dewormed: animal.dewormed || false,
        });
        if (animal.photos?.length) {
          setExistingPhotos(animal.photos);
        }
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de charger l\'annonce');
      }
    };
    loadAnimal();
  }, [editId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canProceedToStep2 = () => {
    return form.name && form.species && form.sex && form.age && form.city;
  };

  const canProceedToStep3 = () => {
    return form.size && form.temperament;
  };

  const handlePublish = async () => {
    if (!form.name || !form.sex || !form.size || !form.temperament) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!token) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        species: form.species,
        sex: form.sex,
        size: form.size,
        temperament: form.temperament,
        breedId: form.breedId || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        city: form.city || undefined,
        description: form.description || undefined,
        activityLevel: form.activityLevel || undefined,
        compatibleChildren: form.compatibleChildren,
        compatibleAnimals: form.compatibleAnimals,
        vaccinated: form.vaccinated,
        spayed: form.spayed,
        dewormed: form.dewormed,
      };

      if (isEditMode && editId) {
        await animalService.updateAnimal(editId, payload, token);
        for (const photoUri of photos) {
          await animalService.uploadPhoto(editId, photoUri, token);
        }
        Alert.alert(
          '✅ Annonce modifiée !',
          'Vos modifications ont été enregistrées.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const animal = await animalService.createAnimal(payload, token);
        for (const photoUri of photos) {
          await animalService.uploadPhoto(animal.id, photoUri, token);
        }
        Alert.alert(
          '🎉 Annonce publiée !',
          'Votre annonce est en attente de validation par un admin.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (e: any) {
      console.error('Erreur publication détaillée:', {
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status,
      });
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Erreur inconnue');
    }
  };

  // ========== HEADER STEPPER ==========
  const renderStepper = () => (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', paddingVertical: 16,
    }}>
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: currentStep >= step ? '#FF6B35' : '#E8ECEF',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{
                color: currentStep >= step ? '#FFF' : '#b2bec3',
                fontWeight: '700', fontSize: 14,
              }}>
                {currentStep > step ? '✓' : step}
              </Text>
            </View>
            <Text style={{
              fontSize: 11, fontWeight: '600',
              color: currentStep >= step ? '#FF6B35' : '#b2bec3',
              marginTop: 4,
            }}>
              {step === 1 ? 'Info' : step === 2 ? 'Cara' : 'Photos'}
            </Text>
          </View>
          {step < 3 && (
            <View style={{
              width: 40, height: 2,
              backgroundColor: currentStep > step ? '#FF6B35' : '#E8ECEF',
              marginHorizontal: 8, marginBottom: 16,
            }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // ========== NAVIGATION BUTTONS ==========
  const renderNavigation = () => (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: '#FFF', borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
    }}>
      {currentStep > 1 ? (
        <TouchableOpacity
          onPress={() => setCurrentStep(currentStep - 1)}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 12, paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 18, color: '#636e72' }}>←</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#636e72', marginLeft: 4 }}>
            Précédent
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 100 }} />
      )}

      {currentStep < 3 ? (
        <TouchableOpacity
          onPress={() => {
            if (currentStep === 1 && !canProceedToStep2()) {
              Alert.alert('Erreur', 'Veuillez remplir le nom, l\'espèce, le sexe, l\'âge et la ville');
              return;
            }
            if (currentStep === 2 && !canProceedToStep3()) {
              Alert.alert('Erreur', 'Veuillez sélectionner la taille et le tempérament');
              return;
            }
            setCurrentStep(currentStep + 1);
          }}
          style={{
            backgroundColor: '#FF6B35', borderRadius: 12,
            paddingVertical: 12, paddingHorizontal: 20,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
            Suivant →
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isLoading}
          style={{
            backgroundColor: '#FF6B35', borderRadius: 12,
            paddingVertical: 12, paddingHorizontal: 20,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
              🐾 Publier
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // ========== ÉTAPE 1: INFORMATIONS DE BASE ==========
  const renderStep1 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Espèce */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Espèce *
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {SPECIES_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm({ ...form, species: opt.value as any })}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 2, alignItems: 'center',
              backgroundColor: form.species === opt.value ? '#FF6B35' : '#FFFFFF',
              borderColor: form.species === opt.value ? '#FF6B35' : '#E8ECEF',
            }}
          >
            <Text style={{ fontSize: 24 }}>{opt.label}</Text>
            <Text style={{
              fontSize: 13, fontWeight: '600', marginTop: 4,
              color: form.species === opt.value ? '#FFFFFF' : '#636e72',
            }}>
              {opt.labelText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nom */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 6 }}>
        Nom *
      </Text>
      <TextInput
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
        placeholder="Ex: Max"
        placeholderTextColor="#b2bec3"
        style={{
          backgroundColor: '#FFFFFF', borderWidth: 1.5,
          borderColor: '#E8ECEF', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12,
          fontSize: 15, color: '#2D3436', marginBottom: 20,
        }}
      />

      {/* Race */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Race
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => setForm({ ...form, breedId: '', breedName: '' })}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            borderWidth: 1.5,
            backgroundColor: !form.breedId ? '#4ECDC4' : '#FFFFFF',
            borderColor: !form.breedId ? '#4ECDC4' : '#E8ECEF',
          }}
        >
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: !form.breedId ? '#FFFFFF' : '#636e72',
          }}>
            Non précisée
          </Text>
        </TouchableOpacity>
        {breeds.map(breed => (
          <TouchableOpacity
            key={breed.id}
            onPress={() => setForm({ ...form, breedId: breed.id, breedName: breed.name })}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              borderWidth: 1.5,
              backgroundColor: form.breedId === breed.id ? '#4ECDC4' : '#FFFFFF',
              borderColor: form.breedId === breed.id ? '#4ECDC4' : '#E8ECEF',
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: form.breedId === breed.id ? '#FFFFFF' : '#636e72',
            }}>
              {breed.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Custom breed input */}
      <TextInput
        value={form.breedName}
        onChangeText={(v) => setForm({ ...form, breedName: v, breedId: '' })}
        placeholder="Ou saisie libre..."
        placeholderTextColor="#b2bec3"
        style={{
          backgroundColor: '#FFFFFF', borderWidth: 1.5,
          borderColor: '#E8ECEF', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 10,
          fontSize: 14, color: '#2D3436', marginBottom: 20,
        }}
      />

      {/* Sexe */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Sexe *
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {SEX_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm({ ...form, sex: opt.value })}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 2, alignItems: 'center',
              backgroundColor: form.sex === opt.value ? '#FF6B35' : '#FFFFFF',
              borderColor: form.sex === opt.value ? '#FF6B35' : '#E8ECEF',
            }}
          >
            <Text style={{ fontSize: 24 }}>{opt.label}</Text>
            <Text style={{
              fontSize: 13, fontWeight: '600', marginTop: 4,
              color: form.sex === opt.value ? '#FFFFFF' : '#636e72',
            }}>
              {opt.labelText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Âge */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Âge *
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <TextInput
          value={form.age}
          onChangeText={(v) => setForm({ ...form, age: v.replace(/[^0-9]/g, '') })}
          placeholder="0"
          placeholderTextColor="#b2bec3"
          keyboardType="numeric"
          style={{
            backgroundColor: '#FFFFFF', borderWidth: 1.5,
            borderColor: '#E8ECEF', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 15, color: '#2D3436', width: 80, textAlign: 'center',
          }}
        />
        <Text style={{ fontSize: 15, color: '#636e72', fontWeight: '500' }}>mois</Text>
        {form.age && (
          <Text style={{ fontSize: 13, color: '#4ECDC4', fontWeight: '600' }}>
            ({Math.floor(parseInt(form.age) / 12)} an{parseInt(form.age) >= 24 ? 's' : ''})
          </Text>
        )}
      </View>

      {/* Ville */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 6 }}>
        Ville *
      </Text>
      <TextInput
        value={form.city}
        onChangeText={(v) => setForm({ ...form, city: v })}
        placeholder="Ex: Paris"
        placeholderTextColor="#b2bec3"
        style={{
          backgroundColor: '#FFFFFF', borderWidth: 1.5,
          borderColor: '#E8ECEF', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12,
          fontSize: 15, color: '#2D3436', marginBottom: 20,
        }}
      />
    </View>
  );

  // ========== ÉTAPE 2: CARACTÉRISTIQUES ==========
  const renderStep2 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Taille */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Taille *
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {SIZE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm({ ...form, size: opt.value })}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 2, alignItems: 'center',
              backgroundColor: form.size === opt.value ? '#FF6B35' : '#FFFFFF',
              borderColor: form.size === opt.value ? '#FF6B35' : '#E8ECEF',
            }}
          >
            <Text style={{ fontSize: 24 }}>{opt.label}</Text>
            <Text style={{
              fontSize: 13, fontWeight: '600', marginTop: 4,
              color: form.size === opt.value ? '#FFFFFF' : '#636e72',
            }}>
              {opt.labelText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tempérament */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Tempérament *
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TEMPERAMENT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm({ ...form, temperament: opt.value })}
            style={{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
              borderWidth: 1.5,
              backgroundColor: form.temperament === opt.value ? '#4ECDC4' : '#FFFFFF',
              borderColor: form.temperament === opt.value ? '#4ECDC4' : '#E8ECEF',
            }}
          >
            <Text style={{
              fontSize: 14, fontWeight: '600',
              color: form.temperament === opt.value ? '#FFFFFF' : '#636e72',
            }}>
              {opt.label} {opt.labelText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Niveau d'activité */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Niveau d'activité
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {ACTIVITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm({ ...form, activityLevel: opt.value })}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12,
              borderWidth: 1.5, alignItems: 'center',
              backgroundColor: form.activityLevel === opt.value ? '#FFE66D' : '#FFFFFF',
              borderColor: form.activityLevel === opt.value ? '#FFE66D' : '#E8ECEF',
            }}
          >
            <Text style={{ fontSize: 20 }}>{opt.label}</Text>
            <Text style={{
              fontSize: 12, fontWeight: '600', marginTop: 2,
              color: form.activityLevel === opt.value ? '#2D3436' : '#636e72',
            }}>
              {opt.labelText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Compatibilités */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 12 }}>
        Compatibilités
      </Text>
      <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>👶</Text>
            <Text style={{ fontSize: 15, color: '#2D3436' }}>Compatible enfants</Text>
          </View>
          <Switch
            value={form.compatibleChildren}
            onValueChange={(v) => setForm({ ...form, compatibleChildren: v })}
            trackColor={{ false: '#E8ECEF', true: '#4ECDC4' }}
            thumbColor="#FFF"
          />
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 12, paddingHorizontal: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🐾</Text>
            <Text style={{ fontSize: 15, color: '#2D3436' }}>Compatible autres animaux</Text>
          </View>
          <Switch
            value={form.compatibleAnimals}
            onValueChange={(v) => setForm({ ...form, compatibleAnimals: v })}
            trackColor={{ false: '#E8ECEF', true: '#4ECDC4' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Santé */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 12 }}>
        🏥 Santé
      </Text>
      <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>💉</Text>
            <Text style={{ fontSize: 15, color: '#2D3436' }}>Vacciné</Text>
          </View>
          <Switch
            value={form.vaccinated}
            onValueChange={(v) => setForm({ ...form, vaccinated: v })}
            trackColor={{ false: '#E8ECEF', true: '#4ECDC4' }}
            thumbColor="#FFF"
          />
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>✂️</Text>
            <Text style={{ fontSize: 15, color: '#2D3436' }}>Stérilisé</Text>
          </View>
          <Switch
            value={form.spayed}
            onValueChange={(v) => setForm({ ...form, spayed: v })}
            trackColor={{ false: '#E8ECEF', true: '#4ECDC4' }}
            thumbColor="#FFF"
          />
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 12, paddingHorizontal: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>💊</Text>
            <Text style={{ fontSize: 15, color: '#2D3436' }}>Déparasité</Text>
          </View>
          <Switch
            value={form.dewormed}
            onValueChange={(v) => setForm({ ...form, dewormed: v })}
            trackColor={{ false: '#E8ECEF', true: '#4ECDC4' }}
            thumbColor="#FFF"
          />
        </View>
      </View>
    </View>
  );

  // ========== ÉTAPE 3: DESCRIPTION ET PHOTOS ==========
  const renderStep3 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Description */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Description
      </Text>
      <TextInput
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        placeholder="Décrivez votre animal, son caractère, ses habitudes..."
        placeholderTextColor="#b2bec3"
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: '#FFFFFF', borderWidth: 1.5,
          borderColor: '#E8ECEF', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12,
          fontSize: 15, color: '#2D3436', marginBottom: 20,
          height: 120, textAlignVertical: 'top',
        }}
      />

      {/* Conditions médicales */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 8 }}>
        Conditions médicales (optionnel)
      </Text>
      <TextInput
        value={form.medicalConditions}
        onChangeText={(v) => setForm({ ...form, medicalConditions: v })}
        placeholder="Toute information médicale importante..."
        placeholderTextColor="#b2bec3"
        multiline
        numberOfLines={3}
        style={{
          backgroundColor: '#FFFFFF', borderWidth: 1.5,
          borderColor: '#E8ECEF', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12,
          fontSize: 15, color: '#2D3436', marginBottom: 20,
          height: 80, textAlignVertical: 'top',
        }}
      />

      {/* Photos */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 12 }}>
        Photos *
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {existingPhotos.map((photo) => (
          <View key={photo.id} style={{ marginRight: 12, position: 'relative' }}>
            <Image
              source={{ uri: photo.url }}
              style={{ width: 100, height: 100, borderRadius: 12 }}
            />
            <View style={{
              position: 'absolute', top: -4, right: -4,
              backgroundColor: '#4ECDC4', borderRadius: 10,
              width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
            </View>
          </View>
        ))}
        {photos.map((uri, index) => (
          <View key={index} style={{ marginRight: 12, position: 'relative' }}>
            <Image
              source={{ uri }}
              style={{ width: 100, height: 100, borderRadius: 12 }}
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              style={{
                position: 'absolute', top: -6, right: -6,
                backgroundColor: '#d63031', borderRadius: 10,
                width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          onPress={pickImage}
          style={{
            width: 100, height: 100, borderRadius: 12,
            borderWidth: 2, borderColor: '#E8ECEF',
            borderStyle: 'dashed', alignItems: 'center',
            justifyContent: 'center', backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ fontSize: 28 }}>📷</Text>
          <Text style={{ fontSize: 11, color: '#b2bec3', marginTop: 4 }}>Ajouter</Text>
        </TouchableOpacity>
      </ScrollView>

      {photos.length === 0 && existingPhotos.length === 0 && (
        <View style={{
          backgroundColor: '#FFF0EB', borderRadius: 12,
          padding: 16, alignItems: 'center',
        }}>
          <Text style={{ fontSize: 14, color: '#FF6B35', fontWeight: '600' }}>
            ⚠️ Ajoutez au moins une photo
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, backgroundColor: '#FFF8F5' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#2D3436', marginBottom: 2 }}>
          {isEditMode ? '✏️ Modifier l\'annonce' : '📢 Publier une annonce'}
        </Text>
        <Text style={{ fontSize: 13, color: '#636e72', marginBottom: 8 }}>
          {isEditMode ? 'Modifiez les informations' : 'Créez une nouvelle annonce'}
        </Text>
      </View>

      {/* Stepper */}
      {renderStepper()}

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Navigation */}
      {renderNavigation()}
    </SafeAreaView>
  );
}