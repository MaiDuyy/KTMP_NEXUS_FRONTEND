import React from 'react';
import { ModernChannelSidebar } from '@/src/features/chat/modern-channel-sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <ModernChannelSidebar />

      {/* Main Right Area: Content (handled by page or [id]/page) */}
      {children}
    </div>
  );
}
