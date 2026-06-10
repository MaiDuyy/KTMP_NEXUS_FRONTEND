'use client';

import { useState } from 'react';
import {
  useListWorkspacesQuery,
  useListChannelsQuery,
  useDeleteChannelMutation,
  useArchiveChannelMutation,
  useUnarchiveChannelMutation,
  Channel,
} from '@/src/redux/feature/channelApi';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Hash, Lock, Megaphone, Search, MoreHorizontal, Trash2, Archive,
  ArchiveRestore, Loader2, Users, MessageSquare, Building2, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  PUBLIC: { icon: Hash, color: 'bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30', label: 'Công khai' },
  PRIVATE: { icon: Lock, color: 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30', label: 'Riêng tư' },
  ANNOUNCEMENT: { icon: Megaphone, color: 'bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30', label: 'Thông báo' },
};

export function ChannelManagement() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: workspaces = [], isLoading: loadingWorkspaces } = useListWorkspacesQuery();
  const { data: channels = [], isLoading: loadingChannels } = useListChannelsQuery(
    { workspaceId: selectedWorkspaceId, includeArchived: true },
    { skip: !selectedWorkspaceId }
  );

  const [deleteChannel, { isLoading: isDeleting }] = useDeleteChannelMutation();
  const [archiveChannel] = useArchiveChannelMutation();
  const [unarchiveChannel] = useUnarchiveChannelMutation();

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived || !ch.isArchived;
    return matchesSearch && matchesArchive;
  });

  const handleDelete = async () => {
    if (!selectedChannel) return;
    try {
      await deleteChannel(selectedChannel.id).unwrap();
      toast.success('Đã xóa kênh thành công');
      setShowDeleteDialog(false);
      setSelectedChannel(null);
    } catch {
      toast.error('Xóa kênh thất bại');
    }
  };

  const handleArchiveToggle = async (channel: Channel) => {
    try {
      if (channel.isArchived) {
        await unarchiveChannel(channel.id).unwrap();
        toast.success('Đã khôi phục kênh');
      } else {
        await archiveChannel(channel.id).unwrap();
        toast.success('Đã lưu trữ kênh');
      }
    } catch {
      toast.error('Cập nhật kênh thất bại');
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs rounded-lg border-border">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
              <SelectValue placeholder="Chọn workspace..." />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {workspaces.map(ws => (
                <SelectItem key={ws.id} value={ws.id} className="text-xs">{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm kênh chat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={!selectedWorkspaceId}
              className="pl-8 h-8 text-xs rounded-lg bg-transparent border-border focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
        {selectedWorkspaceId && (
          <Tabs value={showArchived ? 'all' : 'active'} onValueChange={v => setShowArchived(v === 'all')}>
            <div className="bg-slate-100/60 dark:bg-slate-800/60 p-0.5 rounded-lg w-fit">
              <TabsList className="bg-transparent h-7 gap-0.5 p-0">
                <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-3 h-6 text-[11px] font-semibold">
                  Đang hoạt động
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-3 h-6 text-[11px] font-semibold">
                  Tất cả các kênh
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedWorkspaceId ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl bg-card text-muted-foreground">
          <Building2 className="w-8 h-8 mb-2 text-slate-350 dark:text-slate-750" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Chọn một Không gian làm việc</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Vui lòng chọn workspace từ thanh bộ lọc để bắt đầu quản lý các kênh chat</p>
        </div>
      ) : loadingChannels ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
          <p className="text-[11px] text-muted-foreground animate-pulse">Đang tải danh sách kênh chat...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Tên Kênh</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[110px]">Loại kênh</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[100px]">Thành viên</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[100px]">Số tin nhắn</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Ngày tạo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[110px]">Trạng thái</TableHead>
                <TableHead className="w-[48px] py-2 px-3 h-auto"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    Không tìm thấy kênh chat nào trong không gian này
                  </TableCell>
                </TableRow>
              ) : (
                filteredChannels.map(channel => {
                  const typeCfg = TYPE_CONFIG[channel.type] || TYPE_CONFIG.PUBLIC;
                  const TypeIcon = typeCfg.icon;
                  return (
                    <TableRow key={channel.id} className={cn('hover:bg-slate-50/40 dark:hover:bg-slate-800/40 border-b border-border/50 last:border-0 transition-opacity', channel.isArchived && 'opacity-50')}>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <TypeIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                              {channel.name}
                            </p>
                            {channel.description && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[220px] mt-0.5">{channel.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shadow-none', typeCfg.color)}>
                          {typeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{channel._count?.members ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{channel._count?.messages ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                        {format(new Date(channel.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {channel.isArchived ? (
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded-md border-border/80">
                            Đã lưu trữ
                          </Badge>
                        ) : channel.isDefault ? (
                          <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-[10px] px-1.5 py-0.5 rounded-md shadow-none font-semibold">
                            Mặc định
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30 text-[10px] px-1.5 py-0.5 rounded-md shadow-none font-semibold">
                            Hoạt động
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                              <MoreHorizontal className="h-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Tác vụ</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/60" />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleArchiveToggle(channel)}>
                              {channel.isArchived ? (
                                <><ArchiveRestore className="w-3.5 h-3.5 mr-2 text-slate-400" /> Khôi phục kênh</>
                              ) : (
                                <><Archive className="w-3.5 h-3.5 mr-2 text-slate-400" /> Lưu trữ kênh</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/60" />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 dark:focus:text-red-500 cursor-pointer"
                              onClick={() => { setSelectedChannel(channel); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa vĩnh viễn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-xl max-w-sm border-border bg-card text-xs">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Xóa kênh chat
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn có chắc chắn muốn xóa kênh <strong>#{selectedChannel?.name}</strong>?
              Mọi tin nhắn và tệp tin phương tiện gửi trong kênh này sẽ bị <strong>xóa vĩnh viễn</strong>, không thể hoàn tác.
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
