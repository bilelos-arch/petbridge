import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { useAnimals } from '../hooks/useAnimals';
import { useReports } from '../hooks/useReports';
import { useAdoptions } from '../hooks/useAdoptions';

const DashboardPage: React.FC = () => {
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  const { animals, isLoading: animalsLoading, approveAnimal, rejectAnimal } = useAnimals();
  const { reports, isLoading: reportsLoading } = useReports();
  const { adoptions, isLoading: adoptionsLoading } = useAdoptions();

  // Calculate statistics
  const availableAnimalsCount = animals?.filter((animal: any) => animal.status === 'DISPONIBLE').length || 0;
  const acceptedAdoptionsCount = adoptions?.filter((adoption: any) => adoption.status === 'ACCEPTEE').length || 0;
  const pendingAnimalsCount = animals?.filter((animal: any) => animal.status === 'ATTENTE_VALIDATION').length || 0;
  const openReportsCount = reports?.filter((report: any) => report.status === 'OUVERT').length || 0;

  // Get pending animals for table (max 5)
  const pendingAnimals = animals?.filter((animal: any) => animal.status === 'ATTENTE_VALIDATION').slice(0, 5) || [];

  // Get recent reports for table (max 5)
  const recentReports = reports?.slice(0, 5) || [];

  const handleApprove = (animalId: string) => {
    approveAnimal.mutate(animalId);
  };

  const handleReject = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (selectedAnimalId && rejectReason.trim()) {
      rejectAnimal.mutate({
        animalId: selectedAnimalId,
        rejectedReason: rejectReason.trim(),
      });
      setSelectedAnimalId(null);
      setRejectReason('');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OUVERT':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'EN_COURS':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'RESOLU':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'REJETE':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Available Animals */}
          <Card className="border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Animaux disponibles
              </CardTitle>
              <div className="text-2xl">🐾</div>
            </CardHeader>
            <CardContent>
              {animalsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {availableAnimalsCount}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accepted Adoptions */}
          <Card className="border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Adoptions acceptées
              </CardTitle>
              <div className="text-2xl">🏠</div>
            </CardHeader>
            <CardContent>
              {adoptionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {acceptedAdoptionsCount}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Validation */}
          <Card className="border-l-4 border-orange-500 relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                En attente de validation
              </CardTitle>
              <div className="text-2xl">⏳</div>
            </CardHeader>
            <CardContent>
              {animalsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {pendingAnimalsCount}
                </div>
              )}
            </CardContent>
            {pendingAnimalsCount > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                !
              </div>
            )}
          </Card>

          {/* Open Reports */}
          <Card className="border-l-4 border-red-500 relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Signalements ouverts
              </CardTitle>
              <div className="text-2xl">🚨</div>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {openReportsCount}
                </div>
              )}
            </CardContent>
            {openReportsCount > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                !
              </div>
            )}
          </Card>
        </div>

        {/* Pending Animals Table */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Animaux en attente de validation</CardTitle>
            {pendingAnimalsCount > 0 && (
              <Link to="/animals">
                <Button variant="secondary" size="sm">
                  Voir tout
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {animalsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : pendingAnimals.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Aucun animal en attente
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAnimals.map((animal: any) => (
                    <TableRow key={animal.id}>
                      <TableCell>{animal.name}</TableCell>
                      <TableCell>{animal.species}</TableCell>
                      <TableCell>
                        {new Date(animal.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(animal.id)}
                          >
                            ✅ Approuver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(animal.id)}
                          >
                            ❌ Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Signalements récents</CardTitle>
            {reports?.length > 0 && (
              <Link to="/reports">
                <Button variant="secondary" size="sm">
                  Voir tout
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Aucun signalement
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge
                          className={
                            report.cible === 'UTILISATEUR'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : report.cible === 'ANIMAL'
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          }
                        >
                          {report.cible === 'UTILISATEUR' && '👤 Utilisateur'}
                          {report.cible === 'ANIMAL' && '🐾 Animal'}
                          {report.cible === 'MESSAGE' && '💬 Message'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={report.raison}>
                        {report.raison}
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(report.status)}>
                          {report.status === 'OUVERT' && '🔴 Ouvert'}
                          {report.status === 'EN_COURS' && '🟠 En cours'}
                          {report.status === 'RESOLU' && '🟢 Résolu'}
                          {report.status === 'REJETE' && '⚫ Rejeté'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reject Animal Dialog */}
        <Dialog
          open={!!selectedAnimalId}
          onOpenChange={() => setSelectedAnimalId(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rejeter l'animal</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du rejet de l'animal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectReason">Raison du rejet</Label>
                <Input
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Entrez la raison du rejet..."
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setSelectedAnimalId(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
              >
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardPage;