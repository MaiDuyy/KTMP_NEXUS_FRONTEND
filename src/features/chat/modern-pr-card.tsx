"use client";

import React from 'react';
import { 
  GitPullRequest, 
  CheckCircle2, 
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const PullRequestCard: React.FC = () => {
  return (
    <div className="max-w-[480px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer mt-2">
      <div className="p-4 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <GitPullRequest size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 truncate text-sm">
              feat: implementation of design system tokens
            </h4>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
              Open
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <User size={12} /> <span className="font-medium text-slate-700 underline decoration-slate-200">m.vogt</span> pushed 6 commits to <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">main</code>
          </p>
          
          <div className="flex items-center gap-3 py-2 border-y border-slate-50">
             <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 size={12} />
                <span>3/3 Checks passed</span>
             </div>
             <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <MessageSquare size={12} />
                <span>12 Comments</span>
             </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>Updated 2 hours ago</span>
        </div>
        <button className="text-blue-600 font-semibold hover:underline">
          View Details
        </button>
      </div>
    </div>
  );
};
