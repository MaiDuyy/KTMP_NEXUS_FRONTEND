"use client";

import React from 'react';
import { MessageSquare, Shield, Zap, Globe } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#111113] font-sans antialiased selection:bg-blue-500/10 selection:text-blue-600 transition-colors duration-250">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-[420px] bg-[#111113] border-r border-white/[0.04] relative overflow-hidden flex-col justify-between p-10 shrink-0 select-none">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-8 h-8 bg-blue-600 rounded-[2px] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-mono font-bold text-white tracking-widest uppercase">NEXUS</span>
          </div>

          <div className="space-y-8 text-left">
            <div>
              <h1 className="text-2xl font-bold text-white leading-[1.25] tracking-tight">
                Nền tảng giao tiếp<br />
                <span className="text-white/40">doanh nghiệp bảo mật</span>
              </h1>
            </div>

            <div className="space-y-5">
              <FeatureItem
                icon={<Shield className="w-4 h-4 text-blue-400" />}
                title="Bảo mật tuyệt đối"
                description="Mã hóa đầu cuối cho mọi cuộc hội thoại."
              />
              <FeatureItem
                icon={<Zap className="w-4 h-4 text-blue-400" />}
                title="Tốc độ vượt trội"
                description="Gửi tin nhắn và tệp lớn trong tức thì."
              />
              <FeatureItem
                icon={<Globe className="w-4 h-4 text-blue-400" />}
                title="Kết nối mọi nơi"
                description="Đa nền tảng, đồng bộ tức thì."
              />
            </div>
          </div>
        </div>

        {/* Bottom: Testimonial */}
        <div className="relative z-10 text-left">
          <div className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-[2px]">
            <p className="text-white/60 text-[11px] leading-relaxed mb-3 italic">
              "Hệ thống đã giúp đội ngũ tối ưu quy trình làm việc và kết nối phòng ban liền mạch hơn."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[2px] bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/50">CO</div>
              <div>
                <p className="text-white text-[11px] font-semibold">Nguyễn Văn A</p>
                <p className="text-white/40 text-[9px] font-mono uppercase tracking-wider">Giám đốc vận hành @ ABC Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 dark:bg-[#111113]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10 select-none">
            <div className="w-8 h-8 bg-blue-600 rounded-[2px] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-widest uppercase">NEXUS</span>
          </div>

          <div className="bg-white dark:bg-[#19191B] p-8 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-none">
            {children}
          </div>

          <footer className="mt-8 text-center text-[10px] text-slate-400 dark:text-zinc-600 font-mono tracking-wider">
            <p>&copy; {new Date().getFullYear()} NEXUS Platform. Secure & Encrypted.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-[2px] bg-white/[0.04] border border-white/[0.04] flex items-center justify-center text-white/70">
      {icon}
    </div>
    <div className="text-left">
      <h3 className="text-white text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-white/40 text-[11px] leading-relaxed">{description}</p>
    </div>
  </div>
);

