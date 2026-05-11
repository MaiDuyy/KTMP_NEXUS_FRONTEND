'use client';

import { useState } from 'react';
import {
    useListOrganizationsQuery,
    useUpdateOrgQuotaMutation,
    Organization
} from '@/src/redux/feature/adminApi';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Search,
    Building2,
    Users,
    Layers,
    Loader2,
    Edit2,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function OrganizationsTable() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [showQuotaDialog, setShowQuotaDialog] = useState(false);
    const [newQuota, setNewQuota] = useState(10);

    const { data, isLoading } = useListOrganizationsQuery({ search: searchQuery });
    const [updateQuota, { isLoading: isUpdating }] = useUpdateOrgQuotaMutation();

    const handleUpdateQuota = async () => {
        if (!selectedOrg) return;
        try {
            await updateQuota({
                orgId: selectedOrg.id,
                maxWorkspaces: newQuota
            }).unwrap();
            toast.success('Đã cập nhật giới hạn Workspace thành công');
            setShowQuotaDialog(false);
        } catch (error) {
            toast.error('Không thể cập nhật giới hạn');
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
                        placeholder="Tìm kiếm tổ chức..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Tổ chức</TableHead>
                            <TableHead>Domain / Slug</TableHead>
                            <TableHead>Thành viên</TableHead>
                            <TableHead>Giới hạn WS</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!data?.items || data.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Không tìm thấy tổ chức nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.items.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{org.name}</span>
                                                <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 capitalize">
                                                    {org.plan}
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-mono">{org.domain}</span>
                                            <span className="text-xs text-muted-foreground italic">{org.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            {org._count?.members || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                                {org.maxWorkspaces}
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-slate-400 hover:text-primary"
                                                onClick={() => {
                                                    setSelectedOrg(org);
                                                    setNewQuota(org.maxWorkspaces);
                                                    setShowQuotaDialog(true);
                                                }}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(org.createdAt), 'dd/MM/yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {/* Future actions */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Điều chỉnh giới hạn Workspace</DialogTitle>
                        <DialogDescription>
                            Thay đổi số lượng Workspace tối đa mà tổ chức <strong>{selectedOrg?.name}</strong> có thể tạo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="quota">Giới hạn mới</Label>
                            <div className="flex items-center gap-3">
                                <Layers className="w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="quota"
                                    type="number"
                                    min="1"
                                    value={newQuota}
                                    onChange={(e) => setNewQuota(parseInt(e.target.value))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateQuota}
                            disabled={isUpdating}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
