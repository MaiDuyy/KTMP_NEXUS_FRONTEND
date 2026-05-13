"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { MessageSquare, Shield, Zap, Globe } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-primary/10 selection:text-primary">
      {/* Cột Trái - Thương hiệu & Branding (Ẩn trên mobile) */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        {/* Họa tiết trang trí */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">NEXUS</span>
          </div>

          <div className="space-y-10">
            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-[-0.04em]">
              Nền tảng giao tiếp <br />
              <span className="text-white/70">Dành cho doanh nghiệp</span>
            </h1>

            <div className="space-y-6">
              <FeatureItem 
                icon={<Shield className="w-5 h-5" />} 
                title="Bảo mật tuyệt đối" 
                description="Mã hóa đầu cuối cho mọi cuộc hội thoại và dữ liệu."
              />
              <FeatureItem 
                icon={<Zap className="w-5 h-5" />} 
                title="Tốc độ vượt trội" 
                description="Gửi tin nhắn và tệp tin dung lượng lớn trong tích tắc."
              />
              <FeatureItem 
                icon={<Globe className="w-5 h-5" />} 
                title="Kết nối mọi nơi" 
                description="Hỗ trợ đa nền tảng, đồng bộ hóa tức thì."
              />
            </div>
          </div>
        </div>

        <div className="relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-white/90 italic text-sm leading-relaxed mb-4">
                    "Hệ thống đã giúp đội ngũ của chúng tôi tối ưu hóa quy trình làm việc và kết nối các phòng ban một cách liền mạch hơn bao giờ hết."
                </p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20"></div>
                    <div>
                        <p className="text-white text-xs font-bold uppercase tracking-wider">Nguyễn Văn A</p>
                        <p className="text-white/60 text-[10px]">Giám đốc vận hành @ Doanh nghiệp ABC</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Cột Phải - Form Login/Register */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-[#fcfcfc]">
        <div className="w-full max-w-[420px]">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">NEXUS</span>
          </div>

          <div className="bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl shadow-black/[0.03] lg:shadow-none border border-[#f0f0f0] lg:border-none">
            {children}
          </div>
          
          <footer className="mt-12 text-center text-[13px] text-[#94a3b8]">
            <p>&copy; {new Date().getFullYear()} NEXUS Platform. Bản quyền được bảo lưu.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);
