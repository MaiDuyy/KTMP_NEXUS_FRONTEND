"use client";

import React from 'react';
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  Copy,
  BrainCircuit
} from 'lucide-react';

export const AIAssistantMessage: React.FC = () => {
  return (
    <div className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-100/50 mt-4 mb-2">
      <div className="bg-white rounded-[15px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Sparkles size={14} />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-auto px-1.5 py-0.5 rounded border border-slate-100">
            Enterprise
          </span>
        </div>
        
        <div className="space-y-3 text-[14px] leading-relaxed text-slate-700">
          <p>
            I've analyzed the technical requirements in the current thread. Based on your design sync, I recommend updating the <strong>Secondary Button</strong> component to use the new <code className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono">slate-200</code> stroke instead of the previous blue tint.
          </p>
          <p>
            This change would increase the contrast ratio for accessibility compliance (WCAG 2.1 AA) in the new light theme dashboard.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100">
              <BrainCircuit size={14} />
              Apply Pattern
           </button>
           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors border border-slate-200">
              <Copy size={14} />
              Copy Code
           </button>
           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors border border-slate-200">
              <RefreshCw size={14} />
              Regenerate
           </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
           <div className="text-[11px] font-medium italic">
             Was this recommendation helpful?
           </div>
           <div className="flex items-center gap-2">
              <button className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                <ThumbsUp size={14} />
              </button>
              <button className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-all">
                <ThumbsDown size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
