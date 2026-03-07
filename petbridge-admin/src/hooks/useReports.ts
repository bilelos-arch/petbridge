import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

// Types for Report data
export interface Report {
  id: string
  title: string
  description: string
  type: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: Date
  updatedAt: Date
  reporterId: string
  reportedUserId: string
  animalId?: string
}

export interface ReportFiltersDto {
  status?: string
  type?: string
  fromDate?: string
  toDate?: string
}

// Hook for fetching all reports (admin only)
export const useReports = (filters?: ReportFiltersDto) => {
  return useQuery<Report[]>({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const response = await api.get('/reports', { data: filters })
      return response.data
    },
  })
}

// Hook for fetching a single report by ID (admin only)
export const useReportById = (reportId: string) => {
  return useQuery<Report>({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const response = await api.get(`/reports/${reportId}`)
      return response.data
    },
    enabled: !!reportId,
  })
}

// Hook for updating report status
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, { reportId: string; status: string }>({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const response = await api.patch(`/reports/${reportId}/status`, { status })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] })
    },
    onError: (error: Error) => {
      console.error('Failed to update report status:', error)
    },
  })
}

// Hook for banning a user from a report
export const useBanUser = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: async (reportId: string) => {
      const response = await api.patch(`/reports/${reportId}/ban-user`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: (error: Error) => {
      console.error('Failed to ban user:', error)
    },
  })
}