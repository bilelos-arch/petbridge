import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { breedService } from '../services/breedService';
import { toast } from 'sonner';

export interface BreedFilters {
  species?: 'CHIEN' | 'CHAT' | 'AUTRE';
}

export interface Breed {
  id: string;
  name: string;
  species: 'CHIEN' | 'CHAT' | 'AUTRE';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const useAdminBreeds = (filters: BreedFilters = {}) => {
  const queryClient = useQueryClient();

  const { data: breeds, isLoading, error } = useQuery<Breed[]>({
    queryKey: ['admin-breeds', filters],
    queryFn: async () => {
      return await breedService.getAll(filters.species);
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  const createBreed = useMutation({
    mutationFn: async (data: {
      name: string;
      species: 'CHIEN' | 'CHAT' | 'AUTRE';
      description?: string;
    }) => {
      return await breedService.create({
        ...data,
        description: data.description || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast.success('Race créée avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating breed:', error);
      toast.error('Échec de la création de la race');
    },
  });

  const updateBreed = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      return await breedService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast.success('Race mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Error updating breed:', error);
      toast.error('Échec de la mise à jour de la race');
    },
  });

  const deleteBreed = useMutation({
    mutationFn: async (id: string) => {
      return await breedService.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast.success('Race supprimée avec succès');
    },
    onError: (error: any) => {
      console.error('Error deleting breed:', error);
      toast.error('Échec de la suppression de la race');
    },
  });

  return {
    breeds,
    isLoading,
    error,
    createBreed,
    updateBreed,
    deleteBreed,
  };
};
