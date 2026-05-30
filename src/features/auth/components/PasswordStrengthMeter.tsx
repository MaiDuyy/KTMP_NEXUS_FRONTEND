import React from 'react';
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  
  const labels = ['Không có', 'Yếu', 'Trung bình', 'Mạnh'];
  const colors = [
    'bg-slate-200 dark:bg-zinc-800',
    'bg-red-500 dark:bg-red-600',
    'bg-amber-500 dark:bg-amber-600',
    'bg-blue-600 dark:bg-blue-700'
  ];

  const textColors = [
    'text-slate-400 dark:text-zinc-600',
    'text-red-500 dark:text-red-400',
    'text-amber-500 dark:text-amber-400',
    'text-blue-600 dark:text-blue-450'
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex h-1.5 w-full gap-1.5">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
                "flex-1 rounded-[1px] transition-all duration-350",
                step <= strength ? colors[strength] : "bg-slate-100 dark:bg-zinc-850"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider font-mono">
        <span className="text-slate-400 dark:text-zinc-500">Độ mạnh mật khẩu</span>
        <span className={cn("transition-colors", textColors[strength])}>
          {labels[strength]}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 pt-1">
        <PasswordRequirement 
            met={password.length >= 6} 
            label="Tối thiểu 6 ký tự" 
        />
      </div>
    </div>
  );
};

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
    <div className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        met ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400 dark:text-zinc-500"
    )}>
        <div className={cn(
            "h-1.5 w-1.5 rounded-[1px] transition-colors",
            met ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-200 dark:bg-zinc-800"
        )} />
        <span className="font-mono text-[11px]">{label}</span>
    </div>
);
