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
  ArchiveRestore, Loader2, Users, MessageSquare, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  PUBLIC: { icon: Hash, color: 'bg-green-100 text-green-700', label: 'Public' },
  PRIVATE: { icon: Lock, color: 'bg-amber-100 text-amber-700', label: 'Private' },
  ANNOUNCEMENT: { icon: Megaphone, color: 'bg-blue-100 text-blue-700', label: 'Announcement' },
};

export function ChannelManagement() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: workspaces = [], isLoading: loadingWorkspaces } = useListWorkspacesQuery();
  const { data: channels = [], isLoading: loadingChannels, refetch } = useListChannelsQuery(
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
      toast.success('Channel deleted');
      setShowDeleteDialog(false);
      setSelectedChannel(null);
    } catch {
      toast.error('Failed to delete channel');
    }
  };

  const handleArchiveToggle = async (channel: Channel) => {
    try {
      if (channel.isArchived) {
        await unarchiveChannel(channel.id).unwrap();
        toast.success('Channel restored');
      } else {
        await archiveChannel(channel.id).unwrap();
        toast.success('Channel archived');
      }
    } catch {
      toast.error('Failed to update channel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace selector + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-[250px] h-10">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map(ws => (
                <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
        <Tabs value={showArchived ? 'all' : 'active'} onValueChange={v => setShowArchived(v === 'all')}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="all">All incl. Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      {!selectedWorkspaceId ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Building2 className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a workspace</p>
          <p className="text-sm">Choose a workspace to manage its channels</p>
        </div>
      ) : loadingChannels ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No channels found
                  </TableCell>
                </TableRow>
              ) : (
                filteredChannels.map(channel => {
                  const typeCfg = TYPE_CONFIG[channel.type] || TYPE_CONFIG.PUBLIC;
                  const TypeIcon = typeCfg.icon;
                  return (
                    <TableRow key={channel.id} className={cn('hover:bg-slate-50/50', channel.isArchived && 'opacity-60')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <TypeIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{channel.name}</p>
                            {channel.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{channel.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs font-medium', typeCfg.color)}>
                          {typeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          {channel._count?.members ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {channel._count?.messages ?? 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(channel.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {channel.isArchived ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 text-xs">Archived</Badge>
                        ) : channel.isDefault ? (
                          <Badge className="bg-blue-100 text-blue-700 text-xs border-none">Default</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-xs border-none">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchiveToggle(channel)}>
                              {channel.isArchived ? (
                                <><ArchiveRestore className="w-4 h-4 mr-2" /> Restore</>
                              ) : (
                                <><Archive className="w-4 h-4 mr-2" /> Archive</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => { setSelectedChannel(channel); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
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

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>#{selectedChannel?.name}</strong>?
              All messages and files will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
