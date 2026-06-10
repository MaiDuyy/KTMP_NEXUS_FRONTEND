'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/src/redux/hooks';

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Dynamic redirect based on auth status
  const homePath = isAuthenticated ? '/chat' : '/';

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground transition-colors duration-200">
      {/* 404 SVG Illustration */}
      <div className="relative w-64 h-64 mb-8 select-none">
        <svg className="w-full h-full text-muted-foreground/30 dark:text-muted-foreground/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pulsing grid coordinates */}
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-50" />
          <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-50" />
          
          {/* Rotating dashed navigation ring */}
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className="animate-[spin_90s_linear_infinite]" />
          <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="animate-[spin_40s_linear_infinite] opacity-60" />
          
          {/* Lost paper airplane floating */}
          <g className="animate-[bounce_4s_ease-in-out_infinite]">
            <path d="M120 70L75 90L90 100L120 70Z" fill="currentColor" className="text-primary/10 dark:text-primary/20" />
            <path d="M120 70L90 100L100 120L120 70Z" fill="currentColor" className="text-primary/25 dark:text-primary/45" />
            <path d="M120 70L75 90L90 100L100 120L120 70Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
            
            {/* Wind trails */}
            <path d="M60 115C50 115 45 110 40 110" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-40 animate-[pulse_2s_infinite]" />
            <path d="M55 125C48 125 43 122 38 122" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-35 animate-[pulse_2s_infinite_0.5s]" />
          </g>

          {/* Core Compass Point */}
          <circle cx="100" cy="100" r="5" fill="currentColor" className="text-primary animate-ping" />
          <circle cx="100" cy="100" r="4" fill="currentColor" className="text-primary" />
        </svg>

        {/* Overlay Badge */}
        <div className="absolute top-8 left-12 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background animate-[bounce_3s_ease-in-out_infinite_1.5s]">
          <Compass className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
        </div>
      </div>

      {/* Title & Info */}
      <div className="max-w-md text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          Lỗi 404 · Page Not Found
        </span>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Đường dẫn không tồn tại
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại, đã bị gỡ bỏ, thay đổi địa chỉ hoặc bạn không gõ đúng đường dẫn URL.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full max-w-sm">
        <Button 
          onClick={() => router.back()}
          variant="outline"
          className="w-full sm:w-auto h-11 px-6 border-border text-foreground bg-background hover:bg-accent font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang trước
        </Button>

        <Button 
          asChild
          className="w-full sm:w-auto h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Link href={homePath}>
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
