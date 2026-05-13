"use client"

import { NavItem } from '@/app/types/types';
import { logOut } from '@/src/redux/feature/authSlice';
import { useAppSelector } from '@/src/redux/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
    MessageSquare, 
    Menu, 
    X, 
    LogOut, 
    LogIn, 
    Moon, 
    Sun, 
    User,
    ChevronDown,
    Settings,
    HelpCircle,
    FileText
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';

interface HeaderProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Trang chủ", href: "/" },
    { label: "Doanh nghiệp", href: "#" },
    { label: "Nhà phát triển", href: "#" },
    { label: "Bảo mật", href: "#" },
    { label: "Trợ giúp", href: "#" },
];

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, isAuthenticated } = useAppSelector((state: any) => state.auth);

    const handleLogout = () => {
        dispatch(logOut());
        router.push('/');
        setIsProfileOpen(false);
    };

    return (
        <header className="bg-white dark:bg-[#111111] border-b border-border sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-foreground tracking-tight">NEXUS</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-1">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "px-4 py-2 text-[13px] font-semibold rounded-md transition-all duration-200",
                                index === 0 
                                    ? "text-primary bg-primary/5" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                        aria-label="Toggle theme"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {isAuthenticated ? (
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1 pl-1 pr-3 hover:bg-accent rounded-full border border-border transition-colors"
                            >
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-foreground max-w-[100px] truncate">
                                    {user?.name || "Người dùng"}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isProfileOpen && "rotate-180")} />
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-border p-1.5 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-3 py-2.5 mb-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tài khoản</p>
                                            <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
                                        </div>
                                        <div className="h-px bg-border my-1 mx-1.5" />
                                        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors">
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            Cài đặt
                                        </button>
                                        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors">
                                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                            Trợ giúp
                                        </button>
                                        <div className="h-px bg-border my-1 mx-1.5" />
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="hidden sm:flex text-sm font-bold text-foreground">
                                    Đăng nhập
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-primary hover:opacity-90 text-primary-foreground text-sm font-bold px-5">
                                    Bắt đầu ngay
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-border bg-white dark:bg-[#111111] animate-in slide-in-from-top-4 duration-300">
                    <nav className="flex flex-col p-4 space-y-1">
                        {NAV_ITEMS.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "px-4 py-3 text-sm font-bold rounded-xl transition-colors",
                                    index === 0 ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!isAuthenticated && (
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border mt-4">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full font-bold">Đăng nhập</Button>
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full bg-primary font-bold">Đăng ký</Button>
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;

