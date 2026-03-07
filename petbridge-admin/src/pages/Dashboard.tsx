import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { useAnimals, useApproveAnimal, useRejectAnimal } from '../hooks/useAnimals';
import { useReports } from '../hooks/useReports';
import { useAdoptions } from '../hooks/useAdoptions';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: animals = [], isLoading: animalsLoading, isError: animalsError } = useAnimals();
  const { data: reports = [], isLoading: reportsLoading, isError: reportsError } = useReports();
  const { data: adoptions = [], isLoading: adoptionsLoading, isError: adoptionsError } = useAdoptions();
  
  const approveAnimal = useApproveAnimal();
  const rejectAnimal = useRejectAnimal();

  // Filter animals pending validation
  const pendingAnimals = animals.filter(animal => animal.status === 'PENDING');

  // Filter recent reports (last 5)
  const recentReports = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Calculate statistics
  const availableAnimalsCount = animals.filter(animal => animal.status === 'AVAILABLE').length;
  const acceptedAdoptionsCount = adoptions.filter(adoption => adoption.status === 'ACCEPTED').length;
  const pendingAnimalsCount = pendingAnimals.length;
  const openReportsCount = reports.filter(report => report.status === 'PENDING').length;

  // Handle approve animal
  const handleApproveAnimal = async (animalId: string) => {
    approveAnimal.mutate(animalId);
  };

  // Handle reject animal
  const handleRejectAnimal = async () => {
    if (selectedAnimalId) {
      rejectAnimal.mutate({
        animalId: selectedAnimalId,
        reason: rejectReason
      });
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedAnimalId(null);
    }
  };

  // Open reject dialog
  const openRejectDialog = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setIsRejectDialogOpen(true);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Animals Available Card */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Animaux disponibles</CardTitle>
            <span className="text-2xl">🐾</span>
          </CardHeader>
          <CardContent>
            {animalsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : animalsError ? (
              <div className="text-red-500">Erreur</div>
            ) : (
              <div className="text-2xl font-bold">{availableAnimalsCount}</div>
            )}
          </CardContent>
        </Card>

        {/* Adoptions Accepted Card */}
        <Card className="border-2 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Adoptions acceptées</CardTitle>
            <span className="text-2xl">🏠</span>
          </CardHeader>
          <CardContent>
            {adoptionsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : adoptionsError ? (
              <div className="text-red-500">Erreur</div>
            ) : (
              <div className="text-2xl font-bold">{acceptedAdoptionsCount}</div>
            )}
          </CardContent>
        </Card>

        {/* Pending Validation Card */}
        <Card className="border-2 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              En attente de validation
              {pendingAnimalsCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{pendingAnimalsCount}</Badge>
              )}
            </CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            {animalsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : animalsError ? (
              <div className="text-red-500">Erreur</div>
            ) : (
              <div className="text-2xl font-bold">{pendingAnimalsCount}</div>
            )}
          </CardContent>
        </Card>

        {/* Open Reports Card */}
        <Card className="border-2 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Rapports ouverts
              {openReportsCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{openReportsCount}</Badge>
              )}
            </CardTitle>
            <span className="text-2xl">🚨</span>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : reportsError ? (
              <div className="text-red-500">Erreur</div>
            ) : (
              <div className="text-2xl font-bold">{openReportsCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Animals Pending Validation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Animaux en attente de validation</CardTitle>
        </CardHeader>
        <CardContent>
          {animalsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : animalsError ? (
            <div className="text-red-500">Erreur lors du chargement des animaux</div>
          ) : pendingAnimals.length === 0 ? (
            <div className="text-gray-500">Aucun animal en attente de validation</div>
          ) : (
            <>
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
                  {pendingAnimals.slice(0, 5).map(animal => (
                    <TableRow key={animal.id}>
                      <TableCell>{animal.name}</TableCell>
                      <TableCell>{animal.species}</TableCell>
                      <TableCell>{formatDate(new Date(animal.createdAt))}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveAnimal(animal.id)}
                        >
                          ✅
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(animal.id)}
                        >
                          ❌
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingAnimals.length > 5 && (
                <div className="mt-4 text-right">
                  <Link to="/animals" className="text-blue-500 hover:underline">
                    Voir tous
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports récents</CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : reportsError ? (
            <div className="text-red-500">Erreur lors du chargement des rapports</div>
          ) : recentReports.length === 0 ? (
            <div className="text-gray-500">Aucun rapport récent</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>{report.type}</TableCell>
                      <TableCell>{report.title}</TableCell>
                      <TableCell>{formatDate(new Date(report.createdAt))}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reports.length > 5 && (
                <div className="mt-4 text-right">
                  <Link to="/reports" className="text-blue-500 hover:underline">
                    Voir tous
                  </Link>
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
            <DialogTitle>Rejeter l'animal</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet de l'animal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Raison du rejet</Label>
              <Input
                id="rejectReason"
                placeholder="Entrez la raison du rejet"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectAnimal} disabled={!rejectReason.trim()}>
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;