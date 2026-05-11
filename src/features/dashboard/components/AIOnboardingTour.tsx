import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';

export const AIOnboardingTour: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate checking local storage
    const hasSeenTour = localStorage.getItem('hasSeenAiTour_v1');
    if (!hasSeenTour) {
      // Slight delay for dramatic entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenAiTour_v1', 'true');
  };

  const handleStartTour = () => {
    // In a real app, this would trigger a guided Joyride/Shepherd.js tour
    setIsVisible(false);
    localStorage.setItem('hasSeenAiTour_v1', 'true');
    console.log("Starting AI Tour...");
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-500"></div>
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md animate-in zoom-in-95 fade-in duration-500">
        <div className="bg-zinc-950 border border-[#ccff00]/50 shadow-[0_0_30px_#ccff0020] relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ccff00]/20 via-[#ccff00] to-[#ccff00]/20"></div>
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-[#ccff00]" />
            </div>
            
            <h2 className="text-xl font-medium text-white mb-3">
              Chào mừng đến với Command Center
            </h2>
            
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Bạn là nhân sự mới? Dashboard này đã được thiết kế lại. 
              Bạn có muốn AI hướng dẫn nhanh sơ đồ tổ chức văn hóa công ty và cách sử dụng bảng điều khiển này không?
            </p>

            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={handleStartTour}
                className="w-full bg-[#ccff00] text-black font-semibold uppercase tracking-wider py-3 flex items-center justify-center gap-2 hover:bg-[#b3e600] transition-colors"
              >
                Bắt đầu Tour <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDismiss}
                className="w-full bg-transparent text-zinc-500 font-medium hover:text-zinc-300 py-2 transition-colors uppercase tracking-wider text-sm"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
