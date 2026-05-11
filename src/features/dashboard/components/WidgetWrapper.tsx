import React, { useState } from 'react';
import { Power, RotateCcw, Activity } from 'lucide-react';

interface WidgetWrapperProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  statusBadge?: 'online' | 'offline' | 'degraded';
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  title,
  icon,
  children,
  className = '',
  loading = false,
  error = false,
  onRetry,
  statusBadge
}) => {
  return (
    <div className={`relative border border-zinc-800 bg-zinc-950/50 backdrop-blur-md rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:border-zinc-700 group ${className}`}>
      {/* Tech-inspired decorative corner */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#ccff00] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <h3 className="font-medium text-sm tracking-wide text-zinc-100 uppercase translate-y-[1px]">{title}</h3>
        </div>
        
        {statusBadge && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-none ${
              statusBadge === 'online' ? 'bg-[#ccff00] shadow-[0_0_8px_#ccff0080]' : 
              statusBadge === 'degraded' ? 'bg-orange-500 shadow-[0_0_8px_#f9731680]' : 
              'bg-red-500 shadow-[0_0_8px_#ef444480]'
            }`}></span>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
              {statusBadge}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col relative h-full">
        {error ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-sm bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Power className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Connection Failed</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Microservice unresponsive. Please check network logs.</p>
            </div>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-[#ccff00] bg-[#ccff00]/10 hover:bg-[#ccff00]/20 border border-[#ccff00]/30 transition-colors uppercase"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col flex-1 gap-3 animate-pulse">
            <div className="h-4 bg-zinc-800/50 rounded-sm w-3/4"></div>
            <div className="h-4 bg-zinc-800/50 rounded-sm w-1/2"></div>
            <div className="h-20 bg-zinc-800/30 rounded-sm w-full mt-2"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
