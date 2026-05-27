"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/src/features/chat/modern-sidebar-rail';
import { AuthGuard } from '@/src/components/guards/AuthGuard';

const noSidebarRoutes = ['/', '/login', '/register', '/auth', '/join', '/invite' , '/setup-password'];

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <AuthGuard>
      {(() => {
        // Check if current route is in the exclusion list
        const hideSidebar = noSidebarRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

        if (hideSidebar) {
          return <>{children}</>;
        }

        // Dashboard / App UI with Sidebar
        return (
          <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-hidden relative flex flex-col">
              {children}
            </main>
          </div>
        );
      })()}
    </AuthGuard>
  );
}
