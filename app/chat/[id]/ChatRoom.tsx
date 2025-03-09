'use client';

import { useState } from 'react';
import Message from '../../components/Message';
import ChatInput from '../../components/ChatInput';
import type { Message as MessageType } from '@prisma/client';

interface ChatRoomProps {
  initialMessages: MessageType[];
  sessionId: number;
}

export default function ChatRoom({ initialMessages, sessionId }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (content: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
    } catch (error) {
      console.error('エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))]">
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <Message
            key={message.id}
            role={message.role as 'user' | 'assistant'}
            content={message.content}
          />
        ))}
      </div>
      
      <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
    </div>
  );
}