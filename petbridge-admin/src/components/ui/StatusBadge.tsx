type Status =
  | 'DISPONIBLE'
  | 'ATTENTE_VALIDATION'
  | 'ADOPTE'
  | 'REJETE'
  | 'REJETEE'
  | 'EN_ATTENTE'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'ANNULEE'
  | 'COMPLETEE'
  | 'OUVERT'
  | 'EN_COURS'
  | 'RESOLU'
  | 'BANNI';

type StatusType = 'animal' | 'adoption' | 'report' | 'user';

interface StatusBadgeProps {
  status: Status;
  type: StatusType;
}

const getStatusStyles = (status: Status, type: StatusType) => {
  // Animal statuses
  if (type === 'animal') {
    switch (status) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ATTENTE_VALIDATION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ADOPTE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  // Adoption statuses
  if (type === 'adoption') {
    switch (status) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTEE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REFUSEE':
      case 'REJETEE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ANNULEE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'COMPLETEE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  // Report statuses
  if (type === 'report') {
    switch (status) {
      case 'OUVERT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EN_COURS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLU':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  // User statuses
  if (type === 'user') {
    switch (status) {
      case 'BANNI':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  // Default style
  return 'bg-slate-100 text-slate-800 border-slate-200';
};

const getStatusLabel = (status: Status) => {
  const labels: Record<Status, string> = {
    DISPONIBLE: 'Disponible',
    ATTENTE_VALIDATION: 'En attente de validation',
    ADOPTE: 'Adopté',
    REJETE: 'Rejeté',
    REJETEE: 'Rejetée',
    EN_ATTENTE: 'En attente',
    ACCEPTEE: 'Acceptée',
    REFUSEE: 'Refusée',
    ANNULEE: 'Annulée',
    COMPLETEE: 'Complétée',
    OUVERT: 'Ouvert',
    EN_COURS: 'En cours',
    RESOLU: 'Résolu',
    BANNI: 'Banni',
  };
  return labels[status] || status;
};

export const StatusBadge = ({ status, type }: StatusBadgeProps) => {
  const styles = getStatusStyles(status, type);
  const label = getStatusLabel(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {label}
    </span>
  );
};