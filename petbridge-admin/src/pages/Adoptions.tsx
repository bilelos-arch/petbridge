import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useAdminAdoptions, type AdoptionStatus, type Adoption } from '../hooks/useAdminAdoptions';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

const AdoptionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedAdoption, setSelectedAdoption] = useState<Adoption | null>(null);

  const {
    adoptions,
    total,
    currentPage,
    totalPages,
    loading,
    filters,
    handleFilterChange,
    handlePageChange,
  } = useAdminAdoptions();

  const handleOpenDialog = (adoption: Adoption) => {
    setSelectedAdoption(adoption);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getAnimalPrimaryPhoto = (adoption: Adoption) => {
    return adoption.animal.photos.find(photo => photo.isPrimary) || adoption.animal.photos[0];
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Gestion des Adoptions"
          description="Gérez les demandes d'adoption et leurs statuts"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-3 shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="statusFilter">Statut</Label>
                  <Select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => {
                      const newStatus = e.target.value as AdoptionStatus | '';
                      setStatusFilter(newStatus);
                      handleFilterChange({
                        ...filters,
                        status: newStatus || undefined,
                      });
                    }}
                    className="mt-1"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="EN_ATTENTE">⏳ En attente</option>
                    <option value="ACCEPTEE">✅ Acceptée</option>
                    <option value="REJETEE">❌ Rejetée</option>
                    <option value="ANNULEE">🚫 Annulée</option>
                    <option value="COMPLETEE">🏠 Complétée</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle>Adoptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : !adoptions || adoptions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Aucune adoption trouvée
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Adoptant</TableHead>
                      <TableHead>Donneur</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adoptions.map((adoption) => {
                      const primaryPhoto = getAnimalPrimaryPhoto(adoption);

                      return (
                        <TableRow key={adoption.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-16 w-16 rounded-full overflow-hidden">
                                {primaryPhoto ? (
                                  <img
                                    src={primaryPhoto.url}
                                    alt={adoption.animal.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-gray-200 flex items-center justify-center text-2xl">
                                    🐾
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold">{adoption.animal.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {adoption.adopter.profile ? (
                                `${adoption.adopter.profile.firstName} ${adoption.adopter.profile.lastName}`
                              ) : adoption.adopter.email}
                            </div>
                            <div className="text-sm text-gray-500">{adoption.adopter.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {adoption.donneur.profile ? (
                                `${adoption.donneur.profile.firstName} ${adoption.donneur.profile.lastName}`
                              ) : adoption.donneur.email}
                            </div>
                            <div className="text-sm text-gray-500">{adoption.donneur.email}</div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={adoption.message}>
                            {adoption.message || 'Aucun message'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={adoption.status} type="adoption" />
                          </TableCell>
                          <TableCell>
                            {formatDate(adoption.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenDialog(adoption)}
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← Précédent
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} sur {totalPages} ({total} adoption{total > 1 ? 's' : ''})
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant →
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedAdoption} onOpenChange={() => setSelectedAdoption(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails de l'Adoption</DialogTitle>
              <DialogDescription>
                Informations complètes sur l'adoption
              </DialogDescription>
            </DialogHeader>

            {selectedAdoption && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Animal</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        {getAnimalPrimaryPhoto(selectedAdoption) ? (
                          <img
                            src={getAnimalPrimaryPhoto(selectedAdoption)!.url}
                            alt={selectedAdoption.animal.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xl">
                            🐾
                          </div>
                        )}
                      </div>
                      <div className="font-medium">
                        {selectedAdoption.animal.name} - {selectedAdoption.animal.species}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Statut</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedAdoption.status} type="adoption" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Adoptant</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <div className="font-medium">
                        {selectedAdoption.adopter.profile ? (
                          `${selectedAdoption.adopter.profile.firstName} ${selectedAdoption.adopter.profile.lastName}`
                        ) : selectedAdoption.adopter.email}
                      </div>
                      <div className="text-sm text-gray-500">{selectedAdoption.adopter.email}</div>
                    </div>
                  </div>
  
                  <div>
                    <Label>Donneur</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md">
                      <div className="font-medium">
                        {selectedAdoption.donneur.profile ? (
                          `${selectedAdoption.donneur.profile.firstName} ${selectedAdoption.donneur.profile.lastName}`
                        ) : selectedAdoption.donneur.email}
                      </div>
                      <div className="text-sm text-gray-500">{selectedAdoption.donneur.email}</div>
                    </div>
                </div>

                <div>
                  <Label>Message de l'adoptant</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    {selectedAdoption.message || 'Aucun message'}
                  </div>
                </div>

                {selectedAdoption.decisionNote && (
                  <div>
                    <Label>Note de décision</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md">
                      {selectedAdoption.decisionNote}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de création</Label>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatDate(selectedAdoption.createdAt)}
                    </div>
                  </div>

                  {selectedAdoption.decidedAt && (
                    <div>
                      <Label>Date de décision</Label>
                      <div className="mt-1 text-sm text-gray-500">
                        {formatDate(selectedAdoption.decidedAt)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelectedAdoption(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdoptionsPage;