import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';

export type SightingStatus = 'SIGNALE' | 'PRIS_EN_CHARGE' | 'SECOURU' | 'NON_TROUVE';

export type AnimalSituation = 'BLESSE' | 'EN_BONNE_SANTE' | 'AGRESSIF' | 'AVEC_PETITS' | 'INCONNU';

export interface Sighting {
  id: string;
  latitude: number;
  longitude: number;
  situation: AnimalSituation;
  description: string | null;
  photoUrl: string | null;
  status: SightingStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    email: string;
    profile: {
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
      firstName: string;
      lastName: string;
      phone: string | null;
      city: string;
      avatarUrl: string | null;
    };
  } | null;
}

export interface AdminSightingsResponse {
  data: Sighting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSightingsFilters {
  status?: SightingStatus;
  search?: string;
  page?: number;
  limit?: number;
}

const API_BASE = '/sightings';

export const useAdminSightings = (filters: AdminSightingsFilters = {}) => {
  const { data, isLoading, error } = useQuery<AdminSightingsResponse>({
    queryKey: ['admin-sightings', filters],
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

  return {
    data,
    isLoading,
    error,
  };
};