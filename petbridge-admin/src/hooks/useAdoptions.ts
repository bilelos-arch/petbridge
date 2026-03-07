import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

// Types for Adoption data
export interface Adoption {
  id: string;
  status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REJETEE';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  animalId: string;
}

export function useAdoptions() {
  const { data: adoptions, isLoading, error } = useQuery({
    queryKey: ['adoptions'],
    queryFn: async () => {
      const response = await api.get('/adoptions');
      return response.data;
    },
    select: (data) => data?.data ?? [],
  });

  return {
    adoptions,
    isLoading,
    error,
  };
}