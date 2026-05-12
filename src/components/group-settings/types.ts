// types.ts
export interface Participant {
    id: string;
    accountId?: string;
    userId?: string;
    isAdmin?: boolean;
    account?: { id: string; name: string; avatar: string | null };
    role: string;
    name?: string;
    avatar?: string | null;
}

export interface GroupSettingsPanelProps {
    chatId: string;
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
    onMessageClick?: (messageId: string) => void;
}

export type TabKey = "members" | "tasks" | "pinned" | "media" | "settings" | "invite";