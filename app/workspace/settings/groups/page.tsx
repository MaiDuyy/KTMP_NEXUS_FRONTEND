"use client";

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  MoreVertical, 
  Users, 
  Lock, 
  Globe, 
  Calendar, 
  MessageCircle, 
  Edit2, 
  Archive, 
  Trash2,
  Loader2,
  Filter
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { useGetChatsQuery } from '@/src/redux/feature/chatApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function GroupsManagement() {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { data: groupsData, isLoading } = useGetChatsQuery(
    { type: 'group', workspaceId: currentWorkspaceId || '' },
    { skip: !currentWorkspaceId }
  );

  const filteredGroups = groupsData?.chats?.filter((chat: any) => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || (typeFilter === "PUBLIC" && !chat.isPrivate) || (typeFilter === "PRIVATE" && chat.isPrivate);
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhóm Chat</h1>
          <p className="text-slate-500 mt-1">Quản lý các kênh và nhóm thảo luận trong Workspace.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200">
          <Plus size={18} className="mr-2" />
          Tạo nhóm mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm theo tên nhóm..." 
            className="pl-10 h-10 border-slate-200 focus:border-blue-500 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Loại nhóm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="PUBLIC">Công khai</SelectItem>
              <SelectItem value="PRIVATE">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tên nhóm</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Loại</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thành viên</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Người tạo</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày tạo</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tin nhắn cuối</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-sm text-slate-400 mt-2 font-medium">Đang tải danh sách nhóm...</p>
                </td>
              </tr>
            ) : filteredGroups?.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <p className="text-sm text-slate-500 font-medium">Không tìm thấy nhóm nào</p>
                </td>
              </tr>
            ) : (
              filteredGroups?.map((chat: any) => (
                <tr key={chat.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{chat.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">ID: {chat.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {chat.isPrivate ? (
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 font-bold">
                          <Lock size={10} className="mr-1" /> RIÊNG TƯ
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200 font-bold">
                          <Globe size={10} className="mr-1" /> CÔNG KHAI
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-sm font-medium">{chat.participants?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 font-medium">{chat.creator?.name || 'Hệ thống'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(chat.createdAt), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 italic">
                      {chat.lastMessageAt ? format(new Date(chat.lastMessageAt), 'dd/MM HH:mm', { locale: vi }) : 'Chưa có'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-slate-100">
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer">
                          <Users className="w-4 h-4 mr-3 text-slate-600" />
                          <span className="font-medium text-sm">Xem thành viên</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium text-sm">Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer">
                          <Archive className="w-4 h-4 mr-3 text-amber-600" />
                          <span className="font-medium text-sm">Lưu trữ</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg py-2 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="font-bold text-sm">Xóa nhóm</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
