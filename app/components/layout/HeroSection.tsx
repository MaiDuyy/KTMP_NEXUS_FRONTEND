"use client";
import React from 'react';
import { FeatureItem } from '../../types/types';
import Link from 'next/link';

const FEATURES: FeatureItem[] = [
    { text: "Gửi file, ảnh, video cực nhanh lên đến 1GB" },
    { text: "Đồng bộ tin nhắn với điện thoại" },
    { text: "Tối ưu cho chat nhóm và trao đổi công việc" },
];

const HeroSection: React.FC = () => {
    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg dark:shadow-slate-900/50 max-w-7xl w-full mx-auto overflow-hidden transition-colors duration-300">
            <div className="flex flex-col lg:flex-row items-center justify-between p-8 lg:p-16 xl:p-20 gap-12">
                {/* Left Content */}
                <div className="lg:w-1/2 space-y-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                            Tải OTT cho máy tính
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium">
                            Ứng dụng OTT đã có mặt trên Windows, Mac OS, Web
                        </p>
                    </div>

                    <ul className="space-y-4">
                        {FEATURES.map((feature, index) => (
                            <li key={index} className="flex items-start">
                                <span className="material-icons text-primary mr-3 text-xl">
                                    check
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 text-base md:text-lg">
                                    {feature.text}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button className="bg-primary hover:bg-primary-hover text-white font-medium rounded-md px-8 py-3 flex items-center justify-center transition shadow-md hover:shadow-lg">
                            Tải ngay
                        </button>
                        <Link href="/auth/sign-up" className="bg-transparent border border-primary dark:border-blue-400 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium rounded-md px-8 py-3 flex items-center justify-center transition">
                            Dùng trên web

                        </Link>
                    </div>
                </div>

                {/* Right Image */}
                <div className="lg:w-1/2 flex justify-center lg:justify-end relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full transform scale-75 dark:bg-blue-500/20 pointer-events-none"></div>
                    <img
                        alt="Devices showing Zalo application interface on laptop and mobile phone"
                        className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl rounded-lg"
                        src={"/assets/img_pc_zalo.png"}
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroSection;