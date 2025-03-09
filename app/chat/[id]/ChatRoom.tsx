'use client';
import { useState, useEffect } from 'react';
import Message from '../../components/Message';
import ChatInput from '../../components/ChatInput';
import { useSessionContext } from '../../components/SessionContext';
import type { Message as MessageType } from '@prisma/client';

interface ChatRoomProps {
  initialMessages: MessageType[];
  sessionId: number;
}

export default function ChatRoom({ initialMessages, sessionId }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshSessions } = useSessionContext();

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

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
      refreshSessions();
    } catch (error) {
      console.error('エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="glass-effect border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold gradient-text">Chat Session #{sessionId}</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                <span className="text-2xl">💭</span>
              </div>
              <h2 className="text-xl font-medium gradient-text">新しい会話を始めましょう</h2>
              <p className="text-sm text-slate-500">下のテキストボックスにメッセージを入力してください</p>
            </div>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="glass-effect border-t border-slate-700/50 p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}