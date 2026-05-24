'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionDeniedProps {
  /** Custom title (default: "Truy cập bị từ chối") */
  title?: string;
  /** Custom message */
  message?: string;
  /** Show "Go Back" button */
  showBackButton?: boolean;
  /** Show "Contact Admin" link */
  showContactAdmin?: boolean;
}

/**
 * Permission denied state component (403 Forbidden)
 * Displays in-place keeping Layout (Header, Sidebar) intact.
 */
export function PermissionDenied({
  title = 'Không có quyền truy cập',
  message = 'Tài khoản của bạn chưa được cấp quyền hạn để xem phân hệ này. Vui lòng liên hệ quản trị viên hoặc chuyển hướng sang khu vực khác.',
  showBackButton = true,
  showContactAdmin = true,
}: PermissionDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-background text-foreground transition-colors duration-200">
      {/* 403 SVG Illustration */}
      <div className="relative w-64 h-64 mb-8 select-none">
        <svg className="w-full h-full text-muted-foreground/30 dark:text-muted-foreground/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pulsing radar lines */}
          <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" className="opacity-40 animate-[spin_120s_linear_infinite]" />
          <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-60 animate-[spin_60s_linear_infinite]" />
          
          {/* Main Shield Lock Body */}
          <g className="animate-[bounce_5s_ease-in-out_infinite]">
            {/* The outer shield border */}
            <path d="M100 45C115 45 135 50 145 60C145 100 130 135 100 155C70 135 55 100 55 60C65 50 85 45 100 45Z" 
              fill="currentColor" 
              className="text-muted/20 dark:text-muted/10" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
            />
            
            {/* Inner red warning zone */}
            <path d="M100 55C111 55 127 59 135 67C135 99 123 127 100 143C77 127 65 99 65 67C73 59 89 55 100 55Z" 
              fill="currentColor" 
              className="text-destructive/5 dark:text-destructive/10" 
            />
            
            {/* Keyhole details inside the shield */}
            <circle cx="100" cy="95" r="10" stroke="currentColor" strokeWidth="2.5" className="text-primary" />
            <path d="M96 103L93 122H107L104 103" fill="currentColor" className="text-primary" />
            
            {/* Decorative crosshairs / lock status ticks */}
            <line x1="100" y1="65" x2="100" y2="75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-destructive" />
            <circle cx="100" cy="65" r="1.5" fill="currentColor" className="text-destructive animate-pulse" />
          </g>
        </svg>

        {/* Floating badge */}
        <div className="absolute top-10 right-10 bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg border-2 border-background animate-[pulse_2s_infinite]">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      {/* Content details */}
      <div className="max-w-md space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full">
          Lỗi 403 · Access Forbidden
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full max-w-xs">
        {showBackButton && (
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full h-11 px-6 border-border text-foreground bg-background hover:bg-accent font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang trước
          </Button>
        )}

        {showContactAdmin && (
          <Button
            asChild
            className="w-full h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <a href="mailto:admin@ottchat.com" className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Liên hệ Admin
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
