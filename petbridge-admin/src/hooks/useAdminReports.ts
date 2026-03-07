import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { toast } from 'sonner';

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

export interface ReportFilters {
  status?: 'all' | 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE';
  cible?: 'all' | 'UTILISATEUR' | 'ANIMAL' | 'MESSAGE';
}

export function useAdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ReportFilters>({
    status: 'all',
    cible: 'all',
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const requestFilters: any = {};
      if (filters.status && filters.status !== 'all') {
        requestFilters.status = filters.status;
      }
      if (filters.cible && filters.cible !== 'all') {
        requestFilters.cible = filters.cible;
      }

      const response = await api.get('/reports', { 
        params: {
          page: currentPage,
          limit: 10,
        },
        data: requestFilters
      });
      
      // If the response has data and totalPages, it's paginated
      if (response.data.data) {
        setReports(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        // If not paginated, use the response directly
        setReports(response.data);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Échec du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReportStatus = useCallback(async (reportId: string, status: 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE', adminNote?: string) => {
    try {
      const payload: any = { status };
      if (adminNote) {
        payload.adminNote = adminNote;
      }
      
      await api.patch(`/reports/${reportId}/status`, payload);
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, status } : report
      ));
      toast.success('Statut du signalement mis à jour');
    } catch (error: any) {
      console.error('Error updating report status:', error);
      toast.error('Échec de la mise à jour du statut');
    }
  }, []);

  const banUserFromReport = useCallback(async (reportId: string) => {
    try {
      await api.patch(`/reports/${reportId}/ban-user`);
      toast.success('Utilisateur banni avec succès');
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error('Échec du bannissement de l\'utilisateur');
    }
  }, []);

  const handleStatusChange = useCallback((value: 'all' | 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE') => {
    setFilters(prev => ({ ...prev, status: value }));
    setCurrentPage(1);
  }, []);

  const handleCibleChange = useCallback((value: 'all' | 'UTILISATEUR' | 'ANIMAL' | 'MESSAGE') => {
    setFilters(prev => ({ ...prev, cible: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    reports,
    loading,
    currentPage,
    totalPages,
    filters,
    fetchReports,
    updateReportStatus,
    banUserFromReport,
    handleStatusChange,
    handleCibleChange,
    handlePageChange,
  };
}