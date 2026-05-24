"use client";

import React from 'react';
import { MessageSquare, Shield, Zap, Globe } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-white font-sans antialiased selection:bg-primary/10 selection:text-primary">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-[420px] bg-[#1A1D21] relative overflow-hidden flex-col justify-between p-10 shrink-0">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-8 h-8 bg-blue-600 rounded-[4px] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">NEXUS</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white leading-[1.2] tracking-tight">
                Nền tảng giao tiếp<br />
                <span className="text-white/50">dành cho doanh nghiệp</span>
              </h1>
            </div>

            <div className="space-y-5">
              <FeatureItem
                icon={<Shield className="w-4 h-4" />}
                title="Bảo mật tuyệt đối"
                description="Mã hóa đầu cuối cho mọi cuộc hội thoại."
              />
              <FeatureItem
                icon={<Zap className="w-4 h-4" />}
                title="Tốc độ vượt trội"
                description="Gửi tin nhắn và tệp lớn trong tức thì."
              />
              <FeatureItem
                icon={<Globe className="w-4 h-4" />}
                title="Kết nối mọi nơi"
                description="Đa nền tảng, đồng bộ tức thì."
              />
            </div>
          </div>
        </div>

        {/* Bottom: Testimonial */}
        <div className="relative z-10">
          <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-[4px]">
            <p className="text-white/70 text-xs leading-relaxed mb-3 italic">
              "Hệ thống đã giúp đội ngũ tối ưu quy trình làm việc và kết nối phòng ban liền mạch hơn."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[4px] bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">NA</div>
              <div>
                <p className="text-white text-[11px] font-semibold">Nguyễn Văn A</p>
                <p className="text-white/40 text-[10px]">Giám đốc vận hành @ ABC Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-[#F8F8F8]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-[4px] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">NEXUS</span>
          </div>

          <div className="bg-white p-8 rounded-[4px] shadow-sm border border-slate-200/80">
            {children}
          </div>

          <footer className="mt-8 text-center text-[11px] text-slate-400">
            <p>&copy; {new Date().getFullYear()} NEXUS Platform. Bản quyền được bảo lưu.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-[4px] bg-white/10 flex items-center justify-center text-white/70">
      {icon}
    </div>
    <div>
      <h3 className="text-white text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-white/50 text-[11px] leading-relaxed">{description}</p>
    </div>
  </div>
);
