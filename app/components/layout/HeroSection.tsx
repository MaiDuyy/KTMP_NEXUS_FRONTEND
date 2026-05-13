"use client";

import React from 'react';
import { FeatureItem } from '../../types/types';
import Link from 'next/link';
import { CheckCircle2, Download, Globe, Monitor, Smartphone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES: FeatureItem[] = [
    { text: "Gửi file, ảnh, video cực nhanh lên đến 1GB" },
    { text: "Đồng bộ tin nhắn tức thì trên mọi thiết bị" },
    { text: "Bảo mật đầu cuối cho mọi cuộc trò chuyện" },
    { text: "Tối ưu cho chat nhóm và cộng tác doanh nghiệp" },
];

const HeroSection: React.FC = () => {
    return (
        <section className="relative w-full overflow-hidden bg-white dark:bg-[#111111] py-20 lg:py-32">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Left Content */}
                    <div className="flex-1 flex flex-col items-start text-left space-y-8 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Zap className="w-3.5 h-3.5 fill-primary" />
                            <span>Phiên bản mới 2.0 đã sẵn sàng</span>
                        </div>

                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                                Kết nối mọi người <br />
                                <span className="text-primary">An toàn & Nhanh chóng</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                                Trải nghiệm nhắn tin đa nền tảng với tốc độ vượt trội, bảo mật tối ưu và các tính năng hỗ trợ công việc chuyên nghiệp.
                            </p>
                        </div>

                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            {FEATURES.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {feature.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <Button className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground h-14 px-10 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex items-center gap-2 group">
                                <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                Tải NEXUS ngay
                            </Button>
                            <Link href="/register" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold text-base border-border hover:bg-accent flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Dùng trên web
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-6 pt-8 border-t border-border w-full animate-in fade-in duration-1000 delay-500">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-foreground">10M+</span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Người dùng</span>
                            </div>
                            <div className="w-px h-10 bg-border"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-foreground">99.9%</span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Thời gian hoạt động</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Image/Graphic */}
                    <div className="flex-1 relative w-full max-w-xl animate-in fade-in slide-in-from-right-8 duration-1000">
                        <div className="relative z-10 p-4 bg-white dark:bg-[#1c1c1c] rounded-[2rem] shadow-2xl border border-border overflow-hidden">
                            <img
                                alt="NEXUS Interface"
                                className="w-full rounded-2xl shadow-inner"
                                src="/assets/img_pc_zalo.png"
                            />
                            
                            {/* Floating device indicators */}
                            <div className="absolute top-1/4 -left-8 bg-white dark:bg-[#2a2a2a] p-4 rounded-2xl shadow-xl border border-border animate-bounce duration-[3000ms]">
                                <Monitor className="w-6 h-6 text-primary" />
                            </div>
                            <div className="absolute bottom-1/4 -right-8 bg-white dark:bg-[#2a2a2a] p-4 rounded-2xl shadow-xl border border-border animate-bounce duration-[2500ms] delay-500">
                                <Smartphone className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                        
                        {/* Shadow glow */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-primary/30 blur-3xl rounded-full opacity-50"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;