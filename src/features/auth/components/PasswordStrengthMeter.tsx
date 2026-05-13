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
    'bg-[#e5e7eb]',
    'bg-[#ef4444]',
    'bg-[#f59e0b]',
    'bg-primary'
  ];

  const textColors = [
    'text-[#94a3b8]',
    'text-[#ef4444]',
    'text-[#f59e0b]',
    'text-primary'
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex h-1.5 w-full gap-1.5">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
                "flex-1 rounded-full transition-all duration-300",
                step <= strength ? colors[strength] : "bg-[#f1f5f9]"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
        <span className="text-[#94a3b8]">Độ mạnh mật khẩu</span>
        <span className={cn("transition-colors", textColors[strength])}>
          {labels[strength]}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 pt-1">
        <PasswordRequirement 
            met={password.length >= 6} 
            label="Tối thiểu 6 ký tự" 
        />
        {/* <PasswordRequirement 
            met={/[0-9]/.test(password)} 
            label="Bao gồm ít nhất 1 chữ số" 
        />
        <PasswordRequirement 
            met={/[^A-Za-z0-9]/.test(password)} 
            label="Bao gồm ít nhất 1 ký tự đặc biệt" 
        /> */}
      </div>
    </div>
  );
};

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
    <div className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        met ? "text-primary font-medium" : "text-[#94a3b8]"
    )}>
        <div className={cn(
            "h-1 w-1 rounded-full",
            met ? "bg-primary" : "bg-[#e5e7eb]"
        )} />
        {label}
    </div>
);
