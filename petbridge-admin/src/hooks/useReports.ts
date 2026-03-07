import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

// Types for Report data
export interface Report {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  status: 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE';
  createdAt: Date;
  updatedAt: Date;
  reporterId: string;
  reportedUserId?: string;
  animalId?: string;
  messageId?: string;
  cible: 'UTILISATEUR' | 'ANIMAL' | 'MESSAGE';
  raison: string;
}

export function useReports() {
  const { data, isLoading, error } = useQuery({  
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get('/reports');
      return response.data;
    },
  });

  return {
    reports: data?.data ?? [],  
    isLoading,
    error,
  };
}