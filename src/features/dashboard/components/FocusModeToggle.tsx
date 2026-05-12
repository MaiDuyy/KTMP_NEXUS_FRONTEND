import React, { useState } from 'react';
import { Focus, EyeOff } from 'lucide-react';

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({ isFocusMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        relative group flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300
        border overflow-hidden rounded-sm
        ${isFocusMode 
          ? 'border-[#ccff00] bg-[#ccff00]/10 text-[#ccff00] shadow-[0_0_15px_#ccff0020]' 
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
        }
      `}
    >
      {/* Glitch hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ccff00]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
      
      {isFocusMode ? (
        <EyeOff className="w-4 h-4 animate-pulse" />
      ) : (
        <Focus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
      )}
      
      <span className="uppercase tracking-wider text-xs relative z-10">
        {isFocusMode ? 'Focus: Active' : 'Enter Focus'}
      </span>
      
      {isFocusMode && (
        <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#ccff00] animate-ping"></span>
      )}
    </button>
  );
};
