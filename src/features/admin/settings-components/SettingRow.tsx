import React from 'react';
import { Label } from '@/components/ui/label';

interface SettingRowProps {
    icon?: any;
    label: string;
    description?: string;
    children: React.ReactNode;
}

export function SettingRow({ icon: Icon, label, description, children }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between py-2.5 group first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
            <div className="flex items-start gap-2.5">
                {Icon && (
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mt-0.5">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <div className="flex flex-col">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                        {label}
                    </Label>
                    {description && (
                        <p className="text-[11px] text-muted-foreground mt-1 leading-normal max-w-lg">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 ml-4">{children}</div>
        </div>
    );
}
