'use client';

import { useState } from 'react';
import { useSendBroadcastMutation } from '@/src/redux/feature/adminApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Megaphone, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BroadcastDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BroadcastDialog({ open, onOpenChange }: BroadcastDialogProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('ANNOUNCEMENT');
    
    const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
            return;
        }

        try {
            await sendBroadcast({ title, body, type }).unwrap();
            toast.success('Thông báo đã được gửi tới toàn bộ hệ thống!');
            setTitle('');
            setBody('');
            onOpenChange(false);
        } catch (error) {
            toast.error('Không thể gửi thông báo. Vui lòng thử lại sau.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Megaphone className="w-6 h-6 text-primary" />
                        Gửi thông báo toàn hệ thống
                    </DialogTitle>
                    <DialogDescription>
                        Thông báo này sẽ được gửi tới <strong>tất cả người dùng</strong> trong hệ thống theo thời gian thực.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Loại thông báo</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANNOUNCEMENT">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-500" />
                                        Thông báo chung
                                    </div>
                                </SelectItem>
                                <SelectItem value="MAINTENANCE">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-amber-500" />
                                        Bảo trì hệ thống
                                    </div>
                                </SelectItem>
                                <SelectItem value="ALERT">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        Cảnh báo khẩn cấp
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Tiêu đề</Label>
                        <Input
                            id="title"
                            placeholder="VD: Cập nhật tính năng mới..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Nội dung</Label>
                        <Textarea
                            id="body"
                            placeholder="Nhập nội dung thông báo chi tiết tại đây..."
                            className="min-h-[120px] resize-none"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Gửi ngay lập tức
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
