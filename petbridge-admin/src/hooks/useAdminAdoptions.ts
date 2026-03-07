import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { toast } from 'sonner';

export type AdoptionStatus = 'EN_ATTENTE' | 'ACCEPTEE' | 'REJETEE' | 'ANNULEE' | 'REFUSEE' | 'COMPLETEE';

export interface Adoption {
  id: string;
  status: AdoptionStatus;
  createdAt: string;
  updatedAt: string;
  message?: string;
  decisionNote?: string;
  decidedAt?: string;
  adopterId: string;
  animalId: string;
  donneurId: string;
  animal: {
    id: string;
    name: string;
    species: string;
    photos: { url: string; isPrimary: boolean }[];
  };
  adopter: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    } | null;
  };
  donneur: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    } | null;
  };
}

export interface AdminAdoptionsResponse {
  data: Adoption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAdoptionsFilters {
  status?: AdoptionStatus;
  animalId?: string;
  adopterId?: string;
}

const API_BASE = '/adoptions';

export const useAdminAdoptions = () => {
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminAdoptionsFilters>({});
  const limit = 10;

  const fetchAdoptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.animalId) params.append('animalId', filters.animalId);
      if (filters.adopterId) params.append('adopterId', filters.adopterId);
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`${API_BASE}?${params}`);
      
      // If the response has data and totalPages, it's paginated
      if (response.data.data) {
        setAdoptions(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      } else {
        // If not paginated, use the response directly
        setAdoptions(response.data);
        setTotalPages(1);
        setTotal(response.data.length);
      }
    } catch (error: any) {
      console.error('Error fetching adoptions:', error);
      toast.error('Échec du chargement des adoptions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchAdoptions();
  }, [fetchAdoptions]);

  const handleFilterChange = useCallback((newFilters: AdminAdoptionsFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    adoptions,
    total,
    currentPage,
    totalPages,
    limit,
    loading,
    filters,
    handleFilterChange,
    handlePageChange,
  };
};