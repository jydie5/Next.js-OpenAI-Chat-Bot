'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Message from '../../components/Message';
import ChatInput from '../../components/ChatInput';
import { useSessionContext } from '../../components/SessionContext';
import type { Message as MessageType } from '@prisma/client';
import type { ChatConfig } from '../../lib/openai';

interface ChatRoomProps {
  initialMessages: MessageType[];
  sessionId: number;
}

interface MessagesResponse {
  messages: MessageType[];
}

// メッセージフェッチャー関数
const fetchMessages = async (sessionId: number): Promise<MessageType[]> => {
  const response = await fetch(`/api/chat/${sessionId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  const data: MessagesResponse = await response.json();
  return data.messages;
};

export default function ChatRoom({ initialMessages, sessionId }: ChatRoomProps) {
  // SWRを使用してメッセージを管理
  const { data: messages, mutate } = useSWR<MessageType[]>(
    `/api/chat/${sessionId}/messages`,
    () => fetchMessages(sessionId),
    {
      fallbackData: initialMessages,
      refreshInterval: 0, // 自動更新は無効
      revalidateOnFocus: true, // フォーカス時に再検証
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const { refreshSessions } = useSessionContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUnmountedRef = useRef(false);

  // スクロール処理
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // クリーンアップ
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (content: string, config: ChatConfig) => {
    if (isUnmountedRef.current) return;
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const userMessage: MessageType = {
        id: Date.now(),
        sessionId,
        role: 'user',
        content,
        createdAt: new Date()
      };

      // 最新のメッセージを含めた状態で更新
      await mutate([...(messages || []), userMessage], false);

      const tempAssistantMessage: MessageType = {
        id: Date.now() + 1,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date()
      };

      // 一時的なアシスタントメッセージを追加
      await mutate([...(messages || []), userMessage, tempAssistantMessage], false);

      const response = await fetch(`/api/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          model: config.model,
          reasoningEffort: config.reasoningEffort
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました');
      }

      if (!response.body) {
        throw new Error('レスポンスボディが空です');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;

        if (!isUnmountedRef.current) {
          await mutate(
            (currentMessages: MessageType[] = []) =>
              currentMessages.map((msg: MessageType) =>
                msg.id === tempAssistantMessage.id
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ),
            false
          );
        }
      }

      if (!isUnmountedRef.current) {
        const saveResponse = await fetch(`/api/chat/${sessionId}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: accumulatedContent }),
        });

        if (!saveResponse.ok) {
          console.error('メッセージの保存に失敗しました');
        } else {
          const { message: savedMessage } = await saveResponse.json();
          await mutate(
            (currentMessages: MessageType[] = []) =>
              currentMessages.map((msg: MessageType) =>
                msg.id === tempAssistantMessage.id ? savedMessage : msg
              ),
            true
          );
          await refreshSessions();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('ストリーミングがキャンセルされました');
        } else {
          console.error('エラー:', error);
          alert('メッセージの送信に失敗しました');
          // エラー時は最後のユーザーメッセージを除去
          await mutate(
            (currentMessages: MessageType[] = []) =>
              currentMessages.filter((msg: MessageType) => msg.role === 'user'),
            true
          );
        }
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }
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
          {!messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                <span className="text-2xl">💭</span>
              </div>
              <h2 className="text-xl font-medium gradient-text">新しい会話を始めましょう</h2>
              <p className="text-sm text-slate-500">下のテキストボックスにメッセージを入力してください</p>
            </div>
          ) : (
            messages.map((message: MessageType) => (
              <Message
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
              />
            ))
          )}
          <div ref={messagesEndRef} />
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