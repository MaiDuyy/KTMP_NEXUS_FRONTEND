"use client";

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-[#111111] border-t border-border py-12 transition-colors duration-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="text-xl font-bold text-foreground">NEXUS</span>
                        <p className="text-sm text-muted-foreground font-medium">
                            Giải pháp kết nối an toàn cho cá nhân và doanh nghiệp.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Về chúng tôi</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Điều khoản</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Bảo mật</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Hỗ trợ</Link>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-muted-foreground font-medium">
                        © {new Date().getFullYear()} NEXUS. Tất cả quyền được bảo lưu.
                    </p>
                    <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                        <span>Made with ❤️ for the world</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;