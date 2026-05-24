"use client"

import React, { useState } from 'react'
import { Bell, Check, Loader2, Trash2, ChevronDown, CheckCheck, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useClearReadNotificationsMutation,
} from '@/src/redux/feature/notificationApi'
import { Notification, NotificationType, NOTIFICATION_CATEGORY_MAP, NotificationCategory } from '@/src/type/chat.types'

const TYPE_ICONS: Record<string, string> = {
  NEW_MESSAGE:      '💬',
  MENTION:          '@',
  FRIEND_REQUEST:   '👤',
  FRIEND_ACCEPTED:  '✅',
  GROUP_INVITE:     '👥',
  GROUP_REMOVED:    '🚪',
  WORKSPACE_INVITE: '🏢',
  REACTION:         '❤️',
  SYSTEM:           '⚙️',
  ANNOUNCEMENT:     '📢',
}

const CATEGORY_TABS: { id: NotificationCategory; label: string }[] = [
  { id: 'all',       label: 'Tất cả' },
  { id: 'social',    label: 'Xã hội' },
  { id: 'messaging', label: 'Tin nhắn' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'system',    label: 'Hệ thống' },
]

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all')

  const { data, isLoading } = useGetNotificationsQuery({ limit: 50 }, { skip: !open })
  const { data: unreadData } = useGetUnreadCountQuery()
  const [markAsRead]  = useMarkNotificationAsReadMutation()
  const [markAllRead] = useMarkAllAsReadMutation()
  const [deleteOne]   = useDeleteNotificationMutation()
  const [clearAll]    = useClearAllNotificationsMutation()
  const [clearRead]   = useClearReadNotificationsMutation()

  const allNotifications: Notification[] = data?.notifications || []
  const unreadCount = unreadData?.unreadCount ?? 0

  const filtered = activeCategory === 'all'
    ? allNotifications
    : allNotifications.filter(
        (n) => NOTIFICATION_CATEGORY_MAP[n.type] === activeCategory
      )

  const handleMarkRead = async (id: string) => {
    try { await markAsRead(id).unwrap() } catch {}
  }

  const handleMarkAllRead = async () => {
    try { await markAllRead().unwrap() } catch {}
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await deleteOne(id).unwrap() } catch {}
  }

  const handleClearAll = async () => {
    try { await clearAll().unwrap() } catch {}
  }

  const handleClearRead = async () => {
    try { await clearRead().unwrap() } catch {}
  }

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-md h-8 w-8 border border-border/40 bg-slate-100/60 dark:bg-zinc-900/60">
          <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-3.5 min-w-3.5 px-0.5 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center border border-background font-bold shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 md:w-90 p-0 border border-border/60 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] rounded-lg overflow-hidden bg-popover"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-secondary/15 border-b border-border/60">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-[10px] text-primary font-semibold hover:bg-primary/5 h-6 px-2 py-1 rounded gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Đọc tất cả
              </Button>
            )}
            {allNotifications.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded">
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuItem onClick={handleClearRead} className="cursor-pointer gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                    Xóa đã đọc
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleClearAll}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa tất cả
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const tabUnread = tab.id === 'all'
              ? allNotifications.filter((n) => !n.isRead).length
              : allNotifications.filter(
                  (n) => NOTIFICATION_CATEGORY_MAP[n.type] === tab.id && !n.isRead
                ).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer',
                  activeCategory === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {tab.label}
                {tabUnread > 0 && (
                  <span className={cn(
                    'text-[8px] font-bold px-1 rounded-full leading-none',
                    activeCategory === tab.id
                      ? 'bg-white/30 text-white'
                      : 'bg-red-100 text-red-600'
                  )}>
                    {tabUnread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        <ScrollArea className="h-72 bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-1" />
              <p className="text-xs text-muted-foreground italic">
                {activeCategory === 'all' ? 'Không có thông báo' : 'Không có thông báo trong danh mục này'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  className={cn(
                    'p-2.5 hover:bg-secondary/40 cursor-pointer transition-colors relative flex gap-2.5 items-start group',
                    !notification.isRead ? 'bg-primary/5' : ''
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                    !notification.isRead ? 'bg-primary' : 'bg-transparent'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{TYPE_ICONS[notification.type] || '📌'}</span>
                      <h4 className="font-bold text-xs text-foreground truncate flex-1">
                        {notification.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-[9px] text-muted-foreground/80 mt-1 font-medium">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete button — appears on hover */}
                  <button
                    onClick={(e) => handleDelete(notification.id, e)}
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-all shrink-0"
                    title="Xóa"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 bg-secondary/15 border-t border-border/60 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">
            {filtered.length} thông báo
          </span>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold text-muted-foreground hover:text-foreground h-6 px-2">
            Xem tất cả
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
