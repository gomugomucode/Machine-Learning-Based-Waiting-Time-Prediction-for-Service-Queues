import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'blue' | 'amber' | 'red' | 'gray';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'blue', children }) => {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    gray: 'bg-slate-100 text-slate-700 ring-slate-500/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${variant === 'green' ? 'bg-emerald-500' : variant === 'red' ? 'bg-rose-500' : variant === 'amber' ? 'bg-amber-500' : variant === 'blue' ? 'bg-blue-500' : 'bg-slate-400'}`} />
      {children}
    </span>
  );
};
