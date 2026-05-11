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
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <Bell className="h-5 w-5 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-950 font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="end" sideOffset={12}>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-primary font-bold hover:bg-primary/5"
            >
              <Check className="w-3 h-3 mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="h-96 bg-white dark:bg-slate-950">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="h-12 w-12 text-slate-200 mb-2" />
              <p className="text-sm text-slate-500">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-900">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  className={cn(
                    "p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors relative",
                    !notification.isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 shrink-0",
                      !notification.isRead ? "bg-primary" : "bg-transparent"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{TYPE_ICONS[notification.type] || '📌'}</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {notification.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-slate-500">
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
