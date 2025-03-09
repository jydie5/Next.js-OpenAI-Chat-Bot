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
  const [showDebug, setShowDebug] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
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

      // APIリクエスト（ストリーミングモードに応じてエンドポイントを変更）
      const response = await fetch(useStreaming ? '/api/chat' : '/api/chat/normal', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'エラーが発生しました');
      }

      if (useStreaming) {
        if (!response.body) {
          throw new Error('ストリーミングレスポンスのボディがありません');
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
            const chunks = chunkText.split('\n').filter(Boolean);
            
            for (const chunk of chunks) {
              try {
                const jsonChunk = JSON.parse(chunk);
                
                if (jsonChunk.isLast) {
                  // 最後のチャンクでデバッグ情報を含めてメッセージを追加
                  setMessages((prev) => [...prev, {
                    role: 'assistant',
                    content: accumulatedResponse,
                    debugInfo: jsonChunk.debugInfo
                  }]);
                  setPartialResponse('');
                } else {
                  // 通常のテキストチャンクを処理
                  accumulatedResponse += jsonChunk.content;
                  setPartialResponse(accumulatedResponse);
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        }
      } else {
        // 通常のレスポンスの処理
        const data = await response.json();
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.content,
          debugInfo: data.debugInfo
        }]);
        setPartialResponse('');
      }

      // 完全なレスポンスは既に追加されているので、ここでは追加しない
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">OpenAI チャットボット</h2>
              <p className="text-gray-600">
                GPTモデル　o3-miniを使ったチャットボットです。質問や会話を楽しんでください。
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="debug-mode"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="debug-mode" className="text-sm text-gray-600">
                  デバッグモード
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="streaming-mode"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="streaming-mode" className="text-sm text-gray-600">
                  ストリーミング
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto p-2">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              debugInfo={showDebug ? message.debugInfo : undefined}
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