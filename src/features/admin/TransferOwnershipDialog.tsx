'use client';

import { useState } from 'react';
import {
    useGetWorkspaceMembersQuery,
    useTransferOwnershipMutation,
    Workspace
} from '@/src/redux/feature/workspaceApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TransferOwnershipDialogProps {
    workspace: Workspace | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipDialog({ workspace, open, onOpenChange }: TransferOwnershipDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const { data: membersData, isLoading } = useGetWorkspaceMembersQuery(
        { workspaceId: workspace?.id || '' },
        { skip: !workspace || !open }
    );

    const [transferOwnership, { isLoading: isTransferring }] = useTransferOwnershipMutation();

    const members = membersData?.items || [];
    const filteredMembers = members.filter(m => 
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTransfer = async () => {
        if (!workspace || !selectedUserId) return;
        
        if (!confirming) {
            setConfirming(true);
            return;
        }

        try {
            await transferOwnership({
                workspaceId: workspace.id,
                targetUserId: selectedUserId
            }).unwrap();
            
            toast.success(`Đã chuyển quyền sở hữu Workspace "${workspace.name}" thành công.`);
            onOpenChange(false);
            resetState();
        } catch (error) {
            toast.error('Không thể chuyển quyền sở hữu. Vui lòng thử lại.');
        }
    };

    const resetState = () => {
        setSearchQuery('');
        setSelectedUserId(null);
        setConfirming(false);
    };

    const selectedUser = members.find(m => m.user.id === selectedUserId)?.user;

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetState(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        Chuyển quyền sở hữu
                    </DialogTitle>
                    <DialogDescription>
                        Chọn thành viên sẽ trở thành Owner mới của Workspace <strong>{workspace?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {!confirming ? (
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

                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 no-scrollbar">
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
                                    <button
                                        key={member.user.id}
                                        onClick={() => setSelectedUserId(member.user.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
                                            selectedUserId === member.user.id
                                                ? "bg-primary/10 border-primary/20 border"
                                                : "hover:bg-secondary/60 border border-transparent"
                                        )}
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
                                        {selectedUserId === member.user.id && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-600 dark:text-amber-400 text-xs">
                            <p className="font-bold mb-1">⚠️ Cảnh báo quan trọng:</p>
                            <p>Bạn đang chuyển quyền sở hữu Workspace cho <strong>{selectedUser?.name}</strong>.</p>
                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                <li>Owner cũ sẽ bị hạ cấp xuống ADMIN hoặc EMPLOYEE.</li>
                                <li>Hành động này <strong>không thể hoàn tác</strong> bởi Admin.</li>
                                <li>Owner mới sẽ có toàn quyền kiểm soát Workspace này với vai trò <strong>Workspace Admin</strong>.</li>
                            </ul>
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                            Bạn có chắc chắn muốn tiếp tục không?
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => confirming ? setConfirming(false) : onOpenChange(false)}
                        disabled={isTransferring}
                    >
                        {confirming ? 'Quay lại' : 'Hủy'}
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!selectedUserId || isTransferring}
                        className={cn(confirming ? "bg-amber-600 hover:bg-amber-700" : "bg-primary")}
                    >
                        {isTransferring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {confirming ? 'Xác nhận chuyển' : 'Tiếp tục'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
