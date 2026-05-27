'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useGetAccountDetailsQuery } from '@/src/redux/feature/accountApi';
import {
  useGetUserDepartmentsQuery,
  useListDepartmentsQuery,
  useInviteDepartmentMemberMutation,
  useUpdateDepartmentMemberMutation,
  useRemoveDepartmentMemberMutation,
  useListDepartmentInvitationsQuery,
} from '@/src/redux/feature/departmentApi';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { useListUsersQuery } from '@/src/redux/feature/adminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Users, GitFork, GitMerge, Layout,
  MessageSquare, Mail, ShieldAlert, Shield, User, UserCheck, Loader2,
  Plus, MoreHorizontal, Edit, Trash2, Send, Clock, CheckCircle2, UserPlus, AlertTriangle,
  TrendingUp, HardDrive, PhoneCall, ArrowUpDown, Filter, Search, Award, Sparkles, FolderOpen
} from 'lucide-react';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setWorkspace } from '@/src/redux/feature/workspaceSlice';
import { toast } from 'sonner';

const ROLE_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  HEAD: {
    label: 'Trưởng phòng',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
  },
  MANAGER: {
    label: 'Phó phòng',
    className: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    icon: <Shield className="w-3.5 h-3.5 text-slate-600" />
  },
  MEMBER: {
    label: 'Thành viên',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: <User className="w-3.5 h-3.5 text-blue-600" />
  },
  GUEST: {
    label: 'Khách',
    className: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    icon: <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
  }
};

export default function MyDepartmentPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Fetch logged in user details
  const { data: accountData, isLoading: isUserLoading } = useGetAccountDetailsQuery();
  const userId = accountData?.user?.id;

  // Fetch user's department memberships
  const { data: userDepts = [], isLoading: isDeptsLoading } = useGetUserDepartmentsQuery(
    userId || '',
    { skip: !userId }
  );

  // Fetch all departments for parents/children names resolution
  const { data: allDepts = [] } = useListDepartmentsQuery();

  // Fetch workspaces list
  const { data: workspaces = [] } = useGetUserWorkspacesQuery();

  const [activeDeptTab, setActiveDeptTab] = useState<string>('');

  // Search & Filter state for Colleagues
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'role'

  // Handle setting default tab when data loads
  useEffect(() => {
    if (userDepts.length > 0 && !activeDeptTab) {
      setActiveDeptTab(userDepts[0].id);
    }
  }, [userDepts, activeDeptTab]);

  const activeDept = userDepts.find(d => d.id === activeDeptTab);

  // Active department manager details
  const manager = activeDept?.members?.find(m => m.role === 'HEAD')?.user || 
                  (activeDept?.managerId ? activeDept.members?.find(m => m.userId === activeDept.managerId)?.user : null);

  // Active department parent
  const parentDept = allDepts.find(d => d.id === activeDept?.parentId);

  // Active department children
  const childDepts = allDepts.filter(d => d.parentId === activeDept?.id);

  // Fetch department specific invitations (if manager)
  const userRoleInActiveDept = activeDept?.userRole; // 'HEAD', 'MANAGER', 'MEMBER', 'GUEST'
  const isDeptManager = userRoleInActiveDept === 'HEAD' || userRoleInActiveDept === 'MANAGER';

  const { data: invitations = [], refetch: refetchInvitations } = useListDepartmentInvitationsQuery(
    activeDept?.id || '',
    { skip: !activeDept?.id || !isDeptManager }
  );

  // Mutations
  const [inviteMember, { isLoading: isInviting }] = useInviteDepartmentMemberMutation();
  const [updateMember, { isLoading: isUpdatingRole }] = useUpdateDepartmentMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveDepartmentMemberMutation();

  // Dialog States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'HEAD' | 'MANAGER' | 'MEMBER' | 'GUEST'>('MEMBER');
  
  // Fetch system users to invite members who don't have a department yet
  const { data: usersData, isLoading: isUsersLoading } = useListUsersQuery({ limit: 1000 }, { skip: !showInviteModal });
  const systemUsers = usersData?.items || [];

  const eligibleUsers = useMemo(() => {
    return systemUsers.filter(u => {
      // 1. Must not have a department
      if (u.department) return false;
      // 2. Must not already be a member of the active department
      const isAlreadyMember = activeDept?.members?.some(m => m.userId === u.id);
      if (isAlreadyMember) return false;
      // 3. Must be active (not suspended)
      if (u.isSuspended) return false;
      return true;
    });
  }, [systemUsers, activeDept]);
  
  const [selectedMember, setSelectedMember] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [targetRole, setTargetRole] = useState<'HEAD' | 'MANAGER' | 'MEMBER' | 'GUEST'>('MEMBER');

  // Workspaces of the active department
  const deptWorkspaces = useMemo(() => {
    if (!activeDept) return [];
    return workspaces.filter(ws => ws.departmentId === activeDept.id);
  }, [workspaces, activeDept]);

  // Dynamic filter colleagues logic
  const filteredMembers = useMemo(() => {
    if (!activeDept?.members) return [];
    let list = [...activeDept.members];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.user?.name.toLowerCase().includes(q) || 
        m.user?.email.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      list = list.filter(m => m.role === roleFilter);
    }

    // Sort logic
    list.sort((a, b) => {
      if (sortBy === 'role') {
        const roleOrder: Record<string, number> = { HEAD: 0, MANAGER: 1, MEMBER: 2, GUEST: 3 };
        const orderA = roleOrder[a.role || 'MEMBER'] ?? 9;
        const orderB = roleOrder[b.role || 'MEMBER'] ?? 9;
        return orderA - orderB;
      }
      // Default: sort by name
      return (a.user?.name || '').localeCompare(b.user?.name || '');
    });

    return list;
  }, [activeDept, searchQuery, roleFilter, sortBy]);

  // Handle navigation to chat workspace
  const handleGoToWorkspace = (workspaceId: string) => {
    dispatch(setWorkspace(workspaceId));
    router.push('/chat');
    toast.success('Đã chuyển sang không gian làm việc của phòng ban');
  };

  const handleStartDirectChat = (partnerUserId: string, name: string) => {
    if (partnerUserId === userId) return;
    router.push('/chat');
    toast.info(`Bắt đầu chat với ${name}`);
  };

  // Invitation handler
  const handleSendInvite = async () => {
    if (!activeDept || !inviteEmail.trim()) return;
    try {
      await inviteMember({
        departmentId: activeDept.id,
        email: inviteEmail.trim(),
        role: inviteRole
      }).unwrap();
      toast.success('Đã gửi thư mời tham gia phòng ban thành công!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      if (isDeptManager) refetchInvitations();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Gửi lời mời thất bại. Vui lòng kiểm tra lại!');
    }
  };

  // Role update handler
  const handleUpdateRole = async () => {
    if (!activeDept || !selectedMember) return;
    try {
      await updateMember({
        departmentId: activeDept.id,
        userId: selectedMember.userId,
        role: targetRole
      }).unwrap();
      toast.success(`Đã cập nhật vai trò của ${selectedMember.name} thành công!`);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Cập nhật vai trò thất bại.');
    }
  };

  // Member removal handler
  const handleRemoveMember = async () => {
    if (!activeDept || !selectedMember) return;
    try {
      await removeMember({
        departmentId: activeDept.id,
        userId: selectedMember.userId
      }).unwrap();
      toast.success(`Đã gỡ ${selectedMember.name} khỏi phòng ban.`);
      setShowRemoveModal(false);
      setSelectedMember(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Gỡ nhân sự thất bại.');
    }
  };

  if (isUserLoading || isDeptsLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-[#121214]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs text-muted-foreground mt-2 font-medium animate-pulse">Đang đồng bộ dữ liệu phòng ban doanh nghiệp...</p>
      </div>
    );
  }

  if (userDepts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-[#121214] p-8 text-center text-xs">
        <Building2 className="w-12 h-12 mb-3 text-slate-350 dark:text-slate-700" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-300">Không tìm thấy phòng ban trực thuộc</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          Tài khoản doanh nghiệp của bạn chưa được liên kết với bất kỳ sơ đồ phòng ban nào. Vui lòng liên hệ với Quản trị hệ thống (System Administrator) để cấu trúc lại sơ đồ tổ chức.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#121214] overflow-y-auto no-scrollbar">
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B]">
        <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-4.5 h-4.5 text-blue-500" />
          <span className="tracking-wide uppercase text-[11px] font-black">SƠ ĐỒ PHÒNG BAN & NHÂN SỰ</span>
        </h1>
        
        {userDepts.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phòng ban:</span>
            <select
              value={activeDeptTab}
              onChange={e => setActiveDeptTab(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {userDepts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeDept && (
        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full text-xs">
          
          {/* Main Info Card */}
          <div className="grid gap-6 md:grid-cols-12">
            
            {/* Left Box: Department details & role */}
            <Card className="md:col-span-8 rounded-xl border border-slate-200/80 dark:border-slate-850/80 shadow-sm bg-gradient-to-br from-white to-slate-50/60 dark:from-[#19191B] dark:to-[#131315]/40 hover:border-blue-500/25 hover:shadow-md transition-all duration-300">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">{activeDept.name}</h2>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold tracking-widest uppercase">Hệ thống cơ cấu doanh nghiệp</p>
                    </div>
                  </div>

                  {userRoleInActiveDept && (
                    <Badge variant="outline" className={`px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 border ${ROLE_CONFIG[userRoleInActiveDept]?.className || ROLE_CONFIG.MEMBER.className}`}>
                      {ROLE_CONFIG[userRoleInActiveDept]?.icon || ROLE_CONFIG.MEMBER.icon}
                      <span>{ROLE_CONFIG[userRoleInActiveDept]?.label || userRoleInActiveDept}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {activeDept.description || 'Không có mô tả chi tiết chức vụ hoạt động của phòng ban này.'}
                </p>

                {/* Quick details */}
                <div className="flex items-center gap-6 text-[11px] text-slate-455 font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-450" />
                    <span className="text-slate-800 dark:text-slate-350 font-bold">{activeDept.members?.length || 0}</span> đồng nghiệp
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-slate-450" />
                    <span className="text-slate-800 dark:text-slate-350 font-bold">{deptWorkspaces.length}</span> Workspace liên kết
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Box: Dept Head info */}
            <Card className="md:col-span-4 rounded-xl border border-slate-200/80 dark:border-slate-850/80 shadow-sm bg-gradient-to-br from-white to-slate-50/60 dark:from-[#19191B] dark:to-[#131315]/40 hover:border-blue-500/25 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trưởng phòng (Head)</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-3">
                {manager ? (
                  <div className="flex flex-col items-center text-center space-y-2.5">
                    <Avatar className="h-14 w-14 border border-amber-500/20 shadow-xs relative">
                      <AvatarImage src={manager.avatar ? getAvatarUrl(manager.avatar) : undefined} />
                      <AvatarFallback className="text-base bg-amber-50 text-amber-700 font-bold">
                        {manager.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" title="Đang trực tuyến" />
                    </Avatar>
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center justify-center gap-1.5">
                        {manager.name}
                        <Badge className="text-[7px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-1 font-bold">HEAD</Badge>
                      </h3>
                      <p className="text-[9px] text-slate-450 flex items-center gap-1 justify-center">
                        <Mail className="w-3 h-3 text-slate-400" /> {manager.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6 text-slate-400">
                    <User className="w-10 h-10 mb-2 text-slate-350 dark:text-slate-700 animate-pulse" />
                    <p className="text-xs italic">Chưa bổ nhiệm Trưởng phòng</p>
                  </div>
                )}

                {manager && manager.id !== userId && (
                  <Button
                    onClick={() => handleStartDirectChat(manager.id, manager.name)}
                    variant="outline"
                    className="w-full h-8 text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer rounded-lg shadow-xs transition-all duration-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-450" /> Liên hệ quản lý
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Org Tree Graph Section (Highly Premium Enterprise Layout) */}
          <Card className="rounded-xl border border-slate-200/80 dark:border-slate-850/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-900/60 bg-slate-50/20 dark:bg-slate-900/10">
              <CardTitle className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 tracking-wider">
                <GitFork className="w-4 h-4 text-blue-500" />
                <span>SƠ ĐỒ HÀNH CHÍNH (DEPT HIERARCHY)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-5">
              <div className="flex flex-col items-center py-2 relative">
                {/* 1. Parent Dept (if exists) */}
                {parentDept && (
                  <div className="flex flex-col items-center group">
                    <div className="px-5 py-2.5 bg-slate-100/65 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-850 rounded-lg text-slate-500 dark:text-slate-400 font-bold max-w-[220px] truncate text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
                      <span className="text-[8px] uppercase tracking-wider block text-slate-450 dark:text-slate-500 font-extrabold mb-0.5">Phòng ban cấp trên</span>
                      {parentDept.name}
                    </div>
                    {/* Visual Connection line */}
                    <div className="w-0.5 h-7 bg-slate-200 dark:bg-slate-800 border-dashed border-l" />
                  </div>
                )}

                {/* 2. Active Department (glowing indicator) */}
                <div className="px-7 py-4 bg-blue-600 dark:bg-blue-600 text-white border border-blue-700 shadow-sm rounded-xl font-bold min-w-[260px] text-center relative z-10 hover:-translate-y-0.5 transition-all duration-300">
                  <span className="text-[8px] uppercase tracking-widest block text-blue-200 font-extrabold mb-0.5">Đơn vị quản lý của bạn</span>
                  <div className="text-xs font-black flex items-center justify-center gap-1.5 uppercase">
                    {activeDept.name}
                  </div>
                  {manager && (
                    <div className="flex items-center justify-center gap-1 mt-1.5 text-[9px] text-blue-100 font-semibold bg-blue-700/45 px-2 py-0.5 rounded-full w-max mx-auto border border-blue-500/20">
                      <Award className="w-3 h-3 text-amber-300" />
                      <span>Trưởng phòng: {manager.name}</span>
                    </div>
                  )}
                </div>

                {/* 3. Children (if exist) */}
                {childDepts.length > 0 && (
                  <div className="flex flex-col items-center w-full">
                    {/* Visual Connection line from active down */}
                    <div className="w-0.5 h-7 bg-slate-200 dark:bg-slate-800 border-dashed border-l" />
                    
                    {/* Horizontal link bar */}
                    {childDepts.length > 1 && (
                      <div className="h-0.5 bg-slate-200 dark:bg-slate-850 w-[70%] border-t border-dashed relative -top-0.5" />
                    )}

                    {/* Children grid */}
                    <div className="grid gap-4 mt-2.5 justify-center w-full" style={{ gridTemplateColumns: `repeat(${Math.min(childDepts.length, 3)}, minmax(160px, 220px))` }}>
                      {childDepts.map(child => (
                        <div key={child.id} className="flex flex-col items-center group">
                          {childDepts.length > 1 && (
                            <div className="w-0.5 h-3.5 bg-slate-200 dark:bg-slate-800 border-dashed border-l" />
                          )}
                          <div className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-350 font-bold text-center truncate shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-350 dark:hover:border-slate-700">
                            <span className="text-[8px] uppercase tracking-wider block text-slate-450 dark:text-slate-500 font-extrabold mb-0.5">Phòng ban trực thuộc</span>
                            {child.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members & Associated Workspaces Tabs (Linear/GitHub style flat design) */}
          <Tabs defaultValue="members" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-0 gap-3">
              <TabsList className="bg-transparent border-none p-0 rounded-none h-auto self-start flex gap-6">
                <TabsTrigger 
                  value="members" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1 text-[11px] font-bold text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 transition-all cursor-pointer flex items-center"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Đồng nghiệp ({activeDept.members?.length || 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="workspaces" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1 text-[11px] font-bold text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 transition-all cursor-pointer flex items-center"
                >
                  <Layout className="w-3.5 h-3.5 mr-1.5" /> Không gian làm việc ({deptWorkspaces.length})
                </TabsTrigger>
                {isDeptManager && (
                  <TabsTrigger 
                    value="invitations" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1 text-[11px] font-bold text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 transition-all cursor-pointer flex items-center"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Thư mời ({invitations.filter(i => i.status === 'PENDING').length})
                  </TabsTrigger>
                )}
              </TabsList>

              {isDeptManager && (
                <Button
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="h-7.5 text-[10px] rounded-lg px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition-all active:scale-[0.98] cursor-pointer shadow-xs self-start mb-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mời thành viên mới
                </Button>
              )}
            </div>

            {/* Members Tab with Search and Filtering */}
            <TabsContent value="members" className="pt-4 space-y-4">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
                  <Input
                    placeholder="Tìm đồng nghiệp..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8.5 h-8 text-[11px] rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 border-slate-200 dark:border-slate-800 bg-transparent"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vai trò:</span>
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="text-[11px] font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">Tất cả</option>
                      <option value="HEAD">Trưởng phòng</option>
                      <option value="MANAGER">Phó phòng</option>
                      <option value="MEMBER">Thành viên</option>
                      <option value="GUEST">Khách</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="text-[11px] font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="name">Tên (A-Z)</option>
                      <option value="role">Cấp bậc</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Members Grid (Premium Cards with Status Indicators) */}
              {filteredMembers.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-card rounded-xl text-center text-slate-450">
                  <Users className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="font-semibold text-slate-650">Không tìm thấy nhân sự phù hợp</p>
                  <p className="text-[10px] mt-0.5">Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {filteredMembers.map(m => {
                    const u = m.user;
                    if (!u) return null;
                    const mRole = m.role || 'MEMBER';
                    const conf = ROLE_CONFIG[mRole] || ROLE_CONFIG.MEMBER;
                    
                    // Contextual actions validation (HEAD/MANAGER vs members)
                    const canManageThisUser = isDeptManager && u.id !== userId && (
                      userRoleInActiveDept === 'HEAD' || (userRoleInActiveDept === 'MANAGER' && mRole !== 'HEAD' && mRole !== 'MANAGER')
                    );

                    // Mock presence status for colleagues (all active in corporate chat system)
                    const isOnline = u.id !== 'mock-offline-id';

                    return (
                      <Card key={m.id} className="group rounded-xl border border-slate-200/60 dark:border-slate-850/60 bg-gradient-to-br from-white to-slate-50/50 dark:from-[#19191B] dark:to-[#131315]/30 p-3.5 flex items-center justify-between hover:border-blue-500/25 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar className="h-9 w-9 border border-slate-200/60 shrink-0 shadow-xs">
                              <AvatarImage src={u.avatar ? getAvatarUrl(u.avatar) : undefined} />
                              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-700 font-bold">
                                {u.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span 
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-slate-350 dark:bg-slate-650'}`}
                              title={isOnline ? "Trực tuyến" : "Ngoại tuyến"} 
                            />
                          </div>
                          
                          <div className="min-w-0 text-left space-y-0.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5 pr-1">
                              <span>{u.name}</span>
                              {mRole !== 'MEMBER' && (
                                <Badge variant="outline" className={`text-[7px] font-extrabold px-1 py-0 rounded flex items-center gap-0.5 border ${conf.className}`}>
                                  {conf.icon}
                                  <span>{mRole}</span>
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {u.id !== userId && (
                            <Button
                              onClick={() => handleStartDirectChat(u.id, u.name)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-blue-500 transition-colors"
                              title="Chat trực tiếp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {canManageThisUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs w-40 rounded-lg">
                                <DropdownMenuLabel className="text-[9px] font-bold text-muted-foreground uppercase px-2.5 py-1.5 tracking-wider">Quản lý vai trò</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedMember({ userId: u.id, name: u.name, role: mRole });
                                    setTargetRole(mRole as any);
                                    setShowRoleModal(true);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-2 text-slate-400" /> Thay đổi vai trò
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600 dark:focus:text-rose-500 cursor-pointer"
                                  onClick={() => {
                                    setSelectedMember({ userId: u.id, name: u.name, role: mRole });
                                    setShowRemoveModal(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Gỡ khỏi phòng ban
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Workspaces Tab (with Collaboration Avatar Stacks) */}
            <TabsContent value="workspaces" className="pt-4">
              {deptWorkspaces.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-card rounded-xl text-center text-slate-450">
                  <Layout className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="font-semibold text-slate-650">Chưa có không gian làm việc nào liên kết</p>
                  <p className="text-[10px] mt-0.5">Các workspace được cấu hình đồng bộ gắn với phòng ban này sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {deptWorkspaces.map(ws => (
                    <Card key={ws.id} className="rounded-xl border border-slate-200/60 dark:border-slate-850/60 bg-gradient-to-br from-white to-slate-50/60 dark:from-[#19191B] dark:to-[#131315]/40 p-4.5 hover:shadow-md hover:border-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-40">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 rounded-lg border border-slate-200/60 shrink-0 shadow-xs">
                            <AvatarImage src={ws.icon ? getAvatarUrl(ws.icon) : undefined} className="object-cover" />
                            <AvatarFallback className="bg-blue-600 text-white text-xs font-black rounded-lg">
                              {ws.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 text-left space-y-0.5">
                            <h4 className="font-extrabold text-slate-850 dark:text-slate-100 truncate uppercase pr-1 text-xs">{ws.name}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate leading-relaxed">{ws.description || 'Không có mô tả chi tiết.'}</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[7px] font-extrabold py-0 px-1.5 rounded-sm shrink-0">WORKSPACE</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-900/60 mt-3">
                        {/* Avatar stack for collaborative workspace members */}
                        <div className="flex items-center">
                          <div className="flex -space-x-2.5 overflow-hidden">
                            <Avatar className="inline-block h-5 w-5 rounded-full border border-card ring-0 shadow-xs">
                              <AvatarFallback className="text-[7px] bg-slate-100 font-bold">A</AvatarFallback>
                            </Avatar>
                            <Avatar className="inline-block h-5 w-5 rounded-full border border-card ring-0 shadow-xs">
                              <AvatarFallback className="text-[7px] bg-blue-50 text-blue-600 font-bold">B</AvatarFallback>
                            </Avatar>
                            <Avatar className="inline-block h-5 w-5 rounded-full border border-card ring-0 shadow-xs">
                              <AvatarFallback className="text-[7px] bg-emerald-50 text-emerald-600 font-bold">C</AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1.5 font-semibold">+{activeDept.members?.length || 3} thành viên</span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleGoToWorkspace(ws.id)}
                          className="h-7 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] cursor-pointer shrink-0 transition-all duration-200"
                        >
                          Truy cập không gian
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Invitations Tab (For Managers only) */}
            {isDeptManager && (
              <TabsContent value="invitations" className="pt-4">
                {invitations.length === 0 ? (
                  <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-card rounded-xl text-center text-slate-450">
                    <Send className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="font-semibold text-slate-650">Chưa gửi lời mời nào</p>
                    <p className="text-[10px] mt-0.5">Sử dụng nút &quot;Mời thành viên mới&quot; ở trên để bắt đầu thêm đồng nghiệp qua email.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {invitations.map(invite => {
                      const inviteConf = ROLE_CONFIG[invite.role] || ROLE_CONFIG.MEMBER;
                      
                      return (
                        <Card key={invite.id} className="rounded-xl border border-slate-200/60 dark:border-slate-850/60 bg-gradient-to-br from-white to-slate-50/60 dark:from-[#19191B] dark:to-[#131315]/40 p-3.5 hover:shadow-xs transition-all flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 shrink-0">
                              <Send className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 text-left space-y-0.5">
                              <h4 className="font-bold text-slate-850 dark:text-slate-100 truncate pr-1 flex items-center gap-1.5">
                                <span>{invite.invitedEmail}</span>
                                <Badge variant="outline" className={`text-[7px] font-extrabold px-1 py-0 rounded flex items-center gap-0.5 border ${inviteConf.className}`}>
                                  {inviteConf.icon}
                                  <span>{invite.role}</span>
                                </Badge>
                              </h4>
                              <p className="text-[9px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-450" />
                                <span>Gửi lúc: {new Date(invite.createdAt).toLocaleString('vi-VN')}</span>
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {invite.status === 'PENDING' ? (
                              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[8px] px-2 py-0.5 rounded-full font-bold">
                                Chờ chấp nhận
                              </Badge>
                            ) : invite.status === 'ACCEPTED' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đã tham gia
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border border-zinc-500/20 text-[8px] px-2 py-0.5 rounded-full font-bold">
                                {invite.status}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="rounded-xl max-w-sm border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <UserPlus className="w-4.5 h-4.5 text-blue-500" />
              Mời thành viên mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mời nhân viên hiện tại trong hệ thống (chưa có phòng ban) tham gia phòng ban này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1 text-left">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn nhân sự chưa có phòng ban</Label>
              {isUsersLoading ? (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Đang tải danh sách nhân sự...</span>
                </div>
              ) : eligibleUsers.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium leading-normal flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Hệ thống không còn nhân viên nào chưa có phòng ban.</span>
                </div>
              ) : (
                <Select value={inviteEmail} onValueChange={(val) => setInviteEmail(val)}>
                  <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                    <SelectValue placeholder="Chọn một nhân sự..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {eligibleUsers.map((u) => (
                      <SelectItem key={u.id} value={u.email} className="text-xs cursor-pointer">
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</span>
                          <span className="text-[10px] text-slate-400">{u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1 text-left">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vai trò trong phòng ban</Label>
              <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                  <SelectValue placeholder="Chọn vai trò..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {userRoleInActiveDept === 'HEAD' && (
                    <SelectItem value="MANAGER" className="text-xs cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>Phó phòng (MANAGER)</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="MEMBER" className="text-xs cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Thành viên (MEMBER)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GUEST" className="text-xs cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Khách (GUEST)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowInviteModal(false)} className="h-8 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              size="sm"
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim() || isInviting}
              className="h-8 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {isInviting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Gửi lời mời
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="rounded-xl max-w-sm border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Edit className="w-4.5 h-4.5 text-blue-500" />
              Thay đổi vai trò nhân sự
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bổ nhiệm hoặc điều chỉnh quyền của <strong className="text-slate-850 dark:text-slate-200">{selectedMember?.name}</strong> trong phòng ban này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vai trò bổ nhiệm mới</Label>
              <Select value={targetRole} onValueChange={(val: any) => setTargetRole(val)}>
                <SelectTrigger className="w-full h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-card">
                  <SelectValue placeholder="Chọn vai trò..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {userRoleInActiveDept === 'HEAD' && (
                    <>
                      <SelectItem value="HEAD" className="text-xs cursor-pointer text-amber-600 font-bold">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chuyển nhượng Trưởng phòng (HEAD)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER" className="text-xs cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          <span>Phó phòng (MANAGER)</span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                  <SelectItem value="MEMBER" className="text-xs cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Thành viên (MEMBER)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GUEST" className="text-xs cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Khách (GUEST)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {targetRole === 'HEAD' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  <strong>Cảnh báo cực kỳ quan trọng:</strong> Chuyển nhượng quyền Trưởng phòng sẽ hạ cấp tài khoản của bạn xuống thành viên thường và chuyển giao toàn quyền quản lý tối cao của phòng ban này cho đồng nghiệp được chọn!
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowRoleModal(false)} className="h-8 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              size="sm"
              onClick={handleUpdateRole}
              disabled={isUpdatingRole}
              className={`h-8 text-xs rounded-lg font-semibold cursor-pointer ${targetRole === 'HEAD' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isUpdatingRole && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Xác nhận thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent className="rounded-xl max-w-sm border-slate-200 dark:border-slate-800 bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4.5 h-4.5" />
              Gỡ nhân sự khỏi phòng ban
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 text-left">
              Bạn có chắc chắn muốn gỡ đồng nghiệp <strong className="text-slate-850 dark:text-slate-200">{selectedMember?.name}</strong> khỏi phòng ban <strong className="text-slate-800 dark:text-slate-200">{activeDept?.name || ''}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-left">
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Nhân sự bị gỡ sẽ mất toàn bộ quyền truy cập vào các không gian làm việc (Workspaces) và tài liệu nội bộ liên kết với phòng ban này. Hành động này không xóa tài khoản người dùng khỏi hệ thống chính.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowRemoveModal(false)} className="h-8 text-xs rounded-lg cursor-pointer">Hủy</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="h-8 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
            >
              {isRemoving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Xác nhận gỡ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
