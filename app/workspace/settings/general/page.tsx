"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Globe,
  Image as ImageIcon,
  Save,
  Loader2,
  Info,
  Link as LinkIcon,
  FileText,
  AlertTriangle,
  LogOut,
  Crown,
  ChevronRight,
  Users,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useListDepartmentsQuery } from '@/src/redux/feature/departmentApi';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useDissolveWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useLeaveWorkspaceMutation,
  useUpdateWorkspaceMemberRoleMutation,
  useUpdateWorkspaceMutation
} from '@/src/redux/feature/workspaceApi';
import { useUploadWorkspaceIconMutation } from '@/src/redux/feature/uploadApi';
import {
  useListChannelsQuery,
  useDeleteChannelMutation,
  useGetWorkspaceQuery
} from '@/src/redux/feature/channelApi';
import {
  useGetChatsQuery,
  useUpdateChatMemberRoleMutation,
  useDeleteChatMutation
} from '@/src/redux/feature/chatApi';
import { useRouter } from 'next/navigation';
import { setWorkspace } from '@/src/redux/feature/workspaceSlice';
import { TransferOwnershipModal } from '../members/TransferOwnershipModal';
import { DissolveWorkspaceModal } from './DissolveWorkspaceModal';
import { WorkspaceCleanupModal } from './WorkspaceCleanupModal';

const SettingsField = ({ label, description, icon: Icon, value, onSave, isLoading, children }: any) => (
  <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-[4px]">
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon size={14} className="text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">{label}</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">{description}</p>
        </div>
        <div className="flex-1 flex flex-col gap-3 pt-1">
          {children}
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] h-8 text-xs px-3 shadow-none flex items-center gap-1.5"
              onClick={onSave}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function GeneralSettings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const currentUser = useSelector((state: RootState) => state.auth?.user);

  // Source of Truth queries
  const { data: workspaceData } = useGetWorkspaceQuery(currentWorkspaceId || "", { skip: !currentWorkspaceId });
  const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useGetWorkspaceMembersQuery(
    { workspaceId: currentWorkspaceId || '' },
    { skip: !currentWorkspaceId }
  );

  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();
  const [leaveWorkspace, { isLoading: isLeaving }] = useLeaveWorkspaceMutation();
  const [dissolveWorkspace, { isLoading: isDissolving }] = useDissolveWorkspaceMutation();
  const [updateWorkspaceMemberRole, { isLoading: isTransferring }] = useUpdateWorkspaceMemberRoleMutation();
  const [uploadWorkspaceIcon, { isLoading: isUploadingIcon }] = useUploadWorkspaceIconMutation();

  console.log(membersData);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDissolveModalOpen, setIsDissolveModalOpen] = useState(false);
  const [isSelectingSuccessor, setIsSelectingSuccessor] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] = useState<any>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Queries for cleanup
  const { data: channels } = useListChannelsQuery({ workspaceId: currentWorkspaceId || "" }, { skip: !currentWorkspaceId });
  const { data: chatsData } = useGetChatsQuery({ workspaceId: currentWorkspaceId, type: 'group' }, { skip: !currentWorkspaceId });

  const [updateChatRole] = useUpdateChatMemberRoleMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [deleteChannel] = useDeleteChannelMutation();

  const currentWorkspace = workspaceData;
  const myMemberRecord = (membersData as any)?.items?.find((m: any) => m.userId === currentUser?.id);
  const currentUserRoles = useSelector((state: RootState) => state.auth?.roles) || [];
  
  const isSystemManager = currentUserRoles.includes('SUPER_ADMIN') || 
                           currentUserRoles.includes('ADMIN') || 
                           currentUserRoles.includes('WORKSPACE_MANAGER');

  const userRole = (myMemberRecord?.role || (currentWorkspace as any)?.myRole || (isSystemManager ? 'WORKSPACE_ADMIN' : 'EMPLOYEE')).toUpperCase();
  const isOwner = userRole === "OWNER" || userRole === "WORKSPACE_OWNER";

  const totalMemberCount = (membersData as any)?.total || (currentWorkspace as any)?.memberCount || (membersData as any)?.items?.length || 0;
  const totalChannelCount = channels?.length || (currentWorkspace as any)?.channelCount || 0;

  const ownedChannels = channels?.filter((c: any) => c.myMembership?.role === 'OWNER') || [];
  const ownedGroups = (chatsData as any)?.chats?.filter((c: any) => c.isGroup && c.participants?.find((p: any) => p.accountId === currentUser?.id && p.role === 'OWNER')) || [];

  const cleanupItems = [
    ...ownedChannels.map(c => ({ id: c.id, name: c.name, type: 'CHANNEL' as const })),
    ...ownedGroups.map((c: any) => ({ id: c.id, name: c.name, type: 'GROUP' as const }))
  ];

  const [name, setName] = useState(currentWorkspace?.name || "");
  const [description, setDescription] = useState(currentWorkspace?.description || "");
  const [departmentId, setDepartmentId] = useState(currentWorkspace?.departmentId || "");

  const { data: departments = [] } = useListDepartmentsQuery();

  // Sync state when workspace data changes
  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name);
      setDescription(currentWorkspace.description || "");
      setDepartmentId(currentWorkspace.departmentId || "");
    }
  }, [currentWorkspace]);

  const handleSaveName = async () => {
    if (!currentWorkspaceId || !name.trim()) return;
    try {
      await updateWorkspace({ workspaceId: currentWorkspaceId, name }).unwrap();
      toast.success("Đã cập nhật tên Workspace thành công!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể cập nhật tên");
    }
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspaceId) return;

    // Validate client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh JPG, PNG, GIF, WEBP!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 2MB!');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', currentWorkspaceId);
      const res = await uploadWorkspaceIcon(formData).unwrap();
      // Persist URL into workspace record
      await updateWorkspace({ workspaceId: currentWorkspaceId, icon: res.url }).unwrap();
      toast.success('Đã cập nhật logo Workspace thành công!');
    } catch (err: any) {
      setIconPreview(null);
      toast.error(err?.data?.message || 'Lỗi upload ảnh!');
    } finally {
      // Reset input
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  const handleSaveDesc = async () => {
    if (!currentWorkspaceId) return;
    try {
      await updateWorkspace({ workspaceId: currentWorkspaceId, description }).unwrap();
      toast.success("Đã cập nhật mô tả thành công!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể cập nhật mô tả");
    }
  };

  const handleSaveDepartment = async () => {
    if (!currentWorkspaceId) return;
    try {
      const cleanDeptId = (departmentId && departmentId !== 'none') ? departmentId : null;
      await updateWorkspace({ workspaceId: currentWorkspaceId, departmentId: cleanDeptId }).unwrap();
      toast.success("Đã cập nhật phòng ban trực thuộc thành công!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể cập nhật phòng ban trực thuộc");
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!currentWorkspaceId) return;

    const otherMembersCount = totalMemberCount - 1;

    if (isOwner) {
      if (otherMembersCount <= 0) {
        setIsDissolveModalOpen(true);
        return;
      }

      const otherMembers = (membersData as any)?.items?.filter((m: any) => m.userId && m.userId !== currentUser?.id);

      // Check for owned resources before leaving
      if (ownedChannels.length > 0 || ownedGroups.length > 0) {
        toast.info(`Bạn cần xử lý ${ownedChannels.length + ownedGroups.length} nhóm/kênh đang làm chủ trước khi rời đi.`);
        setIsCleanupModalOpen(true);
        return;
      }

      // If no other admins, force successor selection
      const otherAdmins = otherMembers?.filter((m: any) => m.role === 'ADMIN');
      if (!otherAdmins || otherAdmins.length === 0) {
        setIsSelectingSuccessor(true);
        return;
      }

      setIsSelectingSuccessor(true);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn rời khỏi workspace "${currentWorkspace?.name}"?`)) return;

    try {
      await leaveWorkspace(currentWorkspaceId).unwrap();
      toast.success("Đã rời khỏi workspace thành công");
      dispatch(setWorkspace(null));
      router.push("/chat");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể rời khỏi workspace");
    }
  };

  const handleDissolve = () => {
    setIsDissolveModalOpen(true);
  };

  const handleConfirmDissolve = async (workspaceNameConfirm: string) => {
    if (!currentWorkspaceId) return;
    try {
      await dissolveWorkspace({ workspaceId: currentWorkspaceId, workspaceNameConfirm }).unwrap();
      toast.success("Workspace đã được giải tán vĩnh viễn.");
      dispatch(setWorkspace(null));
      router.push("/chat");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể giải tán workspace");
    }
  };

  const handleProcessCleanupItem = async (itemId: string, type: 'CHANNEL' | 'GROUP', action: 'TRANSFER' | 'DELETE', targetUserId?: string) => {
    try {
      if (action === 'DELETE') {
        if (type === 'CHANNEL') {
          await deleteChannel(itemId).unwrap();
        } else {
          await deleteChat(itemId).unwrap();
        }
        toast.success(`Đã xóa ${type === 'CHANNEL' ? 'kênh' : 'nhóm'} thành công`);
      } else if (action === 'TRANSFER' && targetUserId) {
        if (type === 'GROUP') {
          await updateChatRole({ chatId: itemId, memberId: targetUserId, role: 'OWNER' }).unwrap();
          toast.success(`Đã chuyển quyền sở hữu nhóm`);
        } else {
          toast.error("Tính năng chuyển quyền kênh đang được cập nhật. Vui lòng xóa hoặc để trống.");
        }
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Xử lý thất bại");
      throw err;
    }
  };

  const handleCleanupFinish = () => {
    setIsCleanupModalOpen(false);
    toast.success("Đã hoàn tất xử lý tài nguyên. Bạn có thể rời đi ngay bây giờ.");
    // Re-check leave logic
    handleLeaveWorkspace();
  };

  const handleConfirmTransfer = async (shouldLeave: boolean) => {
    if (!selectedSuccessor || !currentWorkspaceId) return;

    try {
      // Use updateWorkspaceMemberRole with 'OWNER' role to trigger transfer
      await updateWorkspaceMemberRole({
        workspaceId: currentWorkspaceId,
        targetUserId: selectedSuccessor.userId,
        role: 'OWNER'
      }).unwrap();

      toast.success(`Đã chuyển quyền sở hữu cho ${selectedSuccessor.name} thành công`);

      if (shouldLeave) {
        await leaveWorkspace(currentWorkspaceId).unwrap();
        dispatch(setWorkspace(null));
        router.push("/chat");
      }
      setIsTransferModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Chuyển quyền thất bại");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Thông tin Workspace</h1>
        <p className="text-xs text-slate-500 mt-0.5">Cấu hình nhận diện thương hiệu và các thông tin cơ bản.</p>
      </div>

      <div className="space-y-4">
        {/* Workspace Identity */}
        <SettingsField
          label="Nhận diện thương hiệu"
          description="Logo này sẽ hiển thị trên Sidebar Rail và trong các lời mời tham gia."
          icon={ImageIcon}
          onSave={() => {}} 
          isLoading={isUploadingIcon}
        >
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-14 w-14 rounded-[4px] border border-slate-200">
                <AvatarImage src={iconPreview || (currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined)} />
                <AvatarFallback className="bg-slate-800 text-white text-lg font-bold rounded-[4px]">
                  {currentWorkspace?.name?.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isUploadingIcon && (
                <div className="absolute inset-0 rounded-[4px] bg-black/40 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <input
                ref={iconInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleIconFileChange}
              />
              <Button
                variant="outline"
                className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 rounded-[4px] shadow-none px-3"
                onClick={() => iconInputRef.current?.click()}
                disabled={isUploadingIcon}
              >
                {isUploadingIcon ? (
                  <><Loader2 size={12} className="mr-1.5 animate-spin" />Đang tải lên...</>
                ) : 'Thay đổi ảnh'}
              </Button>
              <p className="text-[10px] text-slate-400 leading-none mt-1">JPG, PNG, GIF hoặc WEBP. Tối đa 2MB. Khuyên dùng 256×256px.</p>
            </div>
          </div>
        </SettingsField>

        {/* Workspace Name */}
        <SettingsField
          label="Tên Workspace"
          description="Tên này sẽ hiển thị cho tất cả thành viên trong tổ chức."
          icon={Settings}
          onSave={handleSaveName}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 rounded-[4px] border-slate-200 focus:border-blue-500 text-xs"
            placeholder="Nhập tên Workspace..."
          />
        </SettingsField>

        {/* Description */}
        <SettingsField
          label="Mô tả Workspace"
          description="Giới thiệu ngắn gọn về mục tiêu và công việc của đội ngũ này."
          icon={FileText}
          onSave={handleSaveDesc}
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] rounded-[4px] border-slate-200 focus:border-blue-500 resize-none text-xs"
            placeholder="Ví dụ: Đội ngũ phát triển sản phẩm Mobile App..."
          />
        </SettingsField>

        {/* Department */}
        <SettingsField
          label="Phòng ban trực thuộc"
          description="Liên kết Workspace này với một phòng ban để đồng bộ hóa thành viên tự động."
          icon={Building2}
          onSave={handleSaveDepartment}
        >
          <select
            value={departmentId || "none"}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="flex h-8 w-full rounded-[4px] border border-slate-200 focus:border-blue-500 bg-white px-3 py-1 text-xs shadow-none transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="none">-- Không trực thuộc (Dự án độc lập) --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </SettingsField>

        {/* URL / Slug */}
        <SettingsField
          label="Đường dẫn Workspace (Slug)"
          description="Địa chỉ truy cập nhanh. Chỉ được chứa chữ cái, số và dấu gạch ngang."
          icon={LinkIcon}
          onSave={() => toast.success("Đã cập nhật slug thành công!")}
        >
          <div className="flex gap-0">
            <div className="h-8 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-l-[4px] border-r-0 text-slate-500 text-xs font-semibold leading-none">
              nexus-chat.com/
            </div>
            <Input
              defaultValue={currentWorkspace?.name?.toLowerCase().replace(/\s+/g, '-')}
              className="h-8 rounded-r-[4px] border-slate-200 focus:border-blue-500 border-l-0 text-xs rounded-l-none"
            />
          </div>
        </SettingsField>
      </div>

      <Card className="border border-blue-200 bg-blue-50/50 shadow-none rounded-[4px]">
        <CardContent className="p-4 flex gap-3">
          <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-blue-900">Mẹo quản trị</p>
            <p className="text-[11px] text-blue-800 leading-normal">
              Bạn có thể sử dụng các mục cấu hình bên trái để thiết lập các chính sách bảo mật nâng cao hơn như
              mã hóa tin nhắn end-to-end hoặc tích hợp hệ thống đăng nhập tập trung (SSO).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
            <AlertTriangle size={16} />
            Khu vực nguy hiểm
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Các hành động dưới đây có thể gây mất dữ liệu hoặc thay đổi quyền truy cập vĩnh viễn.</p>
        </div>

        <Card className="border border-red-200 bg-red-50/30 shadow-none rounded-[4px]">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-[4px] bg-red-100 text-red-600 shrink-0 h-fit">
                <LogOut size={16} />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs text-red-900">Rời khỏi Workspace</h3>
                <p className="text-[11px] text-red-800/80 leading-normal max-w-md">
                  Bạn sẽ không còn nhìn thấy các tin nhắn và kênh của Workspace này.
                  {isOwner ? " Vì bạn là OWNER, hệ thống sẽ yêu cầu chuyển quyền sở hữu trước khi rời đi." : " Để quay lại, bạn cần được quản trị viên mời lại."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-[4px] h-8 text-xs px-4 whitespace-nowrap"
              onClick={handleLeaveWorkspace}
              disabled={isLeaving}
            >
              {isLeaving ? <Loader2 size={12} className="mr-1 animate-spin" /> : <LogOut size={12} className="mr-1" />}
              Rời ngay lập tức
            </Button>
          </CardContent>
        </Card>

        {isOwner && (
          <>
            <Card className="border border-amber-200 bg-amber-50/30 shadow-none rounded-[4px]">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className="p-2 rounded-[4px] bg-amber-100 text-amber-600 shrink-0 h-fit">
                    <Crown size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-amber-900">Chuyển quyền sở hữu</h3>
                    <p className="text-[11px] text-amber-800/80 leading-normal max-w-md">
                      Chuyển quyền OWNER cho một thành viên khác. Bạn sẽ trở thành ADMIN sau khi hoàn tất.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white font-semibold rounded-[4px] h-8 text-xs px-4 whitespace-nowrap"
                  onClick={() => setIsSelectingSuccessor(true)}
                >
                  <Crown size={12} className="mr-1" />
                  Chuyển quyền
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-red-100/20 shadow-none rounded-[4px]">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className="p-2 rounded-[4px] bg-red-200 text-red-700 shrink-0 h-fit">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-red-900">Giải tán Workspace</h3>
                    <p className="text-[11px] text-red-800/80 leading-normal max-w-md">
                      Toàn bộ dữ liệu, kênh và tin nhắn sẽ bị xóa hoặc lưu trữ.
                      Hành động này <span className="font-bold">không thể hoàn tác</span>.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-[4px] h-8 text-xs px-4 whitespace-nowrap"
                  onClick={handleDissolve}
                >
                  <AlertTriangle size={12} className="mr-1" />
                  Giải tán ngay
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <DissolveWorkspaceModal
        isOpen={isDissolveModalOpen}
        onClose={() => setIsDissolveModalOpen(false)}
        onConfirm={handleConfirmDissolve}
        workspaceName={currentWorkspace?.name || ""}
        isLoading={isDissolving}
        memberCount={totalMemberCount}
        channelCount={totalChannelCount}
      />

      <Dialog open={isSelectingSuccessor} onOpenChange={setIsSelectingSuccessor}>
        <DialogContent className="sm:max-w-md rounded-[4px] p-4 border border-slate-200">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-sm font-bold text-slate-900">Chọn người kế nhiệm</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vui lòng chọn một thành viên từ danh sách dưới đây để chuyển quyền OWNER.
              Sau khi chuyển quyền, bạn sẽ trở thành ADMIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2 no-scrollbar">
              {isLoadingMembers ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách thành viên...</p>
                </div>
              ) : membersError ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-red-500 font-semibold">Không thể tải danh sách thành viên</p>
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Thử lại</Button>
                </div>
              ) : (membersData as any)?.items?.filter((m: any) => m.userId && m.userId !== currentUser?.id).length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-[4px] border border-dashed border-slate-200">
                  <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 font-semibold">Không tìm thấy thành viên nào khác</p>
                </div>
              ) : (
                (membersData as any)?.items
                  ?.filter((m: any) => m.userId && m.userId !== currentUser?.id)
                  .map((member: any) => (
                    <div
                      key={member.userId}
                      onClick={() => {
                        setSelectedSuccessor({
                          userId: member.userId,
                          name: member.user?.name,
                          email: member.user?.email,
                          avatar: member.user?.avatar,
                          role: member.role
                        });
                        setIsSelectingSuccessor(false);
                        setIsTransferModalOpen(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-[4px] hover:bg-slate-100 cursor-pointer border border-slate-200/60 transition-colors group"
                    >
                      <Avatar className="h-9 w-9 rounded-[4px] border border-slate-200">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs rounded-[4px]">
                          {member.user?.name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate leading-normal">{member.user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{member.user?.email}</p>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded-[2px] px-1 py-0 shadow-none">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-[4px] bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:border-slate-300 transition-colors">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WorkspaceCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        ownedItems={cleanupItems}
        members={(membersData as any)?.items?.filter((m: any) => m.userId && m.userId !== currentUser?.id) || []}
        onProcessItem={handleProcessCleanupItem}
        onFinish={handleCleanupFinish}
      />
    </div>
  );
}
