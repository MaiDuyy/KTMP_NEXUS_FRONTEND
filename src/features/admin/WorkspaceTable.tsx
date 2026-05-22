'use client';

import { useState, useEffect } from 'react';
import {
    useGetUserWorkspacesQuery,
    useDeleteWorkspaceMutation,
    useTransferOwnershipMutation,
    useDissolveWorkspaceMutation,
    useRestoreWorkspaceMutation,
    useGetDissolvedWorkspacesQuery,
    Workspace
} from '@/src/redux/feature/workspaceApi';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { WorkspaceMembersDialog } from './WorkspaceMembersDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    MoreHorizontal,
    Trash2,
    Settings,
    Shield,
    Loader2,
    Building2,
    Users,
    MessageSquare,
    History,
    RotateCcw,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function WorkspaceTable() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [showMembersDialog, setShowMembersDialog] = useState(false);
    const [showDissolveDialog, setShowDissolveDialog] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'dissolved'>('active');

    // Pagination states
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(0); // Reset page to 0 on search changes
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: workspaces, isLoading: isLoadingActive } = useGetUserWorkspacesQuery();
    const { data: dissolvedWorkspaces, isLoading: isLoadingDissolved } = useGetDissolvedWorkspacesQuery();

    const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();
    const [dissolveWorkspace, { isLoading: isDissolving }] = useDissolveWorkspaceMutation();
    const [restoreWorkspace, { isLoading: isRestoring }] = useRestoreWorkspaceMutation();

    const currentWorkspaces = activeTab === 'active' ? workspaces : dissolvedWorkspaces;
    const isLoading = activeTab === 'active' ? isLoadingActive : isLoadingDissolved;

    const filteredWorkspaces = currentWorkspaces?.filter(ws =>
        ws.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        ws.slug.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ) || [];

    const paginatedWorkspaces = filteredWorkspaces.slice(page * size, (page + 1) * size);

    // Auto-decrement page if current page becomes empty
    useEffect(() => {
        if (paginatedWorkspaces.length === 0 && page > 0 && !isLoading) {
            setPage((prev) => Math.max(0, prev - 1));
        }
    }, [paginatedWorkspaces.length, page, isLoading]);

    const handleDelete = async () => {
        if (!selectedWorkspace) return;
        try {
            await deleteWorkspace(selectedWorkspace.id).unwrap();
            toast.success('Đã xóa vĩnh viễn workspace');
            setShowDeleteDialog(false);
            setSelectedWorkspace(null);
        } catch (error) {
            toast.error('Không thể xóa workspace');
        }
    };

    const handleDissolve = async () => {
        if (!selectedWorkspace) return;
        if (confirmName !== selectedWorkspace.name) {
            toast.error('Tên xác nhận không trùng khớp');
            return;
        }
        try {
            await dissolveWorkspace({
                workspaceId: selectedWorkspace.id,
                workspaceNameConfirm: selectedWorkspace.name
            }).unwrap();
            toast.success(`Workspace "${selectedWorkspace.name}" đã được giải tán.`);
            setShowDissolveDialog(false);
            setConfirmName('');
            setSelectedWorkspace(null);
        } catch (error) {
            toast.error('Không thể giải tán Workspace.');
        }
    };

    const handleRestore = async (workspace: Workspace) => {
        try {
            await restoreWorkspace(workspace.id).unwrap();
            toast.success(`Workspace "${workspace.name}" đã được khôi phục.`);
        } catch (error) {
            toast.error('Không thể khôi phục Workspace.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
                <p className="text-[11px] text-muted-foreground animate-pulse">Đang tải danh sách không gian làm việc...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm workspace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg bg-transparent border-border focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>
                <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); setPage(0); }}>
                    <div className="bg-slate-100/60 dark:bg-slate-800/60 p-0.5 rounded-lg w-fit">
                        <TabsList className="bg-transparent h-7 gap-0.5 p-0">
                            <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-3 h-6 text-[11px] font-semibold">
                                Đang hoạt động
                            </TabsTrigger>
                            <TabsTrigger value="dissolved" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-3 h-6 text-[11px] font-semibold flex items-center gap-1.5">
                                <History className="w-3 h-3" />
                                Đã giải tán
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>
            </div>

            {/* Table Container */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Workspace</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Đường dẫn (Slug)</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Thống kê</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Cập nhật lúc</TableHead>
                            <TableHead className="w-[48px] py-2 px-3 h-auto"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedWorkspaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                    Không tìm thấy không gian làm việc nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedWorkspaces.map((ws) => (
                                <TableRow key={ws.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 border-b border-border/50 last:border-0">
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                                                    {ws.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[240px] mt-0.5">
                                                    {ws.description || 'Không có mô tả'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 px-1 py-0.5 rounded-md">
                                            {ws.slug}
                                        </code>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Thành viên">
                                                <Users className="w-3 h-3 text-slate-400" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{ws.memberCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Kênh chat">
                                                <MessageSquare className="w-3 h-3 text-slate-400" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{ws.channelCount}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                                        {format(new Date(ws.updatedAt), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-xs">
                                                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Tác vụ</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-border/60" />
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                                    setSelectedWorkspace(ws);
                                                    setShowMembersDialog(true);
                                                }}>
                                                    <Users className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                    Xem thành viên
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border/60" />
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                                    setSelectedWorkspace(ws);
                                                    setShowTransferDialog(true);
                                                }}>
                                                    <Shield className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                    Chuyển nhượng sở hữu
                                                </DropdownMenuItem>
                                                {activeTab === 'active' ? (
                                                    <DropdownMenuItem
                                                        className="text-amber-600 focus:text-amber-600 dark:focus:text-amber-500 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedWorkspace(ws);
                                                            setConfirmName('');
                                                            setShowDissolveDialog(true);
                                                        }}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-2" />
                                                        Giải tán
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-green-600 focus:text-green-600 dark:focus:text-green-500 cursor-pointer"
                                                        onClick={() => handleRestore(ws)}
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                        Khôi phục
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="bg-border/60" />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 dark:focus:text-red-500 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedWorkspace(ws);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                    Xóa vĩnh viễn
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredWorkspaces.length > 0 && (
                <WikiPagination
                    page={page}
                    size={size}
                    totalPages={Math.ceil(filteredWorkspaces.length / size)}
                    totalElements={filteredWorkspaces.length}
                    setPage={setPage}
                    setSize={setSize}
                />
            )}

            {/* Permanent Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="rounded-xl max-w-sm border-border bg-card">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            Xóa vĩnh viễn Workspace
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Bạn có chắc chắn muốn xóa vĩnh viễn workspace <strong>{selectedWorkspace?.name}</strong>?
                            Hành động này sẽ xóa sạch tất cả kênh, tin nhắn và tài liệu đính kèm, không thể đảo ngược.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="h-8 text-xs rounded-lg">
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-8 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dissolve Dialog */}
            <Dialog open={showDissolveDialog} onOpenChange={setShowDissolveDialog}>
                <DialogContent className="rounded-xl max-w-md border-border bg-card">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                            <XCircle className="w-4 h-4" />
                            Giải tán Workspace
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Hành động này sẽ tạm ngừng mọi hoạt động của các thành viên trong workspace <strong>{selectedWorkspace?.name}</strong>.
                            Dữ liệu sẽ được lưu trữ và có thể khôi phục lại trong tương lai.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Xác nhận tên Workspace:</label>
                        <p className="text-xs text-muted-foreground leading-normal">
                            Vui lòng nhập chính xác tên <strong>{selectedWorkspace?.name}</strong> bên dưới để tiếp tục:
                        </p>
                        <Input
                            placeholder="Nhập tên workspace..."
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="h-8 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => { setShowDissolveDialog(false); setConfirmName(''); }} className="h-8 text-xs rounded-lg">
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDissolve}
                            disabled={isDissolving || confirmName !== selectedWorkspace?.name}
                            className="h-8 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                        >
                            {isDissolving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Xác nhận giải tán
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TransferOwnershipDialog
                workspace={selectedWorkspace}
                open={showTransferDialog}
                onOpenChange={setShowTransferDialog}
            />

            <WorkspaceMembersDialog
                workspace={selectedWorkspace}
                open={showMembersDialog}
                onOpenChange={setShowMembersDialog}
            />
        </div>
    );
}
