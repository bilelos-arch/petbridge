import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from 'sonner';

// Types for Animal data
export interface Animal {
  id: string;
  name: string;
  species: string;
  status: 'DISPONIBLE' | 'ATTENTE_VALIDATION' | 'ADOPTE' | 'REJETE';
  createdAt: Date;
  updatedAt: Date;
}

export function useAnimals() {
  const queryClient = useQueryClient();

  const { data: animals, isLoading, error } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await api.get('/animals');
      return response.data;
    },
  });

  const approveAnimal = useMutation({
    mutationFn: async (animalId: string) => {
      await api.put(`/animals/${animalId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast.success('Animal approuvé avec succès');
    },
    onError: (error: any) => {
      console.error('Error approving animal:', error);
      toast.error('Échec de l\'approbation de l\'animal');
    },
  });

  const rejectAnimal = useMutation({
    mutationFn: async ({ animalId, rejectedReason }: { animalId: string; rejectedReason: string }) => {
      await api.put(`/animals/${animalId}/reject`, { rejectedReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast.success('Animal rejeté avec succès');
    },
    onError: (error: any) => {
      console.error('Error rejecting animal:', error);
      toast.error('Échec du rejet de l\'animal');
    },
  });

  return {
    animals,
    isLoading,
    error,
    approveAnimal,
    rejectAnimal,
  };
}