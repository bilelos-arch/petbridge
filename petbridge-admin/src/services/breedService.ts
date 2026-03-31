import axios from '../lib/axios';

export interface Breed {
  id: string;
  name: string;
  species: 'CHIEN' | 'CHAT' | 'AUTRE';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const breedService = {
  getAll: async (species?: string): Promise<Breed[]> => {
    const params = species ? { species } : {};
    const response = await axios.get('/breeds', { params });
    return response.data;
  },
  create: async (data: Omit<Breed, 'id' | 'createdAt' | 'updatedAt'>): Promise<Breed> => {
    const response = await axios.post('/breeds', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Omit<Breed, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Breed> => {
    const response = await axios.put(`/breeds/${id}`, data);
    return response.data;
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`/breeds/${id}`);
  },
};