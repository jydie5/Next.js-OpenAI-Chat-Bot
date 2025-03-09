'use client';

import { useState, useRef, FormEvent } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onSubmit(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('メッセージの送信に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力...(Shift + Enterで改行)"
          disabled={disabled || isLoading}
          className="w-full resize-none overflow-hidden rounded-xl bg-slate-800/50 
                   border border-slate-700/50 focus:border-sky-500 focus:ring-1 
                   focus:ring-sky-500 p-4 pr-16 text-base text-slate-200 
                   placeholder-slate-400 disabled:bg-slate-800/30
                   shadow-inner transition-all duration-200"
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled || isLoading || !message.trim()}
          className="absolute right-3 bottom-3 p-2 rounded-lg
                   bg-gradient-to-r from-sky-500 to-blue-600 
                   text-white shadow-lg hover:from-sky-600 hover:to-blue-700
                   disabled:from-slate-600 disabled:to-slate-700
                   disabled:opacity-50 transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-sky-500"
          title="送信"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}