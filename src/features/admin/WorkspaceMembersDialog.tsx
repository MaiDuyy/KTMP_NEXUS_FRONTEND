'use client';

import { useState } from 'react';
import {
    useGetWorkspaceMembersQuery,
    Workspace
} from '@/src/redux/feature/workspaceApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface WorkspaceMembersDialogProps {
    workspace: Workspace | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WorkspaceMembersDialog({ workspace, open, onOpenChange }: WorkspaceMembersDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: membersData, isLoading } = useGetWorkspaceMembersQuery(
        { workspaceId: workspace?.id || '' },
        { skip: !workspace || !open }
    );

    const members = membersData?.items || [];
    const filteredMembers = members.filter(m => 
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Thành viên Workspace
                    </DialogTitle>
                    <DialogDescription>
                        Danh sách thành viên hiện tại trong <strong>{workspace?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm thành viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2 no-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <p className="text-center py-8 text-sm text-muted-foreground italic">
                                Không tìm thấy thành viên phù hợp
                            </p>
                        ) : (
                            filteredMembers.map((member) => (
                                <div
                                    key={member.user.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.avatar} />
                                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{member.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{member.user.email}</span>
                                        </div>
                                    </div>
                                    <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className="text-[10px]">
                                        {member.role}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
