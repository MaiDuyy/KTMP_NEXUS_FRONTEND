"use client"

import { NavItem } from '@/app/types/types';
import { logOut } from '@/src/redux/feature/authSlice';
import { useAppSelector } from '@/src/redux/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

interface HeaderProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const NAV_ITEMS: NavItem[] = [
    { label: "OTT", href: "#" },
    { label: "Official Account", href: "#" },
    { label: "Nhà phát triển", href: "#" },
    { label: "Bảo mật", href: "#" },
    { label: "Trợ giúp", href: "#" },
    { label: "Liên hệ", href: "#" },
    { label: "Báo cáo vi phạm", href: "#" },
];

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, isAuthenticated } = useAppSelector((state: any) => state.auth);


    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState(false);

    const handleLogout = async () => {
        // Dispatch action logOut lên Redux store
        dispatch(logOut());
        router.push('/');
        setIsProfileMenuOpen(false);
        // Nếu SignOutDialog gọi hàm này, nó sẽ thực thi đúng logic
    };
    return (
        <header className="bg-surface-light dark:bg-surface-dark shadow-sm sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                    <a className="text-3xl font-bold text-primary tracking-tight" href="#">
                        OTT-Chat
                    </a>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex space-x-6 xl:space-x-8">
                    {NAV_ITEMS.map((item, index) => (
                        <a
                            key={index}
                            href={item.href}
                            className={`text-sm font-bold uppercase transition ${index === 0
                                ? "text-primary hover:opacity-80"
                                : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                                }`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center space-x-4">
                    <button className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary p-1 rounded-full border border-slate-200 dark:border-slate-600">
                        <img
                            alt="User Avatar"
                            className="h-8 w-8 rounded-full"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDZQrA-QCztcaRpY58JFK8onC27szpbDCaD7qS-HrLBze5nEb6A5u4KwJOBK0sngoMYaXNZlIWdvVV2C_MzgEY_QXNKeEnwZZ3a5ECSse5JeV7zaQSQmGTJrnqS1x6hRdaeHaBsZ1k1qaKUM9c_DOg6N6Xvfs3XOKGdlZo8fZF0GsJIM3gRdTAaRZOHcSxi0GKSV_2PLwGifeM9h_DvSQE6pYHJ6qntPYceif1kx-50Q0L4xw2MLRQG9M8ihmf3KzLdRWON9qg2lM"
                        />
                    </button>


                    {isAuthenticated ? (
                        <button
                            className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition"
                            onClick={handleLogout}
                            aria-label="Logout"
                        >
                            <span className="material-icons text-xl">logout : {user?.name}</span>
                        </button>
                    ) : (
                        <Link href="/login">
                            <button
                                className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition"
                                aria-label="Login"
                            >
                                <span className="material-icons text-xl">login</span>
                            </button>
                        </Link>
                    )}

                    <button
                        className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition"
                        onClick={toggleDarkMode}
                        aria-label="Toggle Dark Mode"
                    >
                        <span className="material-icons text-xl">
                            {darkMode ? 'brightness_7' : 'brightness_4'}
                        </span>
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-slate-500"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="material-icons">menu</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700">
                    <nav className="flex flex-col px-4 py-2 space-y-2">
                        {NAV_ITEMS.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                className={`block py-2 text-sm font-bold uppercase ${index === 0
                                    ? "text-primary"
                                    : "text-slate-700 dark:text-slate-300"
                                    }`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;