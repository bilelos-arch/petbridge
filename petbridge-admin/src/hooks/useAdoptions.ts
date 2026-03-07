import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

// Types for Adoption data
export interface Adoption {
  id: string
  status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE' | 'COMPLETEE'
  message: string
  createdAt: Date
  updatedAt: Date
  adopterId: string
  animalId: string
  rejectedReason?: string
  animal?: {
    id: string
    name: string
    photos?: Array<{
      id: string
      url: string
      isPrimary: boolean
    }>
  }
  adopter?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
      avatarUrl?: string
    }
  }
  donneur?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
      avatarUrl?: string
    }
  }
}

// Types for paginated response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Hook for fetching all adoption requests with filters and pagination
export const useAdoptions = (params: {
  status?: string
  animalId?: string
  adopterId?: string
  page?: number
  limit?: number
} = {}) => {
  return useQuery<PaginatedResponse<Adoption>>({
    queryKey: ['adoptions', params],
    queryFn: async () => {
      const response = await api.get('/adoptions', {
        params,
      })
      return response.data
    },
  })
}

// Hook for fetching adoption request by ID
export const useAdoptionById = (adoptionId: string) => {
  return useQuery<Adoption>({
    queryKey: ['adoption', adoptionId],
    queryFn: async () => {
      const response = await api.get(`/adoptions/${adoptionId}`)
      return response.data
    },
    enabled: !!adoptionId,
  })
}

// Hook for fetching adoption requests received by current user (as donneur)
export const useReceivedAdoptions = () => {
  return useQuery<Adoption[]>({
    queryKey: ['receivedAdoptions'],
    queryFn: async () => {
      const response = await api.get('/adoptions/received')
      return response.data
    },
  })
}

// Hook for fetching adoption requests made by current user (as adopter)
export const useMyAdoptions = () => {
  return useQuery<Adoption[]>({
    queryKey: ['myAdoptions'],
    queryFn: async () => {
      const response = await api.get('/adoptions/my-requests')
      return response.data
    },
  })
}

// Hook for accepting an adoption request
export const useAcceptAdoption = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: async (adoptionId: string) => {
      const response = await api.patch(`/adoptions/${adoptionId}/accept`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptions'] })
      queryClient.invalidateQueries({ queryKey: ['receivedAdoptions'] })
      queryClient.invalidateQueries({ queryKey: ['myAdoptions'] })
    },
    onError: (error: Error) => {
      console.error('Failed to accept adoption:', error)
    },
  })
}

// Hook for rejecting an adoption request
export const useRejectAdoption = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, { adoptionId: string; reason: string }>({
    mutationFn: async ({ adoptionId, reason }: { adoptionId: string; reason: string }) => {
      const response = await api.patch(`/adoptions/${adoptionId}/reject`, { reason })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptions'] })
      queryClient.invalidateQueries({ queryKey: ['receivedAdoptions'] })
      queryClient.invalidateQueries({ queryKey: ['myAdoptions'] })
    },
    onError: (error: Error) => {
      console.error('Failed to reject adoption:', error)
    },
  })
}

// Hook for canceling an adoption request
export const useCancelAdoption = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: async (adoptionId: string) => {
      const response = await api.patch(`/adoptions/${adoptionId}/cancel`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptions'] })
      queryClient.invalidateQueries({ queryKey: ['receivedAdoptions'] })
      queryClient.invalidateQueries({ queryKey: ['myAdoptions'] })
    },
    onError: (error: Error) => {
      console.error('Failed to cancel adoption:', error)
    },
  })
}