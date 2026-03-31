import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Skeleton } from '../components/ui/skeleton';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminSightings, type SightingStatus, type AnimalSituation } from '../hooks/useAdminSightings';
import { Toaster } from 'sonner';

const Sightings: React.FC = () => {
  const [status, setStatus] = useState<SightingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to first page when status changes
  useEffect(() => {
    setPage(1);
  }, [status]);

  const {
    data,
    isLoading,
    error,
  } = useAdminSightings({
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  // Format date (DD/MM/YYYY HH:MM)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get situation label
  const getSituationLabel = (situation: AnimalSituation) => {
    switch (situation) {
      case 'BLESSE':
        return '🚨 Blessé';
      case 'EN_BONNE_SANTE':
        return '✅ En bonne santé';
      case 'AGRESSIF':
        return '⚠️ Agressif';
      case 'AVEC_PETITS':
        return '👶 Avec petits';
      case 'INCONNU':
      default:
        return '❓ Inconnu';
    }
  };

  // Get user name
  const getUserName = (user: { email: string; profile: { firstName: string; lastName: string } | null }) => {
    if (user.profile && user.profile.firstName && user.profile.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Toaster />
        
        <PageHeader
          title="Gestion des Signalements"
          description="Suivez et gérez les signalements d'animaux en danger"
        />

        {/* Filters Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Status Filter */}
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="status">Statut</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SightingStatus | '')}
                  className="mt-1"
                >
                  <option value="">Tous les statuts</option>
                  <option value="SIGNALE">🚨 Signalé</option>
                  <option value="PRIS_EN_CHARGE">🔵 Prise en charge</option>
                  <option value="SECOURU">✅ Secouru</option>
                  <option value="NON_TROUVE">❌ Introuvable</option>
                </Select>
              </div>

              {/* Search Filter */}
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Recherche</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Rechercher par description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Count Indicator */}
              <div className="text-sm text-gray-600">
                {data ? `${data.total} ${data.total === 1 ? 'signalement' : 'signalements'} trouvé${data.total > 1 ? 's' : ''}` : '...'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sightings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Signalements</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-10">
                Erreur lors du chargement des signalements
              </div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-gray-500 text-center py-10">
                Aucun signalement trouvé
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Situation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Signaleur</TableHead>
                      <TableHead>Bénévole</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((sighting) => (
                      <TableRow key={sighting.id}>
                        <TableCell>{formatDate(sighting.createdAt)}</TableCell>
                        <TableCell>{getSituationLabel(sighting.situation)}</TableCell>
                        <TableCell>
                          <StatusBadge status={sighting.status} type="sighting" />
                        </TableCell>
                        <TableCell>{getUserName(sighting.reporter)}</TableCell>
                        <TableCell>
                          {sighting.volunteer ? getUserName(sighting.volunteer) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {sighting.description || '-'}
                        </TableCell>
                        <TableCell>
                          {sighting.photoUrl ? (
                            <img
                              src={sighting.photoUrl}
                              alt="Signalement"
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400">-</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Précédent
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} sur {data.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
    </div>
  );
};

export default Sightings;