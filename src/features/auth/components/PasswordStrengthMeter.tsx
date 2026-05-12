import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  
  const labels = ['None', 'Weak', 'Good', 'Strong'];
  const colors = [
    'bg-slate-200',
    'bg-red-500',
    'bg-amber-500',
    'bg-emerald-500'
  ];

  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex-1 transition-all duration-300 ${
              step <= strength ? colors[strength] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider text-slate-500">
        <span>Password Strength</span>
        <span className={strength > 0 ? `text-${colors[strength].replace('bg-', '')}` : ''}>
          {labels[strength]}
        </span>
      </div>
      
      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-emerald-600' : ''}`}>
          <div className={`h-1 w-1 rounded-full ${password.length >= 8 ? 'bg-emerald-600' : 'bg-slate-300'}`} />
          At least 8 characters
        </li>
        <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-emerald-600' : ''}`}>
          <div className={`h-1 w-1 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-600' : 'bg-slate-300'}`} />
          At least 1 number
        </li>
        <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-600' : ''}`}>
           <div className={`h-1 w-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-emerald-600' : 'bg-slate-300'}`} />
          At least 1 symbol
        </li>
      </ul>
    </div>
  );
};
