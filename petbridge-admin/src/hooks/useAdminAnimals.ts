import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';

export type AnimalStatus = 'ATTENTE_VALIDATION' | 'DISPONIBLE' | 'ADOPTE' | 'REJETE';

export interface Animal {
  id: string;
  name: string;
  species: 'CHIEN' | 'CHAT' | 'AUTRE';
  status: AnimalStatus;
  breed: { id: string; name: string } | null;
  createdAt: string;
  photos: { url: string; isPrimary: boolean }[];
  owner: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
  vaccinated?: boolean;
  spayed?: boolean;
  dewormed?: boolean;
  color?: string;
  medicalConditions?: string;
}

export interface AdminAnimalsResponse {
  data: Animal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAnimalsFilters {
  status?: AnimalStatus;
  search?: string;
  page?: number;
  limit?: number;
}

const API_BASE = '/animals/admin/animals';

export const useAdminAnimals = (filters: AdminAnimalsFilters = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<AdminAnimalsResponse>({
    queryKey: ['admin-animals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`${API_BASE}?${params}`);
      return response.data;
    },
    staleTime: 0,
    refetchInterval: false,
  });

  const approveAnimal = useMutation({
    mutationFn: async (animalId: string) => {
      const response = await axios.put(`/animals/${animalId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-animals'] });
    },
  });

  const rejectAnimal = useMutation({
    mutationFn: async ({ animalId, rejectedReason }: { animalId: string; rejectedReason: string }) => {
      const response = await axios.put(`/animals/${animalId}/reject`, { rejectedReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-animals'] });
    },
  });

  return {
    data,
    isLoading,
    error,
    approveAnimal,
    rejectAnimal,
  };
};