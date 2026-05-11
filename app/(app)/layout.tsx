import ModernSidebarRail from '@/src/features/chat/modern-sidebar-rail';
import React from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-950">
      <ModernSidebarRail />
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
