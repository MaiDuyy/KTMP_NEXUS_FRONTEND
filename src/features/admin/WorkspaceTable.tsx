'use client';

import { useState } from 'react';
import {
    useGetUserWorkspacesQuery,
    useDeleteWorkspaceMutation,
    useTransferOwnershipMutation,
    useDissolveWorkspaceMutation,
    useRestoreWorkspaceMutation,
    useGetDissolvedWorkspacesQuery,
    Workspace
} from '@/src/redux/feature/workspaceApi';
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
    ExternalLink,
    History,
    RotateCcw,
    XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function WorkspaceTable() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [showMembersDialog, setShowMembersDialog] = useState(false);
    const [showDissolveDialog, setShowDissolveDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'dissolved'>('active');

    const { data: workspaces, isLoading: isLoadingActive } = useGetUserWorkspacesQuery();
    const { data: dissolvedWorkspaces, isLoading: isLoadingDissolved } = useGetDissolvedWorkspacesQuery();

    const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();
    const [dissolveWorkspace, { isLoading: isDissolving }] = useDissolveWorkspaceMutation();
    const [restoreWorkspace, { isLoading: isRestoring }] = useRestoreWorkspaceMutation();

    const currentWorkspaces = activeTab === 'active' ? workspaces : dissolvedWorkspaces;
    const isLoading = activeTab === 'active' ? isLoadingActive : isLoadingDissolved;

    const filteredWorkspaces = currentWorkspaces?.filter(ws =>
        ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.slug.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleDelete = async () => {
        if (!selectedWorkspace) return;
        try {
            await deleteWorkspace(selectedWorkspace.id).unwrap();
            toast.success('Workspace deleted permanently');
            setShowDeleteDialog(false);
            setSelectedWorkspace(null);
        } catch (error) {
            toast.error('Failed to delete workspace');
        }
    };

    const handleDissolve = async () => {
        if (!selectedWorkspace) return;
        try {
            await dissolveWorkspace({
                workspaceId: selectedWorkspace.id,
                workspaceNameConfirm: selectedWorkspace.name
            }).unwrap();
            toast.success(`Workspace "${selectedWorkspace.name}" đã được giải tán.`);
            setShowDissolveDialog(false);
            setSelectedWorkspace(null);
        } catch (error) {
            toast.error('Không thể giải tán Workspace. Vui lòng kiểm tra lại tên xác nhận.');
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspaces..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
                    <TabsList>
                        <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
                        <TabsTrigger value="dissolved" className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            Đã giải tán
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Workspace</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredWorkspaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No workspaces found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWorkspaces.map((ws) => (
                                <TableRow key={ws.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ws.name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {ws.description || 'No description'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                            {ws.slug}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users className="w-3.5 h-3.5" />
                                                {ws.memberCount}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {ws.channelCount}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(ws.updatedAt), 'MMM d, yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedWorkspace(ws);
                                                    setShowMembersDialog(true);
                                                }}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    View Members
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedWorkspace(ws);
                                                    setShowTransferDialog(true);
                                                }}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Transfer Ownership
                                                </DropdownMenuItem>
                                                {activeTab === 'active' ? (
                                                    <DropdownMenuItem
                                                        className="text-amber-600"
                                                        onClick={() => {
                                                            setSelectedWorkspace(ws);
                                                            setShowDissolveDialog(true);
                                                        }}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Dissolve
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-green-600"
                                                        onClick={() => handleRestore(ws)}
                                                    >
                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setSelectedWorkspace(ws);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Permanently
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

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedWorkspace?.name}</strong>?
                            This will permanently remove all channels, messages, and files.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDissolveDialog} onOpenChange={setShowDissolveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Giải tán Workspace</DialogTitle>
                        <DialogDescription>
                            Hành động này sẽ tạm ngừng mọi hoạt động trong Workspace <strong>{selectedWorkspace?.name}</strong>.
                            Bạn có thể khôi phục lại sau nếu cần.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm">Vui lòng nhập tên Workspace để xác nhận:</p>
                        <Input
                            placeholder={selectedWorkspace?.name}
                            onChange={(e) => {
                                // Simple local validation check if needed
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDissolveDialog(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDissolve}
                            disabled={isDissolving}
                        >
                            {isDissolving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
