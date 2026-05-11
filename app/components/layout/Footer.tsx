"use client";
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-background-light dark:bg-background-dark py-6 transition-colors duration-300 mt-auto border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    © 2012 - 2025 Một sản phẩm của Zalo Group -
                    <a className="text-primary hover:underline ml-1" href="#">
                        Điều khoản sử dụng dịch vụ
                    </a>{" "}
                    -
                    <a className="text-primary hover:underline ml-1" href="#">
                        Thông báo xử lý dữ liệu
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;