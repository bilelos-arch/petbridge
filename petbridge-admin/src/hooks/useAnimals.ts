import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

// Types for Animal data
export interface Animal {
  id: string
  name: string
  species: string
  breed: string
  age: number
  gender: string
  description: string
  status: 'PENDING' | 'AVAILABLE' | 'ADOPTED' | 'REJECTED'
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export interface RejectAnimalDto {
  reason: string
}

// Hook for fetching animals
export const useAnimals = (filters?: Record<string, unknown>) => {
  return useQuery<Animal[]>({
    queryKey: ['animals', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      const response = await api.get(`/animals?${params.toString()}`)
      return response.data
    },
  })
}

// Hook for approving an animal
export const useApproveAnimal = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: async (animalId: string) => {
      const response = await api.put(`/animals/${animalId}/approve`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
    onError: (error: Error) => {
      console.error('Failed to approve animal:', error)
    },
  })
}

// Hook for rejecting an animal
export const useRejectAnimal = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, { animalId: string; reason: string }>({
    mutationFn: async ({ animalId, reason }: { animalId: string; reason: string }) => {
      const response = await api.put(`/animals/${animalId}/reject`, { reason })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
    onError: (error: Error) => {
      console.error('Failed to reject animal:', error)
    },
  })
}