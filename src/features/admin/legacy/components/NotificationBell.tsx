"use client"

import React, { useState } from 'react'
import { Bell, Check, Loader2, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
} from '@/src/redux/feature/notificationApi'
import { Notification } from '@/src/type/chat.types'

const TYPE_ICONS: Record<string, string> = {
  MESSAGE: '💬',
  MENTION: '@',
  FRIEND_REQUEST: '👤',
  GROUP_INVITE: '👥',
  SYSTEM: '⚙️',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useGetNotificationsQuery({ limit: 20 }, { skip: !open })
  const { data: unreadData } = useGetUnreadCountQuery()
  const [markAsRead] = useMarkNotificationAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()

  const notifications = data?.notifications || []
  const unreadCount = unreadData?.unreadCount ?? 0

  const handleMarkRead = async (id: string) => {
    try { await markAsRead(id).unwrap() } catch {}
  }

  const handleMarkAllRead = async () => {
    try { await markAllAsRead().unwrap() } catch {}
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
      <PopoverContent className="w-80 md:w-90 p-0 border border-border/60 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] rounded-lg overflow-hidden bg-popover" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 bg-secondary/15 border-b border-border/60">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-[10px] text-primary font-semibold hover:bg-primary/5 h-6 px-2 py-1 rounded"
            >
              <Check className="w-3 h-3 mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="h-80 bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-1" />
              <p className="text-xs text-muted-foreground italic">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  className={cn(
                    "p-2.5 hover:bg-secondary/40 cursor-pointer transition-colors relative flex gap-2.5 items-start",
                    !notification.isRead ? "bg-primary/5" : ""
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    !notification.isRead ? "bg-primary" : "bg-transparent"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{TYPE_ICONS[notification.type] || '📌'}</span>
                      <h4 className="font-bold text-xs text-foreground truncate">
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 bg-secondary/15 border-t border-border/60 text-center">
          <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground h-7">
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
