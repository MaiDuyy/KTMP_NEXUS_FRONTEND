'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { cn } from '@/lib/utils';
import { useListChannelsQuery } from '@/src/redux/feature/channelApi';
import { useGetChatsQuery } from '@/src/redux/feature/chatApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Hash,
    Lock,
    Megaphone,
    Plus,
    Search,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    Users,
    Loader2,
} from 'lucide-react';
import { DirectorySearchModal } from './DirectorySearchModal';
import { WorkspaceGuard } from '@/src/components/WorkspaceGuard';
import { InviteMemberModal } from './InviteMemberModal';

interface ChannelSidebarProps {
    workspaceId: string;
    className?: string;
}

/**
 * Channel sidebar with channel list and DM list
 */
export function ChannelSidebar({ workspaceId: propWorkspaceId, className }: ChannelSidebarProps) {
    const router = useRouter();
    const params = useParams();
    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
    const workspaceId = (params.workspaceId as string) || currentWorkspaceId || propWorkspaceId;
    const currentChatId = params?.chatId as string;

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [channelsExpanded, setChannelsExpanded] = useState(true);
    const [dmsExpanded, setDmsExpanded] = useState(true);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    // Fetch channels
    const { data: channels, isLoading: channelsLoading } = useListChannelsQuery({ workspaceId });

    // Fetch DM chats (Dependent on workspaceId for cache key)
    const { data: chatsData, isLoading: chatsLoading } = useGetChatsQuery({ type: 'private', workspaceId });


    const filteredChannels = channels?.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDMs = chatsData?.chats?.filter((chat) =>
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'PRIVATE':
                return <Lock className="w-4 h-4" />;
            case 'ANNOUNCEMENT':
                return <Megaphone className="w-4 h-4" />;
            default:
                return <Hash className="w-4 h-4" />;
        }
    };

    const handleChannelClick = (channelId: string) => {
        router.push(`/chat/${channelId}`);
    };

    const handleDMClick = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    return (
        <div className={cn('flex flex-col h-full border-r bg-muted/30', className)}>
            {/* Search */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {/* Channels Section */}
                <div className="p-2">
                    <button
                        onClick={() => setChannelsExpanded(!channelsExpanded)}
                        className="flex items-center gap-1 w-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        {channelsExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                        <span>Channels</span>
                        <span className="ml-auto text-xs">{channels?.length || 0}</span>
                    </button>

                    {channelsExpanded && (
                        <div className="mt-1 space-y-0.5">
                            {channelsLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            ) : filteredChannels?.length === 0 ? (
                                <p className="px-2 py-2 text-xs text-muted-foreground">No channels</p>
                            ) : (
                                filteredChannels?.map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => handleChannelClick(channel.id)}
                                        className={cn(
                                            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm',
                                            'hover:bg-muted transition-colors',
                                            currentChatId === channel.id && 'bg-primary/10 text-primary font-medium'
                                        )}
                                    >
                                        {getChannelIcon(channel.type)}
                                        <span className="truncate">{channel.name}</span>
                                        {channel._count?.members > 0 && (
                                            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-0.5">
                                                <Users className="w-3 h-3" />
                                                {channel._count.members}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}

                            {/* Add Channel Button (Role-based) */}
                            <WorkspaceGuard allowedRoles={['OWNER', 'ADMIN']}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-muted-foreground"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Channel
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="w-full justify-start gap-2 text-muted-foreground"
                                >
                                    <Users className="w-4 h-4" />
                                    Invite Members
                                </Button>
                            </WorkspaceGuard>
                        </div>
                    )}
                </div>

                {/* Direct Messages Section */}
                <div className="p-2 border-t">
                    <button
                        onClick={() => setDmsExpanded(!dmsExpanded)}
                        className="flex items-center gap-1 w-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        {dmsExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                        <span>Direct Messages</span>
                        <span className="ml-auto text-xs">{chatsData?.chats?.length || 0}</span>
                    </button>

                    {dmsExpanded && (
                        <div className="mt-1 space-y-0.5">
                            {chatsLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            ) : filteredDMs?.length === 0 ? (
                                <p className="px-2 py-2 text-xs text-muted-foreground">No conversations</p>
                            ) : (
                                filteredDMs?.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleDMClick(chat.id)}
                                        className={cn(
                                            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm',
                                            'hover:bg-muted transition-colors',
                                            currentChatId === chat.id && 'bg-primary/10 text-primary font-medium'
                                        )}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="truncate">{chat.name || 'Direct Message'}</span>
                                        {!chat.readed && (
                                            <span className="ml-auto w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </button>
                                ))
                            )}

                            {/* New DM Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSearchModalOpen(true)}
                                className="w-full justify-start gap-2 text-muted-foreground"
                            >
                                <Plus className="w-4 h-4" />
                                New Message
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Enterprise Directory Search Modal */}
            <DirectorySearchModal
                open={isSearchModalOpen}
                onOpenChange={setIsSearchModalOpen}
            />

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                workspaceId={workspaceId}
            />
        </div>
    );
}
