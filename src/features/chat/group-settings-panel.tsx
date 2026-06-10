"use client";

import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// API hooks
import {
    useGetChatByIdQuery,
    useUpdateChatMutation,
    useAddMembersMutation,
    useRemoveChatMemberMutation,
    useDeleteChatMutation,
    useLeaveChatMutation,
    useUpdateChatMemberRoleMutation,
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskStatusMutation,
    useApproveJoinRequestMutation,
    useDeleteTaskMutation,
} from "@/src/redux/feature/chatApi";
import { useUploadGroupAvatarMutation } from "@/src/redux/feature/uploadApi";
import {
    useGetMediaMessagesQuery,
    useGetPinnedMessagesQuery,
} from "@/src/redux/feature/messageApi";
import { useSearchDirectoryQuery } from "@/src/redux/feature/userApi";

// Components
import { GroupSettingsSidebar } from "../../components/group-settings/GroupSettingsSidebar";
import { GroupSettingsHeader } from "../../components/group-settings/GroupSettingsHeader";
import { MembersTab } from "../../components/group-settings/tabs/MembersTab";
import { TasksTab } from "../../components/group-settings/tabs/TasksTab";
import { PinnedTab } from "../../components/group-settings/tabs/PinnedTab";
import { MediaTab } from "../../components/group-settings/tabs/MediaTab";
import { SettingsTab } from "../../components/group-settings/tabs/SettingsTab";
import { InviteTab } from "../../components/group-settings/tabs/InviteTab";
import { AddMemberDialog } from "../../components/group-settings/dialogs/AddMemberDialog";
import { AddTaskDialog } from "../../components/group-settings/dialogs/AddTaskDialog";
import { RemoveMemberDialog } from "../../components/group-settings/dialogs/RemoveMemberDialog.tsx";
import { LeaveGroupDialog } from "../../components/group-settings/dialogs/LeaveGroupDialog";
import { DeleteGroupDialog } from "../../components/group-settings/dialogs/DeleteGroupDialog";
import { TransferLeadershipDialog } from "../../components/group-settings/dialogs/TransferLeadershipDialog.tsx";

// Types & utils
import { GroupSettingsPanelProps, Participant, TabKey } from "../../components/group-settings/types";
import { getInitials, avatarColor } from "../../components/group-settings/shared/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { useSelector } from "react-redux";
import { RootState } from "@/src/redux/store";
export default function GroupSettingsPanel({
    chatId,
    isOpen,
    onClose,
    currentUserId,
    onMessageClick,
}: GroupSettingsPanelProps) {
    const router = useRouter();

    // UI State
    const [activeTab, setActiveTab] = useState<TabKey>("members");
    const [isEditingName, setIsEditingName] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [directorySearch, setDirectorySearch] = useState("");
    const [debouncedDirectorySearch, setDebouncedDirectorySearch] = useState("");
    const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "file">("all");
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Dialog states
    const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
    const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
    const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
    const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
    const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);

    // Feature states
    const [memberToRemove, setMemberToRemove] = useState<Participant | null>(null);
    const [selectedSuccessor, setSelectedSuccessor] = useState<string | null>(null);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskStartTime, setTaskStartTime] = useState("");
    const [taskDeadline, setTaskDeadline] = useState("");
    const [selectedTaskAssignees, setSelectedTaskAssignees] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // API Queries
    const { data: chatData, isLoading: chatLoading, refetch } = useGetChatByIdQuery(chatId, {
        skip: !isOpen || !chatId,
    });

    const chat = chatData?.chat;
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
        const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
    const { data: mediaData } = useGetMediaMessagesQuery(
        { chatId, type: mediaFilter },
        { skip: !isOpen || !chatId }
    );

    const { data: directoryData, isLoading: directoryLoading } = useSearchDirectoryQuery({ searchTerm: debouncedSearch, workspaceId: currentWorkspaceId || undefined }, {
            // skip: debouncedSearch.length < 2,
        });

 
    const { data: pinnedData } = useGetPinnedMessagesQuery(chatId, { skip: !isOpen || !chatId });
    const { data: taskData, isLoading: tasksLoading } = useGetTasksQuery(chatId, { skip: !isOpen || !chatId });

    // API Mutations
    const [updateChat] = useUpdateChatMutation();
    const [addMembers, { isLoading: isAddingMembers }] = useAddMembersMutation();
    const [removeMember, { isLoading: isRemovingMember }] = useRemoveChatMemberMutation();
    const [deleteChat, { isLoading: isDeleting }] = useDeleteChatMutation();
    const [leaveChat, { isLoading: isLeaving }] = useLeaveChatMutation();
    const [updateMemberRole] = useUpdateChatMemberRoleMutation();
    const [uploadGroupAvatar] = useUploadGroupAvatarMutation();
    const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
    const [updateTaskStatus] = useUpdateTaskStatusMutation();
    const [deleteTask] = useDeleteTaskMutation();
    const [approveJoinRequest] = useApproveJoinRequestMutation();

    // Derived data
    const participants: Participant[] = (chat?.participants || []) as Participant[];
    const tasks = taskData?.tasks || [];
    const mediaMessages = mediaData?.media || [];
    const pinnedMessages = pinnedData?.pinnedMessages || [];
    const directoryUsers = directoryData?.users || [];

    const myRole = chat?.myRole;
    const isLeader = myRole === "CHANNEL_OWNER";
    const isAdmin = isLeader || myRole === "CHANNEL_MODERATOR";

    const getMemberId = (p: Participant) => p.userId || p.accountId || p.account?.id;
    const getMemberName = (p: Participant) => p.account?.name || p.name || "Người dùng";
    const getMemberAvatar = (p: Participant) => p.account?.avatar || p.avatar;
    const existingMemberIds = participants.map(getMemberId).filter(Boolean);
    const availableDirectoryUsers = directoryUsers.filter(
            (u: any) => !existingMemberIds.includes(u.id) && u.id !== currentUserId
        );

    const doneTasks = tasks.filter((t: any) => t.status === "DONE").length;
    const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;

    // Effects
    // useEffect(() => {
    //     const t = setTimeout(() => setDebouncedDirectorySearch(directorySearch), 300);
    //     return () => clearTimeout(t);
    // }, [directorySearch]);

        useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedSearch(directorySearch);
            }, 300);
            return () => clearTimeout(timer);
        }, [directorySearch]);

    useEffect(() => {
        if (chat?.name) setNewGroupName(chat.name);
    }, [chat]);

    // Listen to real-time events (join requests, membership changes, etc.)
    useEffect(() => {
        const handleJoinRequestEvent = (e: any) => {
            const data = e.detail;
            if (data.chatId === chatId) {
                console.log("[GroupSettingsPanel] 🔄 Join request event received, refetching chat details...");
                refetch();
            }
        };

        const handleMemberUpdatedEvent = (e: any) => {
            const data = e.detail;
            if (data.chatId === chatId) {
                console.log("[GroupSettingsPanel] 👥 Member updated event received, refetching...");
                refetch();
                
                // Show premium Toast notifications (Sonner)
                if (data.action === "joined") {
                    toast.success("Thành viên mới vừa gia nhập nhóm! 🎉", {
                        description: "Danh sách và số lượng thành viên đã được cập nhật tự động.",
                        duration: 4000,
                    });
                } else if (data.action === "removed") {
                    toast.info("Một thành viên đã rời hoặc bị xóa khỏi nhóm. 🚪", {
                        description: "Danh sách thành viên đã được cập nhật.",
                        duration: 4000,
                    });
                }
            }
        };

        const handleGeneralUpdateEvent = (e: any) => {
            const data = e.detail;
            if (data.chatId === chatId) {
                console.log("[GroupSettingsPanel] 🔄 Chat updated/role updated event received, refetching...");
                refetch();
            }
        };

        window.addEventListener("chat:join_request:new", handleJoinRequestEvent);
        window.addEventListener("chat:join_request:updated", handleJoinRequestEvent);
        window.addEventListener("chat:member_updated", handleMemberUpdatedEvent);
        window.addEventListener("chat:role_updated", handleGeneralUpdateEvent);
        window.addEventListener("chat:updated", handleGeneralUpdateEvent);

        return () => {
            window.removeEventListener("chat:join_request:new", handleJoinRequestEvent);
            window.removeEventListener("chat:join_request:updated", handleJoinRequestEvent);
            window.removeEventListener("chat:member_updated", handleMemberUpdatedEvent);
            window.removeEventListener("chat:role_updated", handleGeneralUpdateEvent);
            window.removeEventListener("chat:updated", handleGeneralUpdateEvent);
        };
    }, [chatId, refetch]);

    // Handlers
    const handleUpdateName = async () => {
        if (!newGroupName.trim()) return toast.error("Tên nhóm không được để trống");
        try {
            await updateChat({ chatId, name: newGroupName.trim() }).unwrap();
            toast.success("Đã cập nhật tên nhóm");
            setIsEditingName(false);
            refetch();
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi cập nhật tên nhóm");
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("chatId", chatId);
            const res = await uploadGroupAvatar(fd).unwrap();
            await updateChat({ chatId, avatar: res.url }).unwrap();
            toast.success("Đã cập nhật ảnh nhóm");
            refetch();
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi tải ảnh lên");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAddMembers = async () => {
        if (selectedFriends.length === 0) return toast.error("Vui lòng chọn ít nhất 1 người");
        try {
            await addMembers({ chatId, memberIds: selectedFriends }).unwrap();
            toast.success(`Đã thêm ${selectedFriends.length} thành viên`);
            setShowAddMemberDialog(false);
            setSelectedFriends([]);
            refetch();
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi thêm thành viên");
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            await removeMember({ chatId, memberId: getMemberId(memberToRemove) as string }).unwrap();
            toast.success(`Đã xóa ${getMemberName(memberToRemove)}`);
            setShowRemoveMemberDialog(false);
            setMemberToRemove(null);
            refetch();
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi xóa thành viên");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveChat(chatId).unwrap();
            toast.success("Đã rời nhóm");
            onClose();
            router.replace("/chat");
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi rời nhóm");
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await deleteChat(chatId).unwrap();
            toast.success("Đã giải tán nhóm");
            onClose();
            router.replace("/chat");
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi giải tán");
        }
    };

    const handleUpdateRole = async (memberId: string, role: string) => {
        try {
            await updateMemberRole({ chatId, memberId, role }).unwrap();
            toast.success("Đã cập nhật vai trò");
            refetch();
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi cập nhật vai trò");
        }
    };

    const handleCreateTask = async () => {
        if (!taskTitle.trim()) return toast.error("Vui lòng nhập tiêu đề");
        
        const start = taskStartTime ? new Date(taskStartTime) : null;
        const deadline = taskDeadline ? new Date(taskDeadline) : null;
        if (start && deadline && start >= deadline) {
            return toast.error("Thời gian bắt đầu phải trước thời gian kết thúc!");
        }

        try {
            await createTask({
                chatId,
                title: taskTitle,
                startAt: taskStartTime || undefined,
                deadlineAt: taskDeadline || undefined,
                assigneeIds: selectedTaskAssignees,
            }).unwrap();
            toast.success("Đã tạo kế hoạch");
            setShowAddTaskDialog(false);
            setTaskTitle("");
            setTaskStartTime("");
            setTaskDeadline("");
            setSelectedTaskAssignees([]);
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi tạo kế hoạch");
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, status: string) => {
        try {
            await updateTaskStatus({ taskId, status, chatId }).unwrap();
            toast.success("Đã cập nhật trạng thái");
        } catch {
            toast.error("Lỗi cập nhật trạng thái");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTask({ taskId, chatId }).unwrap();
            toast.success("Đã xóa kế hoạch");
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi xóa kế hoạch");
        }
    };

    const handleUpdateJoinPolicy = async (policy: string) => {
        try {
            await updateChat({ chatId, joinPolicy: policy }).unwrap();
            toast.success("Đã cập nhật chính sách");
            refetch();
        } catch {
            toast.error("Lỗi cập nhật chính sách");
        }
    };

    const handleUpdateReadOnly = async (isReadOnly: boolean) => {
        try {
            await updateChat({ chatId, isReadOnly }).unwrap();
            toast.success(isReadOnly ? "Đã bật chế độ Chỉ đọc" : "Đã tắt chế độ Chỉ đọc");
            refetch();
        } catch {
            toast.error("Lỗi cập nhật chế độ kênh");
        }
    };

    const handleApproveJoin = async (targetId: string, approve: boolean) => {
        try {
            await approveJoinRequest({ chatId, targetAccountId: targetId, approve }).unwrap();
            toast.success("Đã xử lý yêu cầu");
            refetch();
        } catch {
            toast.error("Lỗi thực hiện yêu cầu");
        }
    };

    const handleInitiateLeaveGroup = () => {
        if (isLeader && participants.length > 1) {
            setShowTransferDialog(true);
        } else {
            setShowLeaveGroupDialog(true);
        }
    };

    const handleTransferAndLeave = async () => {
        if (!selectedSuccessor) return toast.error("Vui lòng chọn người kế nhiệm");
        try {
            await updateMemberRole({ chatId, memberId: selectedSuccessor, role: "CHANNEL_OWNER" }).unwrap();
            await leaveChat(chatId).unwrap();
            toast.success("Đã chuyển quyền và rời nhóm");
            onClose();
            router.replace("/chat");
        } catch (e: any) {
            toast.error(e?.data?.message || "Lỗi chuyển quyền");
        }
    };

    if (!isOpen) return null;

    const topbarConfig: Record<TabKey, { title: string; action?: () => void; actionLabel?: string }> = {
        members: { title: "Thành viên", action: isAdmin ? () => setShowAddMemberDialog(true) : undefined, actionLabel: "Thêm thành viên" },
        tasks: { title: "Kế hoạch", action: isAdmin ? () => setShowAddTaskDialog(true) : undefined, actionLabel: "Tạo kế hoạch" },
        pinned: { title: "Tin nhắn ghim" },
        media: { title: "File & Media" },
        settings: { title: "Cài đặt nhóm" },
        invite: { title: "Chia sẻ nhóm" },
    };

    const currentTab = topbarConfig[activeTab];

    // Common props for tabs
    const tabProps = {
        chatId,
        participants,
        tasks,
        pinnedMessages,
        mediaMessages,
        mediaFilter,
        setMediaFilter,
        memberSearch,
        setMemberSearch,
        currentUserId,
        isAdmin,
        isLeader,
        getMemberId,
        getMemberName,
        handleUpdateRole,
        handleUpdateTaskStatus,
        handleDeleteTask,
        handleUpdateJoinPolicy,
        handleUpdateReadOnly,
        handleApproveJoin,
        onMessageClick,
        setMemberToRemove,
        setShowRemoveMemberDialog,
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className={cn(
                    "w-1/2 flex flex-col bg-white border-l border-slate-200 shadow-2xl p-0",
                    "sm:max-w-none sm:w-[540px] md:w-[700px] lg:w-[900px]"
                )}
            >
                {chatLoading ? (
                    <div className="flex-1 flex items-center justify-center w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="flex h-full overflow-hidden w-full">
                        {/* Sidebar */}
                        <GroupSettingsSidebar
                            chat={chat}
                            participantsCount={participants.length}
                            tasksCount={tasks.length}
                            pinnedCount={pinnedMessages.length}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isAdmin={isAdmin}
                            isLeader={isLeader}
                            isEditingName={isEditingName}
                            setIsEditingName={setIsEditingName}
                            newGroupName={newGroupName}
                            setNewGroupName={setNewGroupName}
                            handleUpdateName={handleUpdateName}
                            fileInputRef={fileInputRef}
                            handleAvatarUpload={handleAvatarUpload}
                            isUploadingAvatar={isUploadingAvatar}
                            onLeaveGroup={handleInitiateLeaveGroup}
                            onDeleteGroup={() => setShowDeleteGroupDialog(true)}
                        />

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <GroupSettingsHeader
                                title={currentTab.title}
                                action={currentTab.action}
                                actionLabel={currentTab.actionLabel}
                            />

                            <div className="flex-1 overflow-auto p-5">
                                {activeTab === "members" && <MembersTab {...tabProps} chat={chat} />}
                                {activeTab === "tasks" && <TasksTab {...tabProps} tasksLoading={tasksLoading} doneTasks={doneTasks} inProgressTasks={inProgressTasks} />}
                                {activeTab === "pinned" && <PinnedTab {...tabProps} />}
                                {activeTab === "media" && <MediaTab {...tabProps} />}
                                {activeTab === "invite" && (
                                    <InviteTab 
                                        chat={chat} 
                                        handleApproveJoin={handleApproveJoin}
                                    />
                                )}
                                {activeTab === "settings" && <SettingsTab {...tabProps} chat={chat} onLeaveGroup={handleInitiateLeaveGroup} onDeleteGroup={() => setShowDeleteGroupDialog(true)} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                <AddMemberDialog
                    open={showAddMemberDialog}
                    onOpenChange={setShowAddMemberDialog}
                    directorySearch={directorySearch}
                    setDirectorySearch={setDirectorySearch}
                    availableDirectoryUsers={availableDirectoryUsers}
                    directoryLoading={directoryLoading}
                    selectedFriends={selectedFriends}
                    setSelectedFriends={setSelectedFriends}
                    onAddMembers={handleAddMembers}
                    isAddingMembers={isAddingMembers}
                />

                <AddTaskDialog
                    open={showAddTaskDialog}
                    onOpenChange={setShowAddTaskDialog}
                    taskTitle={taskTitle}
                    setTaskTitle={setTaskTitle}
                    taskStartTime={taskStartTime}
                    setTaskStartTime={setTaskStartTime}
                    taskDeadline={taskDeadline}
                    setTaskDeadline={setTaskDeadline}
                    selectedTaskAssignees={selectedTaskAssignees}
                    setSelectedTaskAssignees={setSelectedTaskAssignees}
                    participants={participants}
                    getMemberId={getMemberId}
                    getMemberName={getMemberName}
                    onCreateTask={handleCreateTask}
                    isCreatingTask={isCreatingTask}
                />

                <RemoveMemberDialog
                    open={showRemoveMemberDialog}
                    onOpenChange={setShowRemoveMemberDialog}
                    memberToRemove={memberToRemove}
                    getMemberName={getMemberName}
                    onConfirm={handleRemoveMember}
                    isRemoving={isRemovingMember}
                />

                <LeaveGroupDialog
                    open={showLeaveGroupDialog}
                    onOpenChange={setShowLeaveGroupDialog}
                    groupName={chat?.name || ""}
                    onConfirm={handleLeaveGroup}
                    isLoading={isLeaving}
                />

                <DeleteGroupDialog
                    open={showDeleteGroupDialog}
                    onOpenChange={setShowDeleteGroupDialog}
                    onConfirm={handleDeleteGroup}
                    isLoading={isDeleting}
                />

                <TransferLeadershipDialog
                    open={showTransferDialog}
                    onOpenChange={setShowTransferDialog}
                    participants={participants}
                    currentUserId={currentUserId}
                    getMemberId={getMemberId}
                    getMemberName={getMemberName}
                    selectedSuccessor={selectedSuccessor}
                    setSelectedSuccessor={setSelectedSuccessor}
                    onConfirm={handleTransferAndLeave}
                    // isUpdating={false}
                    // isLoading={isTransferring}
                    isLoading={false}
                    groupName={chat?.name || ""}
                    getInitials={getInitials}
                    getMemberAvatar={getMemberAvatar}
                />
            </SheetContent>
        </Sheet>
    );
}