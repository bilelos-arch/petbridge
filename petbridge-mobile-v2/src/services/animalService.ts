import { AnimalsResponse, Animal } from '../types/animal';
import axiosInstance from '../lib/axios';

export interface AnimalFilters {
  species?: 'CHIEN' | 'CHAT' | 'AUTRE';
  size?: 'PETIT' | 'MOYEN' | 'GRAND';
  temperament?: 'CALME' | 'ACTIF' | 'TIMIDE' | 'JOUEUR' | 'PROTECTEUR';
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export const getMatchingAnimals = async (): Promise<Animal[]> => {
  const response = await axiosInstance.get('/matching');
  return response.data;
};

export const getAnimals = async (filters: AnimalFilters = {}): Promise<Animal[]> => {
  const params: Record<string, any> = {};
  
  if (filters.species) params.species = filters.species;
  if (filters.size) params.size = filters.size;
  if (filters.temperament) params.temperament = filters.temperament;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.sort) params.sort = filters.sort;
  // NE PAS envoyer search comme query param
  
  const response = await axiosInstance.get('/animals', { params });
  return response.data;
};

export const getAnimalsByCity = async (city: string): Promise<Animal[]> => {
  // Cette méthode n'est plus utilisée depuis que le backend ne supporte plus le filtre par ville
  // Elle est conservée pour éviter les erreurs dans le code existant
  return getAnimals({});
};

export const getLatestAnimals = async (limit: number = 5): Promise<Animal[]> => {
  return getAnimals({ limit, sort: 'createdAt' });
};

export const getAnimalById = async (id: string): Promise<Animal> => {
  const response = await axiosInstance.get(`/animals/${id}`);
  return response.data;
};

export const animalService = {
  getAnimals,
  getAnimalsByCity,
  getLatestAnimals,
  getAnimalById,
  getMatchingAnimals,

  createAnimal: async (data: {
    name: string;
    species: 'CHIEN' | 'CHAT' | 'AUTRE';
    breedId?: string;
    age?: number;
    sex?: string;
    size?: string;
    temperament?: string;
    city?: string;
    description?: string;
    vaccinated?: boolean;
    spayed?: boolean;
    dewormed?: boolean;
  }, token: string): Promise<any> => {
    const response = await axiosInstance.post('/animals', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  uploadPhoto: async (
    animalId: string,
    photoUri: string,
    token: string
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    const response = await axiosInstance.post(`/animals/${animalId}/photos`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyAnimals: async (): Promise<Animal[]> => {
    const response = await axiosInstance.get('/animals/my');
    return response.data;
  },

  deleteAnimal: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/animals/${id}`);
  },

  updateAnimal: async (id: string, data: any, token: string): Promise<any> => {
    const response = await axiosInstance.put(`/animals/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

};