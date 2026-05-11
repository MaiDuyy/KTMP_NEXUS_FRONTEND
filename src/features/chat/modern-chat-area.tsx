import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Mic,
  Send,
  Sparkles,
  Bold,
  Italic,
  Link2,
  List as ListIcon,
  Reply,
  X,
  Loader2,
  ImageIcon,
  File,
  Ban
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useGetChatByIdQuery, useMarkChatAsReadMutation, useGetChatReadReceiptsQuery } from '@/src/redux/feature/chatApi';
import { useGetMessagesQuery, useLazyGetMessagesQuery, useSendMessageMutation } from '@/src/redux/feature/messageApi';
import { socketService } from '@/src/services/socket.service';
import {
  useRealtimeChat,
  useChatRoom,
  useTypingUsers,
  useIsUserOnline,
} from '@/src/hooks/useRealtimeChat';
import { Message } from '@/src/type/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import MessageBubble from './message-bubble';
import EmojiPicker from './emoji-picker';
import ChatInfoPanel from './chat-info-panel';
import GroupSettingsPanel from './group-settings-panel';
import { toast } from 'sonner';
import { useUploadChatMediaMutation } from '@/src/redux/feature/uploadApi';
import { messageApi } from '@/src/redux/feature/messageApi';
import { AIAssistantPanel } from './AIAssistantPanel';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCall, setActiveCall] = useState<{ roomName: string; isVideo: boolean; callerName: string } | null>(null);

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

  const [triggerGetMessages, { isFetching }] = useLazyGetMessagesQuery();
  const { data: readReceipts } = useGetChatReadReceiptsQuery(chatId!, { skip: !chatId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [uploadChatMedia] = useUploadChatMediaMutation();
  const chat = chatData?.chat;
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Initial Load & Chat Change
  useEffect(() => {
    if (!chatId) return;

    setAllMessages([]);
    setNextCursor(null);
    setHasMore(true);
    setIsInitialLoad(true);

    const loadInitialMessages = async () => {
      try {
        const result = await triggerGetMessages({ chatId, limit: 50 }).unwrap();
        setAllMessages(result.messages);
        setNextCursor(result.nextCursor || null);
        setHasMore(!!result.nextCursor);

        // Wait for render then scroll
        setTimeout(() => {
          scrollToBottom();
          setIsInitialLoad(false);
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
          m.id === messageId ? { ...m, content: 'Tin nhắn đã bị thu hồi', destroy: true } : m
        ));
      }
    };

    const handleMessageReacted = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        setAllMessages(prev => prev.map(m => {
          if (m.id !== data.messageId) return m;

          let newReactions = [...(m.reactions || [])];
          const existReaction = newReactions.find((r) => r.emoji === data.emoji);

          if (data.action === "added" || data.action === "changed" || !data.action) {
            if (existReaction) {
              const users = [...(existReaction.users || [])];
              if (!users.some((u) => u.id === data.userId)) {
                users.push({ id: data.userId, name: data.userName || "User" });
                existReaction.users = users;
                existReaction.count = users.length;
              }
            } else {
              newReactions.push({
                emoji: data.emoji,
                count: 1,
                users: [{ id: data.userId, name: data.userName || "User" }],
              });
            }
          } else if (data.action === "removed") {
            if (existReaction) {
              const users = (existReaction.users || []).filter((u) => u.id !== data.userId);
              if (users.length === 0) {
                newReactions = newReactions.filter((r) => r.emoji !== data.emoji);
              } else {
                existReaction.users = users;
                existReaction.count = users.length;
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
  };

  // Send message via REST API (chat-service saves to DB + publishes NATS → WS Gateway broadcasts)
  const handleSend = async () => {
    if (!inputText.trim() || !chatId || !user) return;

    const content = inputText.trim();

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
          setActiveCall({ roomName: data.roomName, isVideo: data.isVideo, callerName: data.callerName });
        } else {
          setActiveCall(null);
        }
      }
    };

    const handleActiveStatus = (e: any) => {
      const data = e.detail;
      if (data.chatId === chatId) {
        if (data.isActive) {
          setActiveCall({ roomName: data.roomName, isVideo: data.isVideo, callerName: data.callerName });
        } else {
          setActiveCall(null);
        }
      }
    };

    window.addEventListener("chat:call_status", handleCallStatus);
    window.addEventListener("call:active_status", handleActiveStatus);
    return () => {
      window.removeEventListener("chat:call_status", handleCallStatus);
      window.removeEventListener("call:active_status", handleActiveStatus);
    };
  }, [chatId]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  let imageUrl = chat?.avatar || "";
  if (imageUrl && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    imageUrl = `https://${imageUrl}`;
  }

  return (
    <div className="flex-1 flex h-screen bg-white relative overflow-hidden">
    {/* Main chat column */}
    <div className="flex flex-col flex-1 min-w-0 relative">
      {isAdmin && isDirectMessage && (
        <div className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-2 text-center border-b border-amber-200 shadow-sm z-10 w-full">
          ⚠️ AUDITED ACCESS: You are viewing a direct message room under Admin privileges. Actions are logged.
        </div>
      )}

      {/* Connection indicator */}
      {!isConnected && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-1.5 text-center border-b border-red-200 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Đang kết nối lại...
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          {isDirectMessage ? (
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={imageUrl || partner?.avatar || undefined} />
                <AvatarFallback>{chatName[0]}</AvatarFallback>
              </Avatar>
              {isPartnerOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>
          ) : (
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={imageUrl || undefined} />
              <AvatarFallback>{chatName[0]}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">{chatName}</h3>
            <p className={`text-[11px] font-medium ${typingUsers.length > 0
              ? 'text-blue-500'
              : isPartnerOnline
                ? 'text-emerald-500'
                : 'text-slate-400'
              }`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-6 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            placeholder="Search messages, files..."
            className="pl-9 pr-12 bg-slate-50 border-0 h-9 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-blue-100"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-400 font-bold bg-white pointer-events-none">
            ⌘K
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeCall && (
            <Button
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("call:rejoin", { detail: { ...activeCall, chatId } }));
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 h-8 px-3 rounded-full animate-pulse shadow-md"
            >
              <Phone size={14} fill="currentColor" /> Tham gia
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => startCall(false)} className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Bắt đầu cuộc gọi thoại"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" onClick={() => startCall(true)} className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Bắt đầu cuộc gọi video"><Video size={18} /></Button>
          <div className="h-4 w-[1px] bg-slate-100 mx-1" />
          <Button variant="ghost"
            size="icon"

            onClick={() => {
              if (chat?.isGroup) {
                setShowGroupSettings(true);
              } else {
                setShowInfoPanel(true);
              }
            }}
            title={chat?.isGroup ? "Cài đặt nhóm" : "Thông tin cuộc trò chuyện"}
            className="h-8 w-8 text-slate-400 hover:text-slate-600"><Info size={18} /></Button>
        </div>
      </header>

      {/* Message Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-white scroll-smooth"
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

            {allMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 py-20">
                <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              allMessages.map((msg, idx) => {
                const msgSender = chat?.participants?.find((p) => p.accountId === (msg.senderId || msg.sender?.id));
                const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
                const prevSenderId = prevMsg?.senderId || prevMsg?.sender?.id;
                const currSenderId = msg.senderId || msg.sender?.id;

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
                      // Optimistically or after refetch, we might need a way to remove from allMessages
                      setAllMessages(prev => prev.filter(m => m.id !== msg.id));
                    }}
                    readReceipts={readReceipts}
                  />
                );
              })
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
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <Reply className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-2">
            <p className="text-xs text-blue-600 font-medium">
              {replyTo.isMe ? "Bạn" : replyTo.sender?.name}
            </p>
            <p className="text-sm text-slate-500 truncate">
              {replyTo.content || `[${replyTo.type}]`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-600"
            onClick={() => setReplyTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <File className="h-8 w-8 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFiles[0].name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelectedFiles}
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSendFile}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}


      {/* Rich Text Composer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white">
        {chat?.isBlocked ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <Ban className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              {chat.isBlockedByMe
                ? "Bạn đã chặn người dùng này. Bỏ chặn để gửi tin nhắn."
                : "Bạn không thể gửi tin nhắn cho người này vì trạng thái chặn."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-50 overflow-x-auto no-scrollbar">
              {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><Bold size={16} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><Italic size={16} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><Link2 size={16} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><ListIcon size={16} /></Button> */}
              {/* <div className="h-4 w-[1px] bg-slate-100 mx-1" /> */}
              <div className="absolute flex-shrink-0 ">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={16} />
                </Button>

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
                  className="flex-shrink-0"
                  onClick={() => imageInputRef.current?.click()}
                  title="Gửi ảnh"
                >
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Gửi file"
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50">
                    <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                  </div>
                )}
              </div>

              <button
                onClick={() => openAIPanel()}
                className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors border ${
                  showAIPanel
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                }`}
              >
                <Sparkles size={14} className={showAIPanel ? '' : 'animate-pulse'} />
                Ask AI
              </button>
            </div>

            <div className="p-4 min-h-[80px]">
              <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${chatName}`}
                className="w-full resize-none border-0 focus:ring-0 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 rounded-b-xl border-t border-slate-50">
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5"><Mic size={14} /> Voice Clip</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mr-2">Press ↵ to send</span>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="h-9 px-4 bg-[#135bec] hover:bg-[#0f4bbd] disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Send
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="p-2 text-center text-[10px] text-slate-300 font-medium">
          OTT Enterprise Collaboration Chat • Secure & Encrypted
        </div>
      </div>


      {/* Chat Info Panel */}
      <ChatInfoPanel
        chatId={chatId}
        chatName={chat?.name || "Chat No Name"}
        isOpen={showInfoPanel}
        onClose={() => setShowInfoPanel(false)}
        onMessageClick={(messageId) => {
          setShowInfoPanel(false);
        }}
      />

      {/* Group Settings Panel */}
      {chat?.isGroup && (
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
        initialQuery={aiInitialQuery}
        onClose={closeAIPanel}
      />
    )}
  </div>
  );
};
