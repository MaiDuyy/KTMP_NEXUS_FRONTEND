import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { Observer } from '../../redux/feature/observerSlice';

interface ObserverIndicatorProps {
  observers: Observer[];
}

export const ObserverIndicator: React.FC<ObserverIndicatorProps> = ({ observers }) => {
  if (observers.length === 0) return null;

  // Format observing admins names
  const observerNames = observers.map(obs => obs.name).join(', ');
  const isMultiple = observers.length > 1;

  return (
    <div className="w-full bg-amber-500/5 dark:bg-amber-500/[0.02] border-t border-b border-amber-500/10 dark:border-amber-500/[0.06] px-4 py-2 font-mono flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-5 w-5 rounded-[2px] bg-amber-500/10 flex items-center justify-center shrink-0">
        <Eye size={12} className="text-amber-600 dark:text-amber-500 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
        <p className="text-[9px] font-bold text-amber-700 dark:text-amber-500 truncate uppercase tracking-wider">
          {isMultiple ? (
            <span>Các Admin [ {observerNames} ] đang giám sát kênh này</span>
          ) : (
            <span>Admin [ {observerNames} ] đang giám sát kênh này</span>
          )}
        </p>
        
        <div className="hidden sm:flex items-center gap-1 shrink-0 text-[8px] font-bold uppercase tracking-widest text-amber-500/60 dark:text-amber-500/40">
          <ShieldAlert size={10} />
          <span>Real-time presence</span>
        </div>
      </div>
    </div>
  );
};
