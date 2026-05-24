'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/src/redux/hooks';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Captured application error:', error);
  }, [error]);

  const homePath = isAuthenticated ? '/chat' : '/';

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground transition-colors duration-200">
      {/* 500 SVG Illustration */}
      <div className="relative w-64 h-64 mb-8 select-none">
        <svg className="w-full h-full text-muted-foreground/30 dark:text-muted-foreground/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rotating decorative target coordinates */}
          <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="opacity-30 animate-[spin_100s_linear_infinite]" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-45 animate-[spin_50s_linear_infinite]" />
          
          {/* Server rack / database shape with error indicators */}
          <g className="animate-[pulse_4s_ease-in-out_infinite]">
            {/* Base Server Block */}
            <rect x="65" y="70" width="70" height="60" rx="6" stroke="currentColor" strokeWidth="2.5" fill="currentColor" className="text-card fill-card dark:text-border" />
            
            {/* Slots / Drawers */}
            <line x1="75" y1="85" x2="125" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/45" />
            <line x1="75" y1="100" x2="125" y2="100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/45" />
            
            {/* Pulsing error light indicator */}
            <circle cx="120" cy="115" r="3" fill="currentColor" className="text-destructive animate-ping" />
            <circle cx="120" cy="115" r="3.5" fill="currentColor" className="text-destructive" />
            
            {/* Warning indicator light */}
            <circle cx="110" cy="115" r="2.5" fill="currentColor" className="text-yellow-500" />
            
            {/* Running activity light */}
            <circle cx="100" cy="115" r="2.5" fill="currentColor" className="text-green-500 opacity-40" />

            {/* Exploding / Spark graphics */}
            <path d="M50 80L40 75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-destructive animate-pulse" />
            <path d="M150 90L160 95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-destructive animate-pulse [animation-delay:0.5s]" />
            <path d="M140 60L148 50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-destructive animate-pulse [animation-delay:1s]" />
          </g>
          
          {/* Wire disconnect metaphor */}
          <path d="M100 130V155" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-destructive" />
          <path d="M95 155H105" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-destructive" />
        </svg>

        {/* Overlay Badge */}
        <div className="absolute top-8 right-12 bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg border-2 border-background animate-bounce">
          <ServerCrash className="w-6 h-6" />
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-md text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full">
          Lỗi 500 · Server Error
        </span>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Đã xảy ra sự cố hệ thống
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Ứng dụng gặp sự cố không mong muốn. Phía chúng tôi đang nỗ lực khắc phục tình trạng này. Vui lòng tải lại trang hoặc thử lại sau.
        </p>
        
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/60 mt-2 bg-muted/40 px-3 py-1.5 rounded border border-border/50 max-w-xs mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
            Mã lỗi: {error.digest}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full max-w-sm">
        <Button 
          onClick={() => reset()}
          className="w-full sm:w-auto h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Thử tải lại trang
        </Button>

        <Button 
          asChild
          variant="outline"
          className="w-full sm:w-auto h-11 px-6 border-border text-foreground bg-background hover:bg-accent font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
