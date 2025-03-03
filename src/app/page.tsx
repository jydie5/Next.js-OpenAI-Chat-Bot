'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { Message } from '@/lib/openai';

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content: 'こんにちは！何かお手伝いできることはありますか？',
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialResponse, setPartialResponse] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partialResponse]);

  const handleSendMessage = async (content: string) => {
    try {
      // ユーザーメッセージを追加
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      setPartialResponse('');

      // APIリクエスト
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'エラーが発生しました');
      }

      if (!response.body) {
        throw new Error('レスポンスボディがありません');
      }

      // ストリーミングレスポンスの処理
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunkText = decoder.decode(value);
          accumulatedResponse += chunkText;
          setPartialResponse(accumulatedResponse);
        }
      }

      // 完全なレスポンスをメッセージに追加
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: accumulatedResponse 
      }]);
      setPartialResponse('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">OpenAI チャットボット</h2>
          <p className="text-gray-600">
            GPT-4oを使ったチャットボットです。質問や会話を楽しんでください。
          </p>
        </div>

        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto p-2">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {partialResponse && (
            <ChatMessage
              role="assistant"
              content={partialResponse}
            />
          )}
          
          {isLoading && !partialResponse && (
            <div className="p-4 chat-message-assistant rounded-lg">
              <div className="flex items-start">
                <div className="w-8 h-8 mr-3 rounded-full bg-gray-300 flex items-center justify-center">
                  🤖
                </div>
                <div className="typing-indicator mt-4">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            エラー: {error}
          </div>
        )}

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
