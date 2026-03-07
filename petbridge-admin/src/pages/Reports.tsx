import { useState, useCallback } from 'react';
import { FileText, AlertCircle, CheckCircle, XCircle, Clock, ShieldAlert, Ban } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useAdminReports, type Report } from '../hooks/useAdminReports';

export default function Reports() {
  const {
    reports,
    loading,
    currentPage,
    totalPages,
    filters,
    updateReportStatus,
    banUserFromReport,
    handleStatusChange,
    handleCibleChange,
    handlePageChange,
  } = useAdminReports();

  const [treatDialogOpen, setTreatDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE'>('OUVERT');
  const [adminNote, setAdminNote] = useState('');
  const [banUser, setBanUser] = useState(false);

  const handleTreatClick = useCallback((report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNote('');
    setBanUser(false);
    setTreatDialogOpen(true);
  }, []);

  const handleTreatConfirm = useCallback(async () => {
    if (!selectedReport) return;
    
    await updateReportStatus(selectedReport.id, newStatus, adminNote);
    
    if (banUser && selectedReport.reportedUserId) {
      await banUserFromReport(selectedReport.id);
    }
    
    setTreatDialogOpen(false);
    setSelectedReport(null);
  }, [selectedReport, newStatus, adminNote, banUser, updateReportStatus, banUserFromReport]);

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OUVERT':
        return <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-200 bg-blue-50">
          <AlertCircle className="h-3 w-3" />
          Ouvert
        </Badge>;
      case 'EN_COURS':
        return <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-200 bg-yellow-50">
          <Clock className="h-3 w-3" />
          En cours
        </Badge>;
      case 'RESOLU':
        return <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200 bg-green-50">
          <CheckCircle className="h-3 w-3" />
          Résolu
        </Badge>;
      case 'REJETE':
        return <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-200 bg-red-50">
          <XCircle className="h-3 w-3" />
          Rejeté
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCibleLabel = (cible: string) => {
    switch (cible) {
      case 'UTILISATEUR':
        return 'Utilisateur';
      case 'ANIMAL':
        return 'Animal';
      case 'MESSAGE':
        return 'Message';
      default:
        return cible;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Signalements</h1>
          <p className="text-slate-500 mt-1">
            Traitez les signalements d'utilisateurs, mettez à jour les statuts et bannissez les utilisateurs si nécessaire
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row">
          <Select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as 'all' | 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE')}
            className="w-full lg:w-40"
          >
            <option value="all">Tous les statuts</option>
            <option value="OUVERT">Ouvert</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolu</option>
            <option value="REJETE">Rejeté</option>
          </Select>

          <Select
            value={filters.cible}
            onChange={(e) => handleCibleChange(e.target.value as 'all' | 'UTILISATEUR' | 'ANIMAL' | 'MESSAGE')}
            className="w-full lg:w-40"
          >
            <option value="all">Tous les types</option>
            <option value="UTILISATEUR">Utilisateur</option>
            <option value="ANIMAL">Animal</option>
            <option value="MESSAGE">Message</option>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Signalé par</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
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
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium">Aucun signalement trouvé</p>
                    <p className="text-sm">Essayez de modifier vos filtres</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {getCibleLabel(report.cible)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{report.raison}</div>
                    {report.description && (
                      <div className="text-slate-500 text-sm mt-1">{report.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-500">{report.reporterId}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(report.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-500">{formatDate(report.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTreatClick(report)}
                    >
                      Traiter
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && reports.length > 0 && (
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

      <Dialog open={treatDialogOpen} onOpenChange={setTreatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-500" />
              Traiter le signalement
            </DialogTitle>
            <DialogDescription>
              Mettez à jour le statut du signalement et ajoutez une note administrateur si nécessaire.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'REJETE')}
                className="w-full"
              >
                <option value="OUVERT">Ouvert</option>
                <option value="EN_COURS">En cours</option>
                <option value="RESOLU">Résolu</option>
                <option value="REJETE">Rejeté</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note administrateur</Label>
              <Textarea
                id="note"
                placeholder="Ajoutez une note pour expliquer le traitement..."
                className="min-h-[100px]"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            {selectedReport?.cible === 'UTILISATEUR' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="banUser"
                  checked={banUser}
                  onChange={(e) => setBanUser(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <Label htmlFor="banUser" className="flex items-center gap-1 cursor-pointer">
                  <Ban className="h-4 w-4 text-red-500" />
                  Bannir l'utilisateur signalé
                </Label>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setTreatDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="default" onClick={handleTreatConfirm}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}