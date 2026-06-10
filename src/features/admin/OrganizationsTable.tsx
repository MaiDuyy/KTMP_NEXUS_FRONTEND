'use client';

import { useState, useEffect } from 'react';
import {
    useListOrganizationsQuery,
    useUpdateOrgQuotaMutation,
    Organization
} from '@/src/redux/feature/adminApi';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
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
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [showQuotaDialog, setShowQuotaDialog] = useState(false);
    const [newQuota, setNewQuota] = useState(10);
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(0); // Reset page to 0 on search query changes
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, isLoading } = useListOrganizationsQuery({
        search: debouncedSearchQuery || undefined,
        page: page + 1,
        limit: size
    });

    const [updateQuota, { isLoading: isUpdating }] = useUpdateOrgQuotaMutation();

    // Auto-decrement page if current page becomes empty
    useEffect(() => {
        if (data?.items && data.items.length === 0 && page > 0 && !isLoading) {
            setPage((prev) => Math.max(0, prev - 1));
        }
    }, [data?.items, page, isLoading]);

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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tổ chức..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg"
                    />
                </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border">
                        <TableRow>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tổ chức</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Domain / Slug</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Thành viên</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Giới hạn WS</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ngày tạo</TableHead>
                            <TableHead className="w-[60px] h-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!data?.items || data.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                    Không tìm thấy tổ chức nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.items.map((org) => (
                                <TableRow key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-border transition-colors">
                                    <TableCell className="py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                                                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-foreground">{org.name}</span>
                                                <Badge variant="outline" className="w-fit text-[9px] h-3.5 px-1 uppercase font-extrabold rounded-md mt-0.5">
                                                    {org.plan}
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-foreground leading-tight">{org.domain}</span>
                                            <span className="text-[10px] text-muted-foreground italic leading-none mt-0.5">{org.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                            <Users className="w-3.5 h-3.5" />
                                            {org._count?.members || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1 rounded-md font-semibold">
                                                {org.maxWorkspaces}
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-slate-400 hover:text-primary rounded-md"
                                                onClick={() => {
                                                    setSelectedOrg(org);
                                                    setNewQuota(org.maxWorkspaces);
                                                    setShowQuotaDialog(true);
                                                }}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                            {format(new Date(org.createdAt), 'dd/MM/yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        {/* Future actions */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
                <WikiPagination
                    page={page}
                    size={size}
                    totalPages={Math.ceil(data.total / size)}
                    totalElements={data.total}
                    setPage={setPage}
                    setSize={setSize}
                />
            )}

            <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">Điều chỉnh giới hạn Workspace</DialogTitle>
                        <DialogDescription className="text-xs">
                            Thay đổi số lượng Workspace tối đa mà tổ chức <strong>{selectedOrg?.name}</strong> có thể tạo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3 space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="quota" className="text-xs font-bold text-foreground">Giới hạn mới</Label>
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="quota"
                                    type="number"
                                    min="1"
                                    value={newQuota}
                                    onChange={(e) => setNewQuota(parseInt(e.target.value))}
                                    className="flex-1 h-8 text-xs rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowQuotaDialog(false)} className="h-8 text-xs rounded-lg">
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateQuota}
                            disabled={isUpdating}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 text-xs rounded-lg"
                        >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
