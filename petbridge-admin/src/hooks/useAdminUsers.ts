import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  isBanned: boolean;
  banReason?: string | null;
  createdAt: string;
}

export interface UsersFilters {
  search?: string;
  status?: 'all' | 'active' | 'banned';
}

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    status: 'all',
  });
  const { user } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.isBanned = filters.status === 'banned';

      const response = await api.get('/users/admin/all', { params });
      const mappedUsers = response.data.data.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        avatar: user.profile?.avatarUrl,
        roles: user.roles || [],
        isBanned: user.isBanned,
        banReason: user.bannedReason,
        createdAt: user.createdAt,
      }));
      setUsers(mappedUsers);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Échec du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const banUser = useCallback(async (userId: string, reason: string) => {
    try {
      await api.patch(`/users/admin/${userId}/ban`, { reason });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBanned: true, banReason: reason } : user
      ));
      toast.success('Utilisateur banni avec succès');
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error('Échec du bannissement de l\'utilisateur');
    }
  }, []);

  const unbanUser = useCallback(async (userId: string) => {
    try {
      await api.patch(`/users/admin/${userId}/unban`);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBanned: false, banReason: null } : user
      ));
      toast.success('Utilisateur débanni avec succès');
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error('Échec du débannissement de l\'utilisateur');
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: 'all' | 'active' | 'banned') => {
    setFilters(prev => ({ ...prev, status: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const isCurrentUser = useCallback((userId: string) => user?.id === userId, [user]);

  return {
    users,
    loading,
    currentPage,
    totalPages,
    filters,
    fetchUsers,
    banUser,
    unbanUser,
    handleSearch,
    handleStatusChange,
    handlePageChange,
    isCurrentUser,
  };
}