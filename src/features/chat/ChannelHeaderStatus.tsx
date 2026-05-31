import React from 'react';
import { Eye, Shield, Lock } from 'lucide-react';

interface ChannelHeaderStatusProps {
  type?: 'PUBLIC' | 'PRIVATE' | 'GUEST' | 'ANNOUNCEMENT' | string;
}

export const ChannelHeaderStatus: React.FC<ChannelHeaderStatusProps> = ({ type }) => {
  if (!type) return null;

  const isPublic = type === 'PUBLIC' || type === 'ANNOUNCEMENT';

  return (
    <div className="relative flex items-center justify-center font-mono">
      {isPublic ? (
        <div className="group relative cursor-pointer">
          {/* Active status indicator icon */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 transition-all duration-200">
            <Shield size={12} className="animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Public</span>
          </div>

          {/* Premium Custom Tooltip */}
          <div className="pointer-events-none absolute left-1/2 top-full z-55 mt-2 w-56 -translate-x-1/2 rounded-[2px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-2.5 shadow-xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 ease-out">
            <div className="relative">
              {/* Arrow */}
              <div className="absolute -top-3.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]" />
              
              <div className="flex gap-2">
                <Eye size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-left font-mono">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">Quyền giám sát kênh</p>
                  <p className="text-[9px] text-slate-500 dark:text-zinc-450 mt-1 leading-normal">
                    Đây là kênh công khai. Quản trị viên hệ thống có quyền quan sát và đọc tin nhắn mà không cần trực tiếp tham gia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="group relative cursor-pointer">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 transition-all duration-200">
            <Lock size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Private</span>
          </div>

          {/* Premium Custom Tooltip */}
          <div className="pointer-events-none absolute left-1/2 top-full z-55 mt-2 w-56 -translate-x-1/2 rounded-[2px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-2.5 shadow-xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 ease-out">
            <div className="relative">
              {/* Arrow */}
              <div className="absolute -top-3.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]" />
              
              <div className="flex gap-2">
                <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-left font-mono">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">Quyền riêng tư nghiêm ngặt</p>
                  <p className="text-[9px] text-slate-500 dark:text-zinc-450 mt-1 leading-normal">
                    Kênh riêng tư hoàn toàn bảo mật. Không ai có thể đọc tin nhắn ngoại trừ những thành viên được mời trực tiếp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
