import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search, Phone, Video, Info, Paperclip, Smile, Mic, Send,
  Sparkles, Bold, Italic, Link2, List as ListIcon, Reply, X,
  Loader2, ImageIcon, File, Ban, Hash, Lock, BarChart3, Pin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useGetChatByIdQuery, useMarkChatAsReadMutation, useGetChatReadReceiptsQuery } from '@/src/redux/feature/chatApi';
import { useGetMessagesQuery, useLazyGetMessagesQuery, useSendMessageMutation } from '@/src/redux/feature/messageApi';
import { useGetChannelQuery } from '@/src/redux/feature/channelApi';
import { socketService } from '@/src/services/socket.service';
import {
  useRealtimeChat, useChatRoom, useTypingUsers, useIsUserOnline,
} from '@/src/hooks/useRealtimeChat';
import { Message } from '@/src/type/chat.types';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import MessageBubble from './message-bubble';
import EmojiPicker from './emoji-picker';
import ChatInfoPanel from './chat-info-panel';
import GroupSettingsPanel from './group-settings-panel';
import { ChannelInfoPanel } from './channel-info-panel';
import CreatePollModal from './CreatePollModal';
import { toast } from 'sonner';
import { useUploadChatMediaMutation } from '@/src/redux/feature/uploadApi';
import { messageApi } from '@/src/redux/feature/messageApi';
import { AIAssistantPanel } from './AIAssistantPanel';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { useRouter } from 'next/navigation';
import { MentionSelector } from './mention-selector';
import FriendProfileSheet from './friend-profile-sheet';
import { useLazyGetUserByIdQuery } from '@/src/redux/feature/userApi';
import { PinnedBanner } from './pinned-banner';
import { PinnedMessagesPanel } from './pinned-messages-panel';
import { SearchMessagesPanel } from './search-messages-panel';
import { useTogglePinMessageMutation } from '@/src/redux/feature/messageApi';
import { apiSlice } from '@/src/redux/api/baseApi';

export const ModernChatArea: React.FC<{ chatId?: string }> = ({ chatId }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const isFirstRenderOfChat = useRef(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCall, setActiveCall] = useState<{ roomName: string; isVideo: boolean; callerName: string; callerAvatar?: string } | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);

  // ──────── Mention system state ────────
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const [activeMentions, setActiveMentions] = useState<{ id: string; name: string }[]>([]);

  // ──────── Profile sheet state ────────
  const [profileUser, setProfileUser] = useState<any>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [triggerGetUser] = useLazyGetUserByIdQuery();

  // ──────── AI Assistant Panel state ────────
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiInitialQuery, setAIInitialQuery] = useState<string | undefined>(undefined);

  const openAIPanel = (query?: string) => {
    setAIInitialQuery(query);
    setShowAIPanel(true);
  };

  const closeAIPanel = () => {
    setShowAIPanel(false);
    setAIInitialQuery(undefined);
  };
  // ──────────────────────────────────────────
  const user = useSelector((state: any) => state.auth?.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const userPermissions = useSelector((state: any) => state.auth?.permissions || []);
  const isAdmin = userPermissions.includes('CHAT.READ.ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingMore = useRef(false);

  // Socket context
  const { isConnected } = useRealtimeChat();
  const typingUsers = useTypingUsers(chatId || '');

  // Join chat room for real-time events
  useChatRoom(chatId);

  // API - skip if no chatId
  const { data: chatData, isLoading: chatLoading } = useGetChatByIdQuery(chatId!, { skip: !chatId });
  const chat = chatData?.chat;

  // ──────── Permissions & Read-only Check ────────
  const canPost = useMemo(() => {
    if (!chat) return true;
    if (!chat.isReadOnly) return true;
    
    // In read-only mode, check user's role
    const myParticipant = chat.participants?.find(p => p.accountId === user?.id);
    const myRole = myParticipant?.role;
    
    const privilegedRoles = ['CHANNEL_OWNER', 'CHANNEL_MODERATOR'];
    
    // Check Workspace Admin/Owner role from permissions or state if possible
    // For now, prioritize Channel Owner/Moderator
    if (privilegedRoles.includes(myRole as any)) return true;
    if (isAdmin) return true; // Global/Workspace admins
    
    return false;
  }, [chat, user?.id, isAdmin]);

  const isBlocked = useMemo(() => chat?.isBlocked || false, [chat]);

  // Detect if current chat is a Workspace Channel
  const { data: channelData } = useGetChannelQuery(chatId!, { skip: !chatId });
  const isChannel = !!channelData;

  const canUseBroadcastMentions = useMemo(() => {
    if (!chat) return true;
    if (!chat.isGroup) return false;

    const myParticipant = chat.participants?.find(p => p.accountId === user?.id);
    const myRole = myParticipant?.role;

    let isPublicOrLarge = false;
    if (isChannel && channelData) {
      if (channelData.type === 'PUBLIC' || channelData.type === 'ANNOUNCEMENT') {
        isPublicOrLarge = true;
      }
    }

    const participantCount = chat.participants?.length || 0;
    if (participantCount >= 50) {
      isPublicOrLarge = true;
    }

    const isGuest = myRole === 'CHANNEL_GUEST';
    const isAdminOrMod = myRole && ['CHANNEL_OWNER', 'CHANNEL_MODERATOR'].includes(myRole);
    const hasAdminPrivilege = isAdminOrMod || isAdmin;

    if (isPublicOrLarge) {
      return !!hasAdminPrivilege;
    } else {
      return !isGuest;
    }
  }, [chat, user?.id, isChannel, channelData, isAdmin]);

  const [triggerGetMessages, { isFetching }] = useLazyGetMessagesQuery();
  const { data: readReceipts } = useGetChatReadReceiptsQuery(chatId!, { skip: !chatId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [togglePinMessage] = useTogglePinMessageMutation();
  const [uploadChatMedia] = useUploadChatMediaMutation();
  const isDirectMessage = !chat?.isGroup;

  // Find partner for online status (enrichChatDetails already set chat.name/avatar)
  const partner = isDirectMessage
    ? chat?.participants?.find((p) => p.accountId !== user?.id) || chat?.participants?.[0]
    : null;

  const partnerId = partner?.accountId;
  const isPartnerOnline = useIsUserOnline(partnerId);

  // chat.name & chat.avatar already enriched by transformResponse in chatApi.ts
  const chatName = chat?.name || 'Loading...';
  const chatAvatar = chat?.avatar;

  // Scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      if (isFirstRenderOfChat.current) {
        // Temporarily disable smooth scroll for instant initial jump
        chatContainerRef.current.style.scrollBehavior = 'auto';
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        // Restore scroll behavior in next frame
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.style.scrollBehavior = '';
          }
        }, 50);
        isFirstRenderOfChat.current = false;
      } else {
        // Smooth scroll for subsequent active messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Initial Load & Chat Change
  useEffect(() => {
    if (!chatId) return;

    setAllMessages([]);
    setNextCursor(null);
    setHasMore(true);
    setIsInitialLoad(true);
    isFirstRenderOfChat.current = true;

    const loadInitialMessages = async () => {
      try {
        const result = await triggerGetMessages({ chatId, limit: 50 }).unwrap();
        setAllMessages(result.messages);
        setNextCursor(result.nextCursor || null);
        setHasMore(!!result.nextCursor);

        setIsInitialLoad(false);
        // Wait for render then scroll
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (err) {
        console.error("Failed to load initial messages:", err);
        setIsInitialLoad(false);
      }
    };

    loadInitialMessages();
  }, [chatId, triggerGetMessages]);

  // Load More logic
  const loadMoreMessages = async () => {
    if (!chatId || !hasMore || isFetching || isFetchingMore.current) return;

    isFetchingMore.current = true;

    // 1. Capture height before update
    const container = chatContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    try {
      const result = await triggerGetMessages({
        chatId,
        cursor: nextCursor as string,
        limit: 50
      }).unwrap();

      if (result.messages.length > 0) {
        setAllMessages(prev => [...result.messages, ...prev]);
        setNextCursor(result.nextCursor || null);
        setHasMore(!!result.nextCursor);

        // 2. Adjust scroll position after render
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
          isFetchingMore.current = false;
        }, 0);
      } else {
        setHasMore(false);
        isFetchingMore.current = false;
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
      isFetchingMore.current = false;
    }
  };

  // Intersection Observer to detect scroll to top
  useEffect(() => {
    if (isInitialLoad || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMessages();
        }
      },
      { threshold: 0.5, root: chatContainerRef.current }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [nextCursor, hasMore, isInitialLoad, chatId]);

  // Listen for new messages from socket/mutation - prepend to local state
  // We need to sync with the real-time messages too
  useEffect(() => {
    const handleNewMessage = (e: any) => {
      const newMessage = e.detail;
      if (newMessage.chatId === chatId) {
        setAllMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Auto scroll for new messages if user is near bottom
        const container = chatContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
          if (isNearBottom) {
            setTimeout(scrollToBottom, 50);
          }
        }
      }
    };

    const handleMessageRecalled = (e: any) => {
      const { chatId: targetChatId, messageId } = e.detail;
      if (targetChatId === chatId) {
        setAllMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, content: 'Tin nhắn đã bị thu hồi', destroy: true, pin: false } : m
        ));
        // Also refresh chat metadata in case this was a pinned message
        dispatch(apiSlice.util.invalidateTags([{ type: 'Chats', id: chatId }]));
      }
    };

    const handleMessageReacted = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        setAllMessages(prev => prev.map(m => {
          if (m.id !== data.messageId) return m;

          let newReactions = JSON.parse(JSON.stringify(m.reactions || []));
          const existReaction = newReactions.find((r: any) => r.emoji === data.emoji);

          if (data.action === "added" || data.action === "changed" || !data.action) {
            if (existReaction) {
              const users = existReaction.users || [];
              if (!users.some((u: any) => u.id === data.userId)) {
                users.push({ id: data.userId, name: data.userName || "User" });
              }
              // Use total count from server for absolute accuracy in spam mode
              if (data.count !== undefined) {
                existReaction.count = data.count;
              } else {
                existReaction.count += 1;
              }
              existReaction.users = users;
            } else {
              newReactions.push({
                emoji: data.emoji,
                count: data.count || 1,
                users: [{ id: data.userId, name: data.userName || "User" }],
              });
            }
          } else if (data.action === "removed") {
            if (existReaction) {
              const users = (existReaction.users || []).filter((u: any) => u.id !== data.userId);
              if (data.count !== undefined) {
                existReaction.count = data.count;
                existReaction.users = users;
                if (existReaction.count <= 0) {
                    newReactions = newReactions.filter((r: any) => r.emoji !== data.emoji);
                }
              } else {
                if (users.length === 0) {
                    newReactions = newReactions.filter((r: any) => r.emoji !== data.emoji);
                } else {
                    existReaction.users = users;
                    existReaction.count = users.length;
                }
              }
            }
          }
          return { ...m, reactions: newReactions };
        }));
      }
    };

    const handleMessagePinned = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        setAllMessages(prev => prev.map(m =>
          m.id === data.messageId ? { ...m, pin: data.pin } : m
        ));
        
        // Refetch chat data to update pinnedMessages list in Chat object
        dispatch(messageApi.util.invalidateTags([{ type: 'Chats', id: chatId }]));
      }
    };

    const handleMessageRead = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        // MessageBubble handles seen status via RTK Query readReceipts.
        // We'll invalidate the receipts to force a refresh in the bubbles.
        dispatch(messageApi.util.invalidateTags([{ type: 'ReadReceipts', id: chatId }]));
      }
    };

    window.addEventListener('chat:new_message', handleNewMessage);
    window.addEventListener('chat:message_recalled', handleMessageRecalled);
    window.addEventListener('chat:message_reacted', handleMessageReacted);
    window.addEventListener('chat:message_pinned', handleMessagePinned);
    window.addEventListener('chat:message_read', handleMessageRead);

    return () => {
      window.removeEventListener('chat:new_message', handleNewMessage);
      window.removeEventListener('chat:message_recalled', handleMessageRecalled);
      window.removeEventListener('chat:message_reacted', handleMessageReacted);
      window.removeEventListener('chat:message_pinned', handleMessagePinned);
      window.removeEventListener('chat:message_read', handleMessageRead);
    };
  }, [chatId, dispatch]);

  const startCall = (video: boolean) => {
    if (!chatId) return;
    // Fire global event — GlobalCallSystem handles ws-gateway signaling
    window.dispatchEvent(
      new CustomEvent("open-call-modal", {
        detail: {
          chatId,
          isVideo: video,
          chatName,
          chatAvatar,
          targetUserId: isDirectMessage ? partnerId : undefined,
          callType: isDirectMessage ? "private" : "group",
        },
      })
    );
  };

  const groupedMessages = useMemo(() => {
    return allMessages.reduce<{ date: string; messages: Message[] }[]>((groups, message) => {
      const messageDate = new Date(message.time || message.createdAt || Date.now());
      let dateLabel = format(messageDate, "dd/MM/yyyy");

      if (isToday(messageDate)) {
        dateLabel = "Hôm nay";
      } else if (isYesterday(messageDate)) {
        dateLabel = "Hôm qua";
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateLabel) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date: dateLabel, messages: [message] });
      }
      return groups;
    }, []);
  }, [allMessages]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} quá lớn (tối đa 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);

      // Show preview for images
      if (type === "image" && validFiles[0].type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(validFiles[0]);
      } else {
        setFilePreview(null);
      }
    }

    // Reset input
    e.target.value = "";
  };

  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setFilePreview(null);
  };

  // Send file message
  const handleSendFile = async () => {
    if (selectedFiles.length === 0 || !user || !chatId) return;

    setIsUploading(true);

    try {
      const file = selectedFiles[0];

      // Use FormData as required by uploadChatMedia
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", chatId);

      await uploadChatMedia(formData).unwrap();

      // NOTE: Do NOT call socketService.sendMessage() here!
      // The file-service publishes a NATS event (CHAT_FILE_UPLOADED) after upload,
      // and the chat-service's file subscriber automatically creates the message.
      // Sending via socket would create a DUPLICATE message.

      clearSelectedFiles();
      toast.success("Gửi file thành công!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Lỗi upload file");
    } finally {
      setIsUploading(false);
    }
  };
  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    if (!isTypingRef.current && chatId) {
      isTypingRef.current = true;
      socketService.startTyping(chatId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (chatId) socketService.stopTyping(chatId);
    }, 1500);

    // Mention detection
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      // Check if @ is at start of line or preceded by a space
      const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : ' ';
      const isWordStart = charBeforeAt === ' ' || charBeforeAt === '\n';

      if (isWordStart) {
        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        // Check if there's a space after @ or if it's too long
        if (!query.includes(' ') && query.length < 20) {
          setMentionQuery(query);
          setMentionPosition({ start: lastAtSymbol, end: selectionStart });
        } else {
          setMentionQuery(null);
        }
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }

    // Cleanup active mentions that are no longer in the text
    if (activeMentions.length > 0) {
      setActiveMentions(prev => prev.filter(m => value.includes(`@${m.name}`)));
    }
  };

  const handleMentionSelect = (participant: any) => {
    if (!mentionPosition || !inputRef.current) return;

    const before = inputText.substring(0, mentionPosition.start);
    const after = inputText.substring(mentionPosition.end);
    
    let insertion = '';
    if (participant.type === 'special') {
      insertion = `@${participant.name} `;
    } else {
      const displayName = participant.name || participant.account?.name || 'User';
      insertion = `@${displayName} `;
      
      // Track this mention for conversion on send
      setActiveMentions(prev => {
        if (prev.find(m => m.id === participant.accountId)) return prev;
        return [...prev, { id: participant.accountId, name: displayName }];
      });
    }

    const newText = before + insertion + after;
    setInputText(newText);
    setMentionQuery(null);
    setMentionPosition(null);

    // Refocus and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = mentionPosition.start + insertion.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Send message via REST API (chat-service saves to DB + publishes NATS → WS Gateway broadcasts)
  const handleSend = async () => {
    if (!inputText.trim() || !chatId || !user) return;
    
    let content = inputText.trim();

    // Professional conversion: @Name -> @[Name](ID)
    if (activeMentions.length > 0) {
      // Sort by length descending to match longest names first (e.g. "@John Doe" before "@John")
      const sortedMentions = [...activeMentions].sort((a, b) => b.name.length - a.name.length);
      
      sortedMentions.forEach(m => {
        const mentionTag = `@${m.name}`;
        // Create a regex to find @Name but avoid double-converting
        // We look for @Name that is not followed by (id)
        const escapedName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}(?!\\(${m.id}\\))`, 'g');
        content = content.replace(regex, `@[${m.name}](${m.id})`);
      });
    }

    // Clear active mentions for next message
    setActiveMentions([]);

    // ── /ai slash command interception ──
    const AI_PREFIX_RE = /^\/ai\s+/i;
    if (AI_PREFIX_RE.test(content)) {
      const query = content.replace(AI_PREFIX_RE, '').trim();
      setInputText('');
      openAIPanel(query);
      return;
    }
    // ────────────────────────────────────

    setInputText('');
    setReplyTo(null);
    // Stop typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.stopTyping(chatId);
    }

    try {
      const result = await sendMessage({
        chatId,
        data: { content, type: 'text', replyToId: replyTo?.id, },
      }).unwrap();

      // Add to local state immediately if successful (Optimistic/UI update)
      if (result.message) {
        setAllMessages(prev => {
          if (prev.find(m => m.id === result.message.id)) return prev;
          return [...prev, { ...result.message, isMe: true }];
        });

        // Use auto scroll for local update to be snappy
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 50);
      }
    } catch (err) {
      console.error('[ModernChatArea] Failed to send message:', err);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    if (!chatId) return;
    try {
      await togglePinMessage({ messageId, chatId }).unwrap();
      toast.success("Đã cập nhật trạng thái ghim");
    } catch (err: any) {
      toast.error(err?.data?.message || "Lỗi khi ghim tin nhắn");
    }
  };

  const handleJumpToMessage = (messageId: string) => {
    // Find the message in the current list
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-blue-50/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-blue-50/50');
      }, 2000);
    } else {
      toast.info("Tin nhắn đang nằm ở phần hội thoại cũ, vui lòng cuộn lên để tìm.");
    }
  };

  // Handle mark as read
  const [markAsRead] = useMarkChatAsReadMutation();
  useEffect(() => {
    if (chatId) {
      markAsRead(chatId as string);
      socketService.markRead(chatId as string);

      // Check if there's an active call in this chat
      socketService.checkCallStatus(chatId);
    }
  }, [chatId, allMessages.length, markAsRead]);

  useEffect(() => {
    const handleCallStatus = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        if (data.isActive) {
          setActiveCall({ 
            roomName: data.roomName, 
            isVideo: data.isVideo, 
            callerName: data.callerName,
            callerAvatar: data.callerAvatar 
          });
        } else {
          setActiveCall(null);
        }
      }
    };

    const handleActiveStatus = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        if (data.isActive) {
          setActiveCall({ 
            roomName: data.roomName, 
            isVideo: data.isVideo, 
            callerName: data.callerName,
            callerAvatar: data.callerAvatar 
          });
        } else {
          setActiveCall(null);
        }
      }
    };

    window.addEventListener("chat:call_status", handleCallStatus);
    window.addEventListener("call:active_status", handleActiveStatus);

    const handleOpenProfile = async (e: any) => {
      const { userId } = e.detail;
      try {
        const result = await triggerGetUser(userId).unwrap();
        if (result.user) {
          setProfileUser(result.user);
          setShowProfileSheet(true);
        }
      } catch (err) {
        console.error("Failed to fetch user for profile sheet:", err);
        toast.error("Không thể tải thông tin người dùng");
      }
    };

    window.addEventListener("chat:open_profile", handleOpenProfile);

    return () => {
      window.removeEventListener("chat:call_status", handleCallStatus);
      window.removeEventListener("call:active_status", handleActiveStatus);
      window.removeEventListener("chat:open_profile", handleOpenProfile);
    };
  }, [chatId, triggerGetUser]);

  // Auto-resize input textarea to fit content dynamically
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [inputText]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // If mention selector is open, don't send message, let it handle selection
      if (mentionQuery !== null) {
        return;
      }
      
      e.preventDefault();
      handleSend();
    }
  };


  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };



  // Show placeholder when no chat selected
  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
          <p className="text-sm mt-1">Chọn từ danh sách bên trái để bắt đầu</p>
        </div>
      </div>
    );
  }

  // Status text
  const getStatusText = () => {
    if (typingUsers.length > 0) {
      return `${typingUsers.map(u => u.userName).join(', ')} đang gõ...`;
    }
    if (chat?.isGroup) {
      return `${chat.participantCount || chat.participants?.length || 0} thành viên`;
    }
    if (isPartnerOnline) return '● Đang hoạt động';
    if (partner?.lastSeen) {
      return `Hoạt động ${formatDistanceToNow(new Date(partner.lastSeen), { addSuffix: true, locale: vi })}`;
    }
    return 'Không hoạt động';
  };

  const imageUrl = getAvatarUrl(chat?.avatar, chatName);

  return (
    <div className="flex-1 flex h-screen bg-white relative overflow-hidden">
    {/* Main chat column */}
    <div className="flex flex-col flex-1 min-w-0 relative">
        {isAdmin && isDirectMessage && (
          <div className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-2 text-center border-b border-amber-200 shadow-sm z-10 w-full">
            ⚠️ AUDITED ACCESS: You are viewing a direct message room under Admin privileges. Actions are logged.
          </div>
        )}

        {/* Pinned Messages Banner */}
        {chat?.pinnedMessages && chat.pinnedMessages.length > 0 && (
          <PinnedBanner 
            pinnedMessages={chat.pinnedMessages} 
            onOpenSidebar={() => {
              setShowPinnedPanel(true);
              setShowInfoPanel(false);
              setShowGroupSettings(false);
            }}
            onJumpToMessage={handleJumpToMessage}
            onUnpin={handleTogglePin}
            canUnpin={canPost}
          />
        )}

      {/* Connection indicator */}
      {!isConnected && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-1.5 text-center border-b border-red-200 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Đang kết nối lại...
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-slate-200/80 bg-white flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {isChannel ? (
            /* Channel header: show # or 🔒 icon */
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-[4px] bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                {channelData?.type === 'PRIVATE' ? (
                  <Lock size={15} className="text-slate-500" />
                ) : (
                  <Hash size={15} className="text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-[14px] leading-tight truncate">{channelData?.name}</h3>
                <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                  {typingUsers.length > 0
                    ? `${typingUsers.map(u => u.userName).join(', ')} đang gõ...`
                    : channelData?.topic || `${channelData?._count?.members ?? 0} thành viên`}
                </p>
              </div>
            </div>
          ) : isDirectMessage ? (
            /* DM header: show avatar + online status */
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="h-8 w-8 rounded-[4px] border border-slate-200/80">
                  <AvatarImage className="rounded-[4px]" src={imageUrl || partner?.avatar || undefined} />
                  <AvatarFallback className="rounded-[4px] bg-slate-100 text-slate-600 text-xs font-semibold">{chatName[0]}</AvatarFallback>
                </Avatar>
                {isPartnerOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[14px] leading-tight">{chatName}</h3>
                <p className={`text-[11px] font-medium mt-0.5 ${typingUsers.length > 0 ? 'text-blue-600' : isPartnerOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          ) : (
            /* Group Chat header: show group avatar */
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 rounded-[4px] border border-slate-200/80">
                <AvatarImage className="rounded-[4px]" src={imageUrl || undefined} />
                <AvatarFallback className="rounded-[4px] bg-slate-100 text-slate-600 text-xs font-semibold">{chatName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900 text-[14px] leading-tight">{chatName}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{getStatusText()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {activeCall && (
            <Button
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("call:rejoin", { detail: { ...activeCall, chatId } }));
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-semibold animate-pulse shadow-none transition-colors"
            >
              <Phone size={13} fill="currentColor" /> Tham gia
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => startCall(false)} className="h-8 w-8 rounded-[4px] text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Bắt đầu cuộc gọi thoại"><Phone size={15} /></Button>
          <Button variant="ghost" size="icon" onClick={() => startCall(true)} className="h-8 w-8 rounded-[4px] text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Bắt đầu cuộc gọi video"><Video size={15} /></Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setShowSearchPanel(!showSearchPanel);
              setShowPinnedPanel(false);
              setShowInfoPanel(false);
              setShowGroupSettings(false);
            }} 
            className={`h-8 w-8 rounded-[4px] transition-colors ${showSearchPanel ? 'text-blue-600 bg-blue-50/55' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
            title="Tìm kiếm tin nhắn"
          >
            <Search size={15} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setShowPinnedPanel(!showPinnedPanel);
              setShowSearchPanel(false);
              setShowInfoPanel(false);
              setShowGroupSettings(false);
            }} 
            className={`h-8 w-8 rounded-[4px] transition-colors ${showPinnedPanel ? 'text-blue-600 bg-blue-50/55' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
            title="Tin nhắn đã ghim"
          >
            <Pin size={15} className={showPinnedPanel ? 'fill-current' : ''} />
          </Button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1" />
          <Button variant="ghost"
            size="icon"
            onClick={() => {
              if (isChannel) {
                setShowGroupSettings(true); // reuse showGroupSettings flag for ChannelInfoPanel
              } else if (chat?.isGroup) {
                setShowGroupSettings(true);
              } else {
                setShowInfoPanel(true);
              }
            }}
            title={isChannel ? 'Thông tin kênh' : chat?.isGroup ? 'Cài đặt nhóm' : 'Thông tin cuộc trò chuyện'}
            className="h-8 w-8 rounded-[4px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <Info size={15} />
          </Button>
        </div>
      </header>

      {/* Message Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar bg-white scroll-smooth"
        style={{ overflowAnchor: 'none' }} // We handle anchoring manually for better control
      >
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
            <p className="text-sm">Đang tải tin nhắn...</p>
          </div>
        ) : (
          <>
            {/* Sentinel for infinite scroll up */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}

            {!hasMore && allMessages.length > 0 && (
              <div className="text-center py-8 text-slate-300 text-[11px] font-medium uppercase tracking-widest flex items-center justify-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-50" />
                Bắt đầu cuộc hội thoại
                <div className="h-[1px] flex-1 bg-slate-50" />
              </div>
            )}

            {groupedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 py-20">
                <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div key={group.date} className="space-y-1">
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="h-[1px] flex-1 bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 px-2 py-0.5 rounded-full border border-slate-100">
                      {group.date}
                    </span>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                  </div>

                  {group.messages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                    const prevSenderId = prevMsg?.senderId || prevMsg?.sender?.id;
                    const currSenderId = msg.senderId || msg.sender?.id;

                    // Show avatar if not me AND (is first message of date group OR sender changed)
                    const showAvatar = !msg.isMe && (!prevMsg || prevSenderId !== currSenderId);

                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        chatId={chatId!}
                        isGroup={chat?.isGroup as boolean}
                        participantCount={chat?.participantCount || 0}
                        showAvatar={showAvatar}
                        onReply={() => setReplyTo(msg)}
                        onMessageDeleted={() => {
                          setAllMessages(prev => prev.filter(m => m.id !== msg.id));
                        }}
                        readReceipts={readReceipts}
                      />
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-slate-400 text-sm pl-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">
              {typingUsers.map(u => u.userName).join(', ')} đang gõ...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Reply className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-blue-600 pl-2.5">
              <p className="text-[11px] text-blue-600 font-bold">
                {replyTo.isMe ? "Bạn" : replyTo.sender?.name}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {replyTo.content || `[${replyTo.type}]`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-[4px] text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors"
            onClick={() => setReplyTo(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200/80">
          <div className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-[4px] shadow-sm">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-[4px] border border-slate-100" />
            ) : (
              <div className="w-12 h-12 bg-slate-50 rounded-[4px] flex items-center justify-center border border-slate-200/80">
                <File className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{selectedFiles[0].name}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelectedFiles}
              disabled={isUploading}
              className="h-8 w-8 rounded-[4px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendFile}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi file</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Rich Text Composer */}
      <div className="px-6 py-4 border-t border-slate-200/80 bg-white">
        {chat?.isBlocked ? (
          <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-6 text-center">
            <Ban className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">
              {chat.isBlockedByMe
                ? "Bạn đã chặn người dùng này. Bỏ chặn để gửi tin nhắn."
                : "Bạn không thể gửi tin nhắn cho người này vì trạng thái chặn."}
            </p>
          </div>
        ) : !canPost ? (
          <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-4 flex flex-col items-center justify-center gap-1.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="h-8 w-8 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-500">
              <Lock size={15} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Kênh này đang ở chế độ chỉ đọc</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Chỉ quản trị viên mới có thể gửi tin nhắn trong cuộc hội thoại này.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 focus-within:border-slate-400 rounded-[4px] flex flex-col shadow-none transition-colors duration-150">
            {/* Input Area */}
            <div className="px-3 pt-2 pb-1.5 min-h-[44px] relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Nhắn cho ${chatName}...`}
                className="w-full resize-none border-0 focus:ring-0 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none bg-transparent py-1"
                rows={1}
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />
              {mentionQuery !== null && (
                <MentionSelector
                  participants={chat?.participants || []}
                  query={mentionQuery}
                  onSelect={handleMentionSelect}
                  onClose={() => setMentionQuery(null)}
                  currentUserId={user?.id}
                  canUseBroadcast={canUseBroadcastMentions}
                />
              )}
            </div>

            {/* Bottom Toolbar */}
            <div className="bg-slate-50/70 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-850 hover:bg-slate-200/60 rounded-[4px] transition-colors"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile size={15} />
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                    </div>
                  )}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "image")}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "file")}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-slate-850 hover:bg-slate-200/60 rounded-[4px] transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                  title="Gửi ảnh"
                >
                  <ImageIcon size={15} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-slate-850 hover:bg-slate-200/60 rounded-[4px] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Gửi file"
                >
                  <Paperclip size={15} />
                </Button>

                {chat?.isGroup && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-850 hover:bg-slate-200/60 rounded-[4px] transition-colors"
                    onClick={() => setShowCreatePollModal(true)}
                    title="Tạo bình chọn"
                  >
                    <BarChart3 size={15} />
                  </Button>
                )}

                <div className="h-4 w-[1px] bg-slate-200 mx-2" />

                <button
                  onClick={() => openAIPanel()}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border transition-all ${
                    showAIPanel
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-50/60 text-blue-600 border-blue-200/80 hover:bg-blue-100/70 hover:border-blue-200'
                  }`}
                >
                  <Sparkles size={12} className={showAIPanel ? '' : 'animate-pulse text-blue-500'} />
                  <span>AI Assistant</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                  Nhấn Enter để gửi
                </span>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="h-7 w-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-[4px] transition-all shadow-none"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="py-2 text-center text-[10px] text-slate-400/80 font-medium tracking-wider select-none bg-white">
          NEXUS Enterprise Collaboration Chat • Secure & Encrypted
        </div>
      </div>


      {/* Chat Info Panel (DMs) */}
      <ChatInfoPanel
        chatId={chatId}
        chatName={chat?.name || "Chat No Name"}
        isOpen={showInfoPanel}
        onClose={() => setShowInfoPanel(false)}
        onMessageClick={(messageId) => { setShowInfoPanel(false); }}
      />

      {/* Channel Info Panel (Workspace Channels) */}
      {isChannel && chatId && (
        <ChannelInfoPanel
          channelId={chatId}
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          onLeaveChannel={() => router.push('/chat')}
        />
      )}

      {/* Group Settings Panel (Group Chats - not channels) */}
      {chat?.isGroup && !isChannel && (
        <GroupSettingsPanel
          chatId={chatId}
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          currentUserId={user?.id}
        />
      )}
    </div>

    {/* ── AI Assistant Side Panel (Phase 1) ── */}
    {showAIPanel && chatId && (
        <AIAssistantPanel 
          chatId={chatId}
          onClose={closeAIPanel} 
          initialQuery={aiInitialQuery}
        />
      )}

      {/* Pinned Messages Panel */}
      {showPinnedPanel && chat?.pinnedMessages && (
        <PinnedMessagesPanel 
          pinnedMessages={chat.pinnedMessages}
          onClose={() => setShowPinnedPanel(false)}
          onJumpToMessage={handleJumpToMessage}
          onUnpin={handleTogglePin}
          canUnpin={canPost}
        />
      )}

      {/* Search Messages Panel */}
      {showSearchPanel && chatId && (
        <SearchMessagesPanel 
          chatId={chatId}
          onClose={() => setShowSearchPanel(false)}
          onJumpToMessage={handleJumpToMessage}
        />
      )}

    {/* ── Profile Sheet ── */}
    <FriendProfileSheet
      friend={profileUser}
      isOpen={showProfileSheet}
      onClose={() => setShowProfileSheet(false)}
      onStartChat={(newChatId) => {
        setShowProfileSheet(false);
        router.push(`/chat/${newChatId}`);
      }}
    />

    {/* Create Poll Modal */}
    {chatId && (
      <CreatePollModal
        open={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        chatId={chatId}
      />
    )}
  </div>
  );
};
