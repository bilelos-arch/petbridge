import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';
  alert?: boolean;
}

const colorStyles: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
};

export const StatCard = ({ title, value, icon, color, alert }: StatCardProps) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorStyles[color]} bg-opacity-10`}>
          {icon}
        </div>
        {alert && (
          <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded animate-pulse">
            Attention
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};