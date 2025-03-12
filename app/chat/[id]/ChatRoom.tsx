'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Message from '../../components/Message';
import ChatInput from '../../components/ChatInput';
import { useSessionContext } from '../../components/SessionContext';
import type { Message as MessageType } from '@prisma/client';
import type { ChatConfig } from '../../lib/openai';

interface ChatRoomProps {
  initialMessages: MessageType[];
  sessionId: number;
}

export default function ChatRoom({ initialMessages, sessionId }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshSessions } = useSessionContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUnmountedRef = useRef(false);

  // メッセージの状態を更新
  const updateMessages = useCallback((newMessages: MessageType[] | ((prev: MessageType[]) => MessageType[])) => {
    if (!isUnmountedRef.current) {
      setMessages(newMessages);
    }
  }, []);

  // スクロール処理
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 初期化とクリーンアップ
  useEffect(() => {
    isUnmountedRef.current = false;
    updateMessages(initialMessages);

    return () => {
      isUnmountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialMessages, updateMessages]);

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
      updateMessages([...messages, userMessage]);

      const tempAssistantMessage: MessageType = {
        id: Date.now() + 1,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date()
      };
      updateMessages([...messages, userMessage, tempAssistantMessage]);

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
          updateMessages((prevMessages: MessageType[]) => 
            prevMessages.map((msg: MessageType) => 
              msg.id === tempAssistantMessage.id 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
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
          updateMessages((prevMessages: MessageType[]) => 
            prevMessages.map((msg: MessageType) => 
              msg.id === tempAssistantMessage.id 
                ? savedMessage
                : msg
            )
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
          updateMessages((prev: MessageType[]) => prev.filter((msg: MessageType) => msg.role === 'user'));
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