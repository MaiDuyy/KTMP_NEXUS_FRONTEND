"use client";

import { ModernChatArea } from '@/src/features/chat/modern-chat-area';
import { useParams } from 'next/navigation';

export default function SingleChatPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!id) return null;

  return <ModernChatArea chatId={id} />;
}
