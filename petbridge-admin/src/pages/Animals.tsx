import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useAdminAnimals, type AnimalStatus } from '../hooks/useAdminAnimals';
import { Toaster, toast } from 'sonner';

const Animals: React.FC = () => {
  const [status, setStatus] = useState<AnimalStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedAnimalName, setSelectedAnimalName] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

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
    approveAnimal,
    rejectAnimal,
  } = useAdminAnimals({
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  // Handle approve animal
  const handleApproveAnimal = async (animalId: string) => {
    try {
      await approveAnimal.mutateAsync(animalId);
      toast.success('Animal approuvé avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'approbation de l\'animal');
    }
  };

  // Handle reject animal
  const handleRejectAnimal = async () => {
    if (selectedAnimalId) {
      try {
        await rejectAnimal.mutateAsync({
          animalId: selectedAnimalId,
          rejectedReason: rejectReason,
        });
        toast.success('Animal rejeté');
        setIsRejectDialogOpen(false);
        setRejectReason('');
        setSelectedAnimalId(null);
        setSelectedAnimalName('');
      } catch (error) {
        toast.error('Erreur lors du rejet de l\'animal');
      }
    }
  };

  // Open reject dialog
  const openRejectDialog = (animalId: string, animalName: string) => {
    setSelectedAnimalId(animalId);
    setSelectedAnimalName(animalName);
    setIsRejectDialogOpen(true);
  };

  // Format date (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Get status badge color
  const getStatusBadgeColor = (status: AnimalStatus) => {
    switch (status) {
      case 'ATTENTE_VALIDATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800';
      case 'ADOPTE':
        return 'bg-blue-100 text-blue-800';
      case 'REJETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: AnimalStatus) => {
    switch (status) {
      case 'ATTENTE_VALIDATION':
        return '⏳ En attente de validation';
      case 'DISPONIBLE':
        return '✅ Disponible';
      case 'ADOPTE':
        return '🏠 Adopté';
      case 'REJETE':
        return '❌ Rejeté';
      default:
        return status;
    }
  };

  // Get species label
  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'CHIEN':
        return '🐶 Chien';
      case 'CHAT':
        return '🐱 Chat';
      case 'AUTRE':
        return '🦊 Autre';
      default:
        return species;
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      <h1 className="text-2xl font-bold">Gestion des Animaux</h1>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="status">Statut</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AnimalStatus | '')}
                className="mt-1"
              >
                <option value="">Tous les statuts</option>
                <option value="ATTENTE_VALIDATION">⏳ En attente de validation</option>
                <option value="DISPONIBLE">✅ Disponible</option>
                <option value="ADOPTE">🏠 Adopté</option>
                <option value="REJETE">❌ Rejeté</option>
              </Select>
            </div>

            {/* Search Filter */}
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Recherche par nom</Label>
              <Input
                id="search"
                type="text"
                placeholder="Entrez le nom de l'animal"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Count Indicator */}
            <div className="text-sm text-gray-600">
              {data ? `${data.total} ${data.total === 1 ? 'animal' : 'animaux'} trouvé${data.total > 1 ? 's' : ''}` : '...'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animals Table */}
      <Card>
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
              Erreur lors du chargement des animaux
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-gray-500 text-center py-10">
              Aucun animal trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((animal) => {
                    // Find primary photo or use first available
                    const primaryPhoto = animal.photos.find(photo => photo.isPrimary) || animal.photos[0];

                    // Get owner name
                    const ownerName = animal.owner.profile 
                      ? `${animal.owner.profile.firstName} ${animal.owner.profile.lastName}`
                      : animal.owner.email;

                    return (
                      <TableRow key={animal.id}>
                        <TableCell>
                          <div className="h-16 w-16 rounded-full overflow-hidden">
                            {primaryPhoto ? (
                              <img
                                src={primaryPhoto.url}
                                alt={animal.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center text-2xl">
                                🐾
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{animal.name}</div>
                          <div className="text-sm text-gray-500">
                            {getSpeciesLabel(animal.species)}
                          </div>
                          {animal.breed && (
                            <div className="text-xs text-gray-400">{animal.breed}</div>
                          )}
                        </TableCell>
                        <TableCell>{ownerName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(animal.status)}>
                            {getStatusLabel(animal.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(animal.createdAt)}</TableCell>
                        <TableCell className="flex gap-2">
                          {animal.status === 'ATTENTE_VALIDATION' && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleApproveAnimal(animal.id)}
                            >
                              Approuver
                            </Button>
                          )}
                          {(animal.status === 'ATTENTE_VALIDATION' || animal.status === 'DISPONIBLE') && (
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => openRejectDialog(animal.id, animal.name)}
                            >
                              Rejeter
                            </Button>
                          )}
                          {!(animal.status === 'ATTENTE_VALIDATION' || animal.status === 'DISPONIBLE') && (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    ← Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} sur {data.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.totalPages}
                  >
                    Suivant →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Animal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'annonce</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet pour {selectedAnimalName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Raison du rejet</Label>
              <Textarea
                id="rejectReason"
                placeholder="Entrez la raison du rejet (minimum 10 caractères)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                minLength={10}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleRejectAnimal}
              disabled={rejectReason.trim().length < 10}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Animals;