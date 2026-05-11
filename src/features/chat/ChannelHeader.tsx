'use client';

import { cn } from '@/lib/utils';
import { useGetChannelQuery } from '@/src/redux/feature/channelApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Hash,
    Lock,
    Megaphone,
    Users,
    Phone,
    Video,
    Pin,
    Search,
    Settings,
    MoreHorizontal,
    Loader2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChannelHeaderProps {
    channelId: string;
    className?: string;
    onMembersClick?: () => void;
    onSearchClick?: () => void;
    onPinnedClick?: () => void;
}

/**
 * Channel header with channel info, members, and actions
 */
export function ChannelHeader({
    channelId,
    className,
    onMembersClick,
    onSearchClick,
    onPinnedClick,
}: ChannelHeaderProps) {
    const { data: channel, isLoading } = useGetChannelQuery(channelId);

    const getChannelIcon = (type?: string) => {
        switch (type) {
            case 'PRIVATE':
                return <Lock className="w-5 h-5" />;
            case 'ANNOUNCEMENT':
                return <Megaphone className="w-5 h-5" />;
            default:
                return <Hash className="w-5 h-5" />;
        }
    };

    if (isLoading) {
        return (
            <div className={cn('flex items-center justify-center h-14 border-b', className)}>
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!channel) {
        return (
            <div className={cn('flex items-center h-14 border-b px-4', className)}>
                <span className="text-muted-foreground">Channel not found</span>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center h-14 border-b px-4 gap-3', className)}>
            {/* Channel info */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                    {getChannelIcon(channel.type)}
                </div>
                <div className="min-w-0">
                    <h2 className="font-semibold truncate">{channel.name}</h2>
                    {channel.topic && (
                        <p className="text-xs text-muted-foreground truncate">{channel.topic}</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Members */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={onMembersClick}
                >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{channel._count?.members || 0}</span>
                </Button>

                {/* Pinned messages */}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPinnedClick}>
                    <Pin className="w-4 h-4" />
                </Button>

                {/* Search */}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSearchClick}>
                    <Search className="w-4 h-4" />
                </Button>

                {/* Video call */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="w-4 h-4" />
                </Button>

                {/* Voice call */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="w-4 h-4" />
                </Button>

                {/* More options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Channel settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit channel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Notification settings</DropdownMenuItem>
                        <DropdownMenuItem>Mute channel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Leave channel</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
