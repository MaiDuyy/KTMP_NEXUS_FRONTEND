"use client"

import React, { useState } from 'react'
import {
  useListInvitationsQuery,
  useInviteUserMutation,
  useResendInvitationMutation,
  useCancelInvitationMutation,
} from '@/src/redux/feature/adminApi'
import { InviteDialog } from '@/src/features/admin/InviteDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Mail, 
    RefreshCcw, 
    Trash2, 
    Send,
    Search,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', icon: Clock },
  ACCEPTED: { label: 'Đã chấp nhận', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', icon: CheckCircle2 },
  EXPIRED: { label: 'Hết hạn', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: Trash2 },
}

export function LegacyInvitationManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: invitationsData, isLoading } = useListInvitationsQuery();
  const [resendInvitation] = useResendInvitationMutation();
  const [cancelInvitation] = useCancelInvitationMutation();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const invitations = invitationsData?.invitations || [];
  
  const filteredInvitations = invitations.filter(inv => 
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý lời mời</h2>
          <p className="text-sm text-slate-500">Gửi và quản lý lời mời tham gia tổ chức</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowInviteDialog(true)}
        >
          <Send className="w-4 h-4 mr-2" />
          Gửi lời mời mới
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                    placeholder="Tìm kiếm theo email..."
                    className="pl-10 h-10 border-slate-200 dark:border-slate-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Người mời</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/20" />
                  </TableRow>
                ))
              ) : filteredInvitations.length > 0 ? (
                filteredInvitations.map((inv) => {
                  const status = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {inv.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {inv.role?.toLowerCase() || 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border-none font-medium flex items-center w-fit gap-1.5`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {inv.inviterName || inv.invitedBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'PENDING' && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600"
                                onClick={() => resendInvitation(inv.id)}
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600"
                            onClick={() => cancelInvitation(inv.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                    Không có lời mời nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <InviteDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog} 
      />
    </div>
  )
}
