import React from 'react';
import { ModernChannelSidebar } from '@/src/features/chat/modern-channel-sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-white dark:bg-[#111113] selection:bg-blue-100 dark:selection:bg-blue-900/30 selection:text-blue-900 dark:selection:text-blue-200">
      {/* Sidebar Navigation */}
      <ModernChannelSidebar />

      {/* Main Right Area: Content (handled by page or [id]/page) */}
      {children}
    </div>
  );
}
