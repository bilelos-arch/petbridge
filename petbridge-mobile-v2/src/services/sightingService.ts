///Users/mac/Desktop/pet/petbridge-mobile-v2/src/services/sightingService.ts
import axios from '../lib/axios';

export interface CreateSightingDto {
  latitude: number;
  longitude: number;
  situation?: 'BLESSE' | 'EN_BONNE_SANTE' | 'AGRESSIF' | 'AVEC_PETITS' | 'INCONNU';
  description?: string;
  photoUrl?: string;
}

export interface Sighting {
  id: string;
  reporterId: string;
  volunteerId: string | null;
  latitude: number;
  longitude: number;
  situation: 'BLESSE' | 'EN_BONNE_SANTE' | 'AGRESSIF' | 'AVEC_PETITS' | 'INCONNU';
  description: string | null;
  photoUrl: string | null;
  status: 'SIGNALE' | 'PRIS_EN_CHARGE' | 'SECOURU' | 'NON_TROUVE';
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    email: string;
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      city: string;
      avatarUrl: string | null;
    };
  };
  volunteer: {
    id: string;
    email: string;
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      city: string;
      avatarUrl: string | null;
    };
  } | null;
}

export const sightingService = {
  getSightings: async (): Promise<Sighting[]> => {
    const response = await axios.get('/sightings');
    return response.data;
  },
  
  getSightingById: async (id: string): Promise<Sighting> => {
    const response = await axios.get(`/sightings/${id}`);
    return response.data;
  },

  createSighting: async (dto: CreateSightingDto): Promise<Sighting> => {
    const response = await axios.post('/sightings', dto);
    return response.data;
  },

  getNearbySightings: async (lat: number, lng: number): Promise<Sighting[]> => {
    const response = await axios.get(`/sightings/nearby?lat=${lat}&lng=${lng}`);
    return response.data;
  },

  takeCharge: async (id: string): Promise<Sighting> => {
    const response = await axios.patch(`/sightings/${id}/take-charge`);
    return response.data;
  },

  resolve: async (id: string, status: 'SECOURU' | 'NON_TROUVE'): Promise<Sighting> => {
    const response = await axios.patch(`/sightings/${id}/resolve`, { status });
    return response.data;
  },

  uploadPhoto: async (id: string, photoUri: string): Promise<Sighting> => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: `sighting-${id}-${Date.now()}.jpg`,
    } as any);

    const response = await axios.post(`/sightings/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};