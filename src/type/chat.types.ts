// src/type/chat.types.ts
// Types cho Chat, Message, Friend, Notification

import { User } from "./auth.types";

// ===== Friend Types =====
export interface Friend {
  friendshipId: string;
  id: string;
  name: string;
  avatar?: string | null;
  status?: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
  createdAt: string;
  birthDate? : string ;
}

export interface FriendRequest {
  id: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string | null;
    status?: string | null;
    isOnline?: boolean;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string | null;
    status?: string | null;
    isOnline?: boolean;
  };
  createdAt: string;
}

export interface SearchUser {
  id: string;
  name: string;
  avatar?: string | null;
  status?: string | null;
  isOnline?: boolean;
  relation: "none" | "friend" | "request_sent" | "request_received" | "blocked";
  requestId?: string;
  email?:string;
  location?: string; 
  birthDate? : string;
}

export interface BlockedUser {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  blockedAt: string;
}

// ===== Chat Types =====
export type ChatParticipantRole = "CHANNEL_OWNER" | "CHANNEL_MODERATOR" | "CHANNEL_MEMBER" | "CHANNEL_GUEST";
export type JoinPolicy = "PUBLIC" | "PRIVATE" | "APPROVAL";

export interface ChatParticipant {
  participantId?: string;
  accountId: string;
  name?: string | null;
  avatar?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  userStatus?: string | null;
  role?: ChatParticipantRole;
  account?: {
      id: string;
      name: string;
      avatar: string | null;
  };
}

export interface PinnedMessage {
  id: string;
  content: string;
  senderName: string;
  senderAvatar?: string | null;
  pinnedBy: string;
  pinnedByName: string;
  pinnedAt: string;
  type: string;
}

export interface JoinRequest {
  id: string;
  chatId: string;
  accountId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  account?: {
      id: string;
      name: string;
      avatar: string | null;
  };
}

export interface Chat {
  id: string;
  workspaceId?: string | null;
  name?: string | null;
  avatar?: string | null;
  isGroup: boolean;
  isBlocked: boolean;
  isBlockedByMe: boolean;
  isFriend: boolean;
  pin: boolean;
  notify: boolean;
  readed: boolean;
  isReadOnly: boolean;
  participants: ChatParticipant[];
  participantCount: number;
  lastMessage?: {
    id: string;
    content?: string | null;
    type: string;
    time: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string;
  joinPolicy?: JoinPolicy;
  joinRequests?: JoinRequest[];
  pinnedMessages?: PinnedMessage[];
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface TaskAssignee {
  id: string;
  taskId: string;
  accountId: string;
  account?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface Task {
  id: string;
  chatId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  deadlineAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  assignees: TaskAssignee[];
}

export interface ChatDetails extends Chat {
  myRole?: ChatParticipantRole;
  createdAt: string;
}

// ===== Message Types =====
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "sticker"
  | "gif"
  | "location"
  | "contact"
  | "system"
  | "call_started"
  | "call_participant_joined"
  | "call_participant_left"
  | "call_ended"
  | "call_missed"
  | "call_declined"
  | "call_cancelled"
  | "poll"
  | "task";
  

export interface MessageReaction {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
}

export interface Message {
  id: string;
  content?: string | null;
  type: MessageType;
  time: string;
  pin: boolean;
  senderId?: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string;
  };
  replyTo?: {
    id: string;
    content?: string | null;
    type: string;
    sender: {
      id: string;
      name: string;
      avatar?: string | null;
      role?: string;
    };
  } | null;
  file?: {
    name: string;
    size: string;
    type: string;
  } | null;
  reactions: MessageReaction[];
  destroy?: boolean;
  isMe: boolean;
  createdAt?: string;
}

export interface SendMessageRequest {
  content?: string;
  type?: MessageType;
  replyToId?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

// ===== Notification Types =====
export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "NEW_MESSAGE"
  | "GROUP_INVITE"
  | "GROUP_REMOVED"
  | "WORKSPACE_INVITE"
  | "MENTION"
  | "REACTION"
  | "SYSTEM"
  | "ANNOUNCEMENT";

/** Enterprise classification — maps to UI category tabs */
export type NotificationCategory =
  | "all"
  | "social"      // FRIEND_REQUEST, FRIEND_ACCEPTED, REACTION
  | "messaging"   // NEW_MESSAGE, MENTION
  | "workspace"   // GROUP_INVITE, GROUP_REMOVED, WORKSPACE_INVITE
  | "system";     // SYSTEM, ANNOUNCEMENT

export const NOTIFICATION_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
  FRIEND_REQUEST: "social",
  FRIEND_ACCEPTED: "social",
  REACTION: "social",
  NEW_MESSAGE: "messaging",
  MENTION: "messaging",
  GROUP_INVITE: "workspace",
  GROUP_REMOVED: "workspace",
  WORKSPACE_INVITE: "workspace",
  SYSTEM: "system",
  ANNOUNCEMENT: "system",
};

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

// ===== API Response Types =====
export interface FriendsListResponse {
  friends: Friend[];
}

export interface FriendRequestsResponse {
  requests: FriendRequest[];
}

export interface SearchUsersResponse {
  users: SearchUser[];
}

export interface ChatsResponse {
  chats: Chat[];
}

export interface ChatDetailsResponse {
  chat: ChatDetails;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor?: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  nextCursor?: string | null;
}

// ===== Socket Event Types =====
export interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
}

export interface MessageReadEvent {
  chatId: string;
  userId: string;
  workspaceId?: string;
}

export interface UserOnlineEvent {
  userId: string;
  userName?: string;
  lastSeen?: string;
}

export interface MessageReactedEvent {
  messageId: string;
  chatId: string;
  userId: string;
  userName: string;
  emoji: string;
  action: "added" | "removed" | "changed";
  count?: number;
}
