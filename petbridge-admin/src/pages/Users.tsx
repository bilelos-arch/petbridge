import { useState, useCallback } from 'react';
import { Search, UserCheck, UserX, ShieldAlert, Ban, User as UserIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useAdminUsers, type User } from '../hooks/useAdminUsers';

export default function Users() {
  const {
    users,
    loading,
    currentPage,
    totalPages,
    filters,
    banUser,
    unbanUser,
    handleSearch,
    handleStatusChange,
    handlePageChange,
    isCurrentUser,
  } = useAdminUsers();

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  const handleBanClick = useCallback((user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDialogOpen(true);
  }, []);

  const handleBanConfirm = useCallback(async () => {
    if (!selectedUser) return;
    
    await banUser(selectedUser.id, banReason);
    setBanDialogOpen(false);
    setSelectedUser(null);
  }, [selectedUser, banReason, banUser]);

  const handleUnbanClick = useCallback(async (user: User) => {
    await unbanUser(user.id);
  }, [unbanUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = (user: User) => {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }
  return user.email[0].toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 mt-1">
            Gérez les comptes utilisateurs, bannissez ou débannissez des utilisateurs
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Rechercher par email ou nom..."
              className="pl-10 w-full lg:w-64"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as 'all' | 'active' | 'banned')}
            className="w-full lg:w-40"
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="banned">Bannis</option>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <UserIcon className="h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                    <p className="text-sm">Essayez de modifier vos filtres</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.firstName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user)
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-500">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="capitalize">
                          {role === 'ADMIN' ? 'Admin' : 'Utilisateur'}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <UserX className="h-3 w-3" />
                        Banni
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200 bg-green-50">
                        <UserCheck className="h-3 w-3" />
                        Actif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-500">{formatDate(user.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isCurrentUser(user.id) && (
                      user.isBanned ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleUnbanClick(user)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Débannir
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleBanClick(user)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Bannir
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Bannir utilisateur
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir bannir {selectedUser?.firstName || selectedUser?.email} ?
              Cette action est réversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du bannissement</Label>
              <Textarea
                id="reason"
                placeholder="Expliquez la raison du bannissement..."
                className="min-h-[100px]"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleBanConfirm} disabled={!banReason.trim()}>
              Bannir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}