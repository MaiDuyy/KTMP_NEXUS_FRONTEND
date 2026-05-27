'use client';

import { useState } from 'react';
import {
  useListDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  Department,
} from '@/src/redux/feature/departmentApi';
import { useListUsersQuery } from '@/src/redux/feature/adminApi';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, Users, Building, AlertTriangle, Calendar,
  GitMerge, UserCheck, ShieldAlert, X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DeptMembersDialog } from './DeptMembersDialog';
import { getAvatarUrl } from '@/src/utils/image-utils';

export function DepartmentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [managerId, setManagerId] = useState('');

  const { data: departments = [], isLoading } = useListDepartmentsQuery();
  const { data: usersData, isLoading: isUsersLoading } = useListUsersQuery({ limit: 300 });
  
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const allUsers = usersData?.items || [];

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId('');
    setManagerId('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const cleanParentId = (parentId && parentId !== 'none_parent') ? parentId : null;
      const cleanManagerId = (managerId && managerId !== 'none_manager') ? managerId : null;
      await createDept({
        name: name.trim(),
        description: description.trim() || null,
        parentId: cleanParentId,
        managerId: cleanManagerId,
      }).unwrap();
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
      const cleanParentId = (parentId && parentId !== 'none_parent') ? parentId : null;
      const cleanManagerId = (managerId && managerId !== 'none_manager') ? managerId : null;
      await updateDept({
        id: editingDept.id,
        name: name.trim(),
        description: description.trim() || null,
        parentId: cleanParentId,
        managerId: cleanManagerId,
      }).unwrap();
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
    setParentId(dept.parentId || '');
    setManagerId(dept.managerId || '');
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm phòng ban..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg bg-transparent border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>
        <Button
          size="sm"
          onClick={() => { resetForm(); setShowCreateDialog(true); }}
          className="h-9 text-xs rounded-lg px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Phòng ban mới
        </Button>
      </div>

      {/* Grid view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải danh sách phòng ban...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-card text-muted-foreground">
          <Building className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy phòng ban nào</p>
          <p className="text-xs text-muted-foreground mt-1">Tạo phòng ban đầu tiên để quản lý sơ đồ nhân sự của tổ chức</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dept => {
            const parentDept = departments.find(d => d.id === dept.parentId);
            const manager = allUsers.find(u => u.id === dept.managerId);
            
            return (
              <Card key={dept.id} className="group rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200 overflow-hidden flex flex-col justify-between">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-200">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-1" title={dept.name}>
                          {dept.name}
                        </CardTitle>
                        {parentDept ? (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/5 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                            <GitMerge className="w-2.5 h-2.5 transform rotate-90" />
                            <span className="truncate">{parentDept.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <span>Phòng ban cấp cao</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs w-44 rounded-lg">
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase px-2.5 py-1.5">Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedDept(dept); setShowMembersDialog(true); }}>
                          <Users className="w-4 h-4 mr-2 text-slate-400" /> Quản lý nhân sự
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(dept)}>
                          <Edit className="w-4 h-4 mr-2 text-slate-400" /> Sửa thông tin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600 dark:focus:text-rose-500 cursor-pointer"
                          onClick={() => { setSelectedDept(dept); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Xóa phòng ban
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-3.5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-8">
                    {dept.description || 'Không có mô tả chi tiết chức năng.'}
                  </p>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                    {/* Manager info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trưởng phòng</span>
                      {manager ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 rounded-full shrink-0 border border-slate-200">
                            <AvatarImage src={manager.avatar ? getAvatarUrl(manager.avatar) : undefined} />
                            <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 font-bold">
                              {manager.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-700 dark:text-slate-350 text-[11px] truncate max-w-[120px]">{manager.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-slate-400">Chưa bổ nhiệm</span>
                      )}
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-350">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dept.memberCount || 0} nhân sự</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(dept.createdAt), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-xl max-w-md border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Plus className="w-4 h-4 text-blue-500" />
              Tạo phòng ban mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Thêm một phòng ban mới để phân công quản lý và phân cấp luồng tài liệu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên phòng ban</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Phòng Kỹ thuật, Marketing..."
                className="h-8.5 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 border-slate-200 dark:border-slate-800"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng ban cha (Phân cấp)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                    <SelectValue placeholder="Chọn phòng ban cha..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-48">
                    <SelectItem value="none_parent" className="text-xs cursor-pointer italic text-slate-400">Không có (Cấp cao nhất)</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs cursor-pointer">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ định Trưởng phòng (HEAD)</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                    <SelectValue placeholder="Bổ nhiệm trưởng phòng..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-48">
                    <SelectItem value="none_manager" className="text-xs cursor-pointer italic text-slate-400">Không bổ nhiệm</SelectItem>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({u.email.split('@')[0]})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả chức năng</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả chức năng chính của phòng ban này..."
                rows={3}
                className="text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 border-slate-200 dark:border-slate-800 resize-none leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)} className="h-8.5 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="h-8.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo phòng ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDept} onOpenChange={() => setEditingDept(null)}>
        <DialogContent className="rounded-xl max-w-md border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Edit className="w-4 h-4 text-blue-500" />
              Chỉnh sửa thông tin phòng ban
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Cập nhật tên, chức năng hoạt động, cấu trúc quản lý và vị trí phân cấp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên phòng ban</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-8.5 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 border-slate-200 dark:border-slate-800 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng ban cha (Phân cấp)</Label>
                <Select value={parentId || "none_parent"} onValueChange={(val) => setParentId(val === "none_parent" ? "" : val)}>
                  <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                    <SelectValue placeholder="Chọn phòng ban cha..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-48">
                    <SelectItem value="none_parent" className="text-xs cursor-pointer italic text-slate-400">Không có (Cấp cao nhất)</SelectItem>
                    {departments
                      .filter(d => d.id !== editingDept?.id) // Prevent self parent loop
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs cursor-pointer">{d.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ định Trưởng phòng (HEAD)</Label>
                <Select value={managerId || "none_manager"} onValueChange={(val) => setManagerId(val === "none_manager" ? "" : val)}>
                  <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                    <SelectValue placeholder="Bổ nhiệm trưởng phòng..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-48">
                    <SelectItem value="none_manager" className="text-xs cursor-pointer italic text-slate-400">Không bổ nhiệm</SelectItem>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({u.email.split('@')[0]})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả chức năng</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 border-slate-200 dark:border-slate-800 resize-none leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setEditingDept(null)} className="h-8.5 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!name.trim() || isUpdating}
              className="h-8.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-xl max-w-md border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              Xóa phòng ban
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn có chắc chắn muốn xóa phòng ban <strong className="text-slate-850 dark:text-slate-200">{selectedDept?.name}</strong>?
              Các thành viên sẽ tự động bị gỡ khỏi phòng ban này nhưng <strong className="text-slate-800 dark:text-slate-200">không</strong> bị xóa khỏi hệ thống tài khoản.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="h-8.5 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      {selectedDept && (
        <DeptMembersDialog
          open={showMembersDialog}
          onOpenChange={setShowMembersDialog}
          departmentId={selectedDept.id}
          departmentName={selectedDept.name}
        />
      )}
    </div>
  );
}
