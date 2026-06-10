"use client";

import React from 'react';
import ModernSidebarRail from './modern-sidebar-rail';
import { ModernChannelSidebar } from './modern-channel-sidebar';
import { ModernChatArea } from './modern-chat-area';

export const ModernDashboard: React.FC = () => {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-white selection:bg-blue-100 selection:text-blue-900">


      {/* Middle Column: Sidebar */}
      <ModernChannelSidebar />

      {/* Main Right Area: Chat Interface */}
      <ModernChatArea />
    </div>
  );
};

export default ModernDashboard;
