'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Users, Check, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchDirectoryQuery } from '@/src/redux/feature/userApi';
import { useCreateGroupChatMutation } from '@/src/redux/feature/chatApi';

interface GroupCreationModalProps {
    open: boolean;
    onClose: () => void;
    onChatCreated: (chatId: string) => void;
}

export function GroupCreationModal({ open, onClose, onChatCreated }: GroupCreationModalProps) {
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const { data, isLoading, isFetching } = useSearchDirectoryQuery(debouncedSearch, {
        skip: debouncedSearch.length < 2,
    });

    const [createGroupChat, { isLoading: creatingGroup }] = useCreateGroupChatMutation();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const users = data?.users || [];
    const showLoading = isLoading || isFetching;

    // Toggle member selection
    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    // Create group
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error('Vui lòng nhập tên nhóm!');
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 thành viên!');
            return;
        }

        try {
            const result = await createGroupChat({
                name: groupName.trim(),
                memberIds: selectedMembers,
            }).unwrap();
            toast.success('Tạo nhóm thành công!');
            onChatCreated(result.chat.id);
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Lỗi tạo nhóm!');
        }
    };

    // Reset state on close
    const handleClose = () => {
        setGroupName('');
        setSearchTerm('');
        setDebouncedSearch('');
        setSelectedMembers([]);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Tạo nhóm mới</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Group name input */}
                    <div>
                        <Label htmlFor="groupName" className="text-sm font-medium mb-2 block">
                            Tên nhóm
                        </Label>
                        <Input
                            id="groupName"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-gray-100 dark:bg-gray-700 border-0"
                        />
                    </div>

                    {/* Search directory */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Thêm thành viên
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {/* Selected members count */}
                    {selectedMembers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Check className="h-4 w-4" />
                            Đã chọn {selectedMembers.length} thành viên
                        </div>
                    )}

                    {/* Search results / user list */}
                    <ScrollArea className="h-64 rounded-md border p-2">
                        {showLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleMember(user.id)}
                                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedMembers.includes(user.id)
                                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                                : 'hover:bg-muted'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedMembers.includes(user.id)}
                                            onCheckedChange={() => toggleMember(user.id)}
                                            className="pointer-events-none"
                                        />
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback>
                                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-sm font-medium leading-none truncate">
                                                {user.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : debouncedSearch.length >= 2 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
                                <UserIcon className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Không tìm thấy người dùng.</p>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
                            </div>
                        )}
                    </ScrollArea>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreateGroup}
                            disabled={creatingGroup || !groupName.trim() || selectedMembers.length === 0}
                        >
                            {creatingGroup ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tạo...
                                </span>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Tạo nhóm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}