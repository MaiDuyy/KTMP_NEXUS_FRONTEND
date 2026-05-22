'use client';

import { useState } from 'react';
import {
  useListDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  Department,
} from '@/src/redux/feature/departmentApi';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, Users, Building, AlertTriangle, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function DepartmentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: departments = [], isLoading } = useListDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setDescription('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createDept({ name: name.trim(), description: description.trim() || undefined }).unwrap();
      toast.success('Đã tạo phòng ban');
      setShowCreateDialog(false);
      resetForm();
    } catch {
      toast.error('Tạo phòng ban thất bại');
    }
  };

  const handleUpdate = async () => {
    if (!editingDept || !name.trim()) return;
    try {
      await updateDept({ id: editingDept.id, name: name.trim(), description: description.trim() || undefined }).unwrap();
      toast.success('Đã cập nhật phòng ban');
      setEditingDept(null);
      resetForm();
    } catch {
      toast.error('Cập nhật phòng ban thất bại');
    }
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    try {
      await deleteDept(selectedDept.id).unwrap();
      toast.success('Đã xóa phòng ban');
      setShowDeleteDialog(false);
      setSelectedDept(null);
    } catch {
      toast.error('Xóa phòng ban thất bại');
    }
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
  };

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm phòng ban..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg bg-transparent border-border focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button
            size="sm"
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="h-8 text-xs rounded-lg px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Phòng ban mới
        </Button>
      </div>

      {/* Grid view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
          <p className="text-[11px] text-muted-foreground animate-pulse">Đang tải danh sách phòng ban...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl bg-card text-muted-foreground">
          <Building className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Không tìm thấy phòng ban nào</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Tạo phòng ban đầu tiên để quản lý sơ đồ nhân sự</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dept => (
            <Card key={dept.id} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors overflow-hidden">
              <CardHeader className="p-3 pb-2 border-b border-border/50 bg-slate-50/20 dark:bg-slate-900/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                      <Building className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">{dept.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[160px] mt-0.5">
                        {dept.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreHorizontal className="h-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Thao tác</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/60" />
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(dept)}>
                        <Edit className="w-3.5 h-3.5 mr-2 text-slate-400" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 dark:focus:text-red-500 cursor-pointer"
                        onClick={() => { setSelectedDept(dept); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa phòng ban
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dept.memberCount}</span> thành viên
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{format(new Date(dept.createdAt), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-xl max-w-sm border-border bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Plus className="w-4 h-4 text-primary" />
              Tạo phòng ban mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Thêm một phòng ban mới để phân công và tổ chức sơ đồ nhân sự.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tên phòng ban</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Phòng Kỹ thuật, Marketing..."
                className="h-8 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mô tả chức năng</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả chức năng chính của phòng ban này..."
                rows={3}
                className="text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)} className="h-8 text-xs rounded-lg">Hủy</Button>
            <Button
                size="sm"
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Tạo phòng ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDept} onOpenChange={() => setEditingDept(null)}>
        <DialogContent className="rounded-xl max-w-sm border-border bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Edit className="w-4 h-4 text-primary" />
              Chỉnh sửa thông tin phòng ban
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Cập nhật tên và chức năng hoạt động của phòng ban.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tên phòng ban</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-8 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mô tả chức năng</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingDept(null)} className="h-8 text-xs rounded-lg">Hủy</Button>
            <Button
                size="sm"
                onClick={handleUpdate}
                disabled={!name.trim() || isUpdating}
                className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-xl max-w-sm border-border bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Xóa phòng ban
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn có chắc chắn muốn xóa phòng ban <strong>{selectedDept?.name}</strong>?
              Các thành viên sẽ tự động bị gỡ khỏi phòng ban này nhưng <strong>không</strong> bị xóa khỏi hệ thống tài khoản.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="h-8 text-xs rounded-lg">Hủy</Button>
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
    </div>
  );
}
