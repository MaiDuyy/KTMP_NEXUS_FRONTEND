'use client';

import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useHasGroupAccess } from '@/src/lib/rbac/usePermission';
import { PERMISSION_GROUPS } from '@/src/lib/rbac/permissions';
import {
    MessageSquare,
    Sparkles,
    BookOpen,
    Shield,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
    label: string;
    href: string;
    icon: typeof MessageSquare;
    group: string;
}

const navItems: NavItem[] = [
    {
        label: 'Chat',
        href: '/chat',
        icon: MessageSquare,
        group: PERMISSION_GROUPS.CHAT,
    },
    {
        label: 'AI Assistant',
        href: '/ai',
        icon: Sparkles,
        group: PERMISSION_GROUPS.AI,
    },
    {
        label: 'Knowledge',
        href: '/knowledge',
        icon: BookOpen,
        group: PERMISSION_GROUPS.KNOWLEDGE,
    },
    {
        label: 'Security',
        href: '/security',
        icon: Shield,
        group: PERMISSION_GROUPS.SECURITY,
    },
    {
        label: 'Admin',
        href: '/admin',
        icon: Settings,
        group: PERMISSION_GROUPS.ADMIN,
    },
];

interface AppSidebarProps {
    className?: string;
}

/**
 * Main application sidebar with permission-based navigation
 */
export function AppSidebar({ className }: AppSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Filter nav items based on permissions
    const visibleItems = navItems.filter((item) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useHasGroupAccess(item.group);
    });

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    'flex flex-col h-full border-r bg-background transition-all duration-200',
                    collapsed ? 'w-16' : 'w-60',
                    className
                )}
            >
                {/* Logo / Brand */}
                <div className="h-14 border-b flex items-center px-4">
                    {!collapsed && (
                        <span className="font-semibold text-lg">Enterprise Chat</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {visibleItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        const linkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                    'hover:bg-muted',
                                    isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground',
                                    collapsed && 'justify-center'
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            );
                        }

                        return <div key={item.href}>{linkContent}</div>;
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="border-t p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn('w-full', collapsed && 'px-0')}
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Collapse
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
