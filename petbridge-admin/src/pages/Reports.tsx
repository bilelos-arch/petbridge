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
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { useAdminReports } from '../hooks/useAdminReports';

const ReportsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [targetFilter, setTargetFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState<string>('');

  const {
    reports,
    loading,
    handleStatusChange,
    handleCibleChange,
    updateReportStatus,
    banUserFromReport,
  } = useAdminReports();

  const handleOpenDialog = (report: any) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNote('');
  };

  const handleBanDialogOpen = (report: any) => {
    setSelectedReport(report);
    setBanReason('');
    setIsBanDialogOpen(true);
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

  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case 'UTILISATEUR':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'ANIMAL':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'MESSAGE':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestion des Signalements
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-3">
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
                      setStatusFilter(e.target.value);
                      handleStatusChange(e.target.value as 'all' | 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE');
                    }}
                    className="mt-1"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="OUVERT">🔴 Ouvert</option>
                    <option value="EN_COURS">🟠 En cours</option>
                    <option value="RESOLU">🟢 Résolu</option>
                    <option value="REJETE">⚫ Rejeté</option>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="targetFilter">Type de cible</Label>
                  <Select
                    id="targetFilter"
                    value={targetFilter}
                    onChange={(e) => {
                      setTargetFilter(e.target.value);
                      handleCibleChange(e.target.value as 'all' | 'UTILISATEUR' | 'ANIMAL' | 'MESSAGE');
                    }}
                    className="mt-1"
                  >
                    <option value="all">Tous les types</option>
                    <option value="UTILISATEUR">👤 Utilisateur</option>
                    <option value="ANIMAL">🐾 Animal</option>
                    <option value="MESSAGE">💬 Message</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signalements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Aucun signalement trouvé
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Signalé par</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge className={getTargetBadgeColor(report.cible)}>
                          {report.cible === 'UTILISATEUR' && '👤 Utilisateur'}
                          {report.cible === 'ANIMAL' && '🐾 Animal'}
                          {report.cible === 'MESSAGE' && '💬 Message'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={report.raison}>
                        {report.raison}
                      </TableCell>
                      <TableCell>User {report.reporterId}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(report.status)}>
                          {report.status === 'OUVERT' && '🔴 Ouvert'}
                          {report.status === 'EN_COURS' && '🟠 En cours'}
                          {report.status === 'RESOLU' && '🟢 Résolu'}
                          {report.status === 'REJETE' && '⚫ Rejeté'}
                        </Badge>
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
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDialog(report)}
                        >
                          Traiter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Traiter le Signalement</DialogTitle>
              <DialogDescription>
                Modifier le statut du signalement et ajouter une note admin si nécessaire.
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <Label>Type de signalement</Label>
                  <div className="mt-1">
                    <Badge className={getTargetBadgeColor(selectedReport.cible)}>
                      {selectedReport.cible === 'UTILISATEUR' && '👤 Utilisateur'}
                      {selectedReport.cible === 'ANIMAL' && '🐾 Animal'}
                      {selectedReport.cible === 'MESSAGE' && '💬 Message'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Raison du signalement</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    {selectedReport.raison}
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1"
                  >
                    <option value="OUVERT">🔴 Ouvert</option>
                    <option value="EN_COURS">🟠 En cours</option>
                    <option value="RESOLU">🟢 Résolu</option>
                    <option value="REJETE">⚫ Rejeté</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="adminNote">Note admin (optionnel)</Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ajouter une note pour le suivi..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t">
                  {selectedReport.cible === 'UTILISATEUR' && selectedReport.status !== 'RESOLU' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBanDialogOpen(selectedReport)}
                    >
                      Bannir l'utilisateur
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelectedReport(null)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, newStatus as 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE', adminNote)
                    }
                    disabled={!newStatus}
                  >
                    Mettre à jour le statut
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bannir l'utilisateur</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. L'utilisateur ne pourra plus accéder à son compte.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="banReason">Raison du bannissement</Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Expliquer le motif du bannissement..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsBanDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => banUserFromReport(selectedReport.id)}
                disabled={!banReason.trim()}
              >
                Confirmer le bannissement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ReportsPage;