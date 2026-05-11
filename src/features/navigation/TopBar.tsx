'use client';

import { useAppSelector, useAppDispatch } from '@/src/redux/hooks';
import type { RootState } from '@/src/redux/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logOut } from '@/src/redux/feature/authSlice';

interface TopBarProps {
    className?: string;
}

/**
 * Top navigation bar with user profile and notifications
 */
export function TopBar({ className }: TopBarProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logOut());
        router.push('/auth/sign-in');
    };

    const initials = user?.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    return (
        <header className={`h-14 border-b flex items-center justify-between px-4 ${className}`}>
            {/* Left side - can add breadcrumbs or search */}
            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {/* Notification badge */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 px-2">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {user?.name && (
                                <span className="text-sm font-medium hidden sm:inline">
                                    {user.name}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push('/account')}>
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
