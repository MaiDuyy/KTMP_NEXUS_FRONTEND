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
  Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, Users, Building,
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
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phòng ban..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Phòng ban mới
        </Button>
      </div>

      {/* Grid view */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Building className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">Không tìm thấy phòng ban nào</p>
          <p className="text-sm">Tạo phòng ban đầu tiên để quản lý nhân sự</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dept => (
            <Card key={dept.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{dept.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dept.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEdit(dept)}>
                        <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => { setSelectedDept(dept); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {dept.memberCount} thành viên
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(dept.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo phòng ban</DialogTitle>
            <DialogDescription>Thêm một phòng ban mới để tổ chức đội ngũ của bạn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên phòng ban</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Phòng Kỹ thuật" />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Chức năng của phòng ban này là gì?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDept} onOpenChange={() => setEditingDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phòng ban</DialogTitle>
            <DialogDescription>Cập nhật thông tin phòng ban.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên phòng ban</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDept(null)}>Hủy</Button>
            <Button onClick={handleUpdate} disabled={!name.trim() || isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Xóa phòng ban</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{selectedDept?.name}</strong>?
              Các thành viên sẽ bị gỡ khỏi phòng ban này nhưng không bị xóa khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
