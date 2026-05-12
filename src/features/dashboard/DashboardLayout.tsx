import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AICoreWidget } from './components/widgets/AICoreWidget';
import { TaskProgressWidget } from './components/widgets/TaskProgressWidget';
import { KnowledgeHubWidget } from './components/widgets/KnowledgeHubWidget';
import { InsightsWidget } from './components/widgets/InsightsWidget';
import { FocusModeToggle } from './components/FocusModeToggle';
import { AIOnboardingTour } from './components/AIOnboardingTour';

export const DashboardLayout: React.FC = () => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [hasEmergencyPing, setHasEmergencyPing] = useState(false);

  return (
    <div className={`h-full w-full bg-[#030303] text-zinc-200 transition-colors duration-500 overflow-y-auto custom-scrollbar relative font-sans ${isFocusMode ? 'bg-[#000000]' : ''}`}>
      <AIOnboardingTour />
      {/* Background Graphic elements */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-zinc-900/40 to-transparent pointer-events-none"></div>
      
      {/* Emergency Ping Banner (Bypass Focus Mode) */}
      {hasEmergencyPing && (
        <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between border-b border-orange-600 z-50 sticky top-0 shadow-[0_0_20px_#f9731650]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-100">
              Company Announcement
            </span>
            <span className="text-sm font-medium">
              Lịch nghỉ lễ 30/4 - 1/5 đã được cập nhật. Vui lòng kiểm tra email.
            </span>
          </div>
          <button 
            onClick={() => setHasEmergencyPing(false)}
            className="text-xs bg-orange-950/40 hover:bg-orange-900/60 px-3 py-1 font-mono uppercase border border-orange-400/30 transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 bg-[#ccff00] block mt-1"></span>
              COMMAND CENTER
            </h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 ml-5">
              Live Systems Active • {(new Date()).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <FocusModeToggle 
              isFocusMode={isFocusMode} 
              onToggle={() => setIsFocusMode(!isFocusMode)} 
            />
          </div>
        </div>

        {/* Main Grid Layout */}
        {/* Asymmetric layout: Main column wider than secondary */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-500 ${isFocusMode ? 'opacity-90' : 'opacity-100'}`}>
          
          {/* Left / Main Content Column (Takes 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* The Main AI Core Widget takes prominence */}
            <div className="min-h-[300px]">
              <AICoreWidget userName="Duy" />
            </div>

            {/* Knowledge Hub stays below AI Core */}
            {!isFocusMode && (
              <div className="min-h-[250px]">
                <KnowledgeHubWidget />
              </div>
            )}
          </div>

          {/* Right / Context Column (Takes 4 cols) */}
          {/* If focus mode is ON and this doesn't contain tasks, maybe hide it. But tasks are important for Focus, so we keep Tasks. We hide the Insights */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="min-h-[400px]">
              <TaskProgressWidget />
            </div>
            
            {!isFocusMode && (
              <div className="min-h-[200px]">
                <InsightsWidget />
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
