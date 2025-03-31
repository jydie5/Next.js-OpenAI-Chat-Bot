'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { ReasoningEffort, MODEL_CONFIGS, ChatConfig } from '../lib/openai';

interface ChatInputProps {
  onSubmit: (message: string, config: ChatConfig) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('o3-mini');
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout>();
  const justFinishedComposing = useRef(false);

  // ローディングアニメーションの制御
  const startLoadingAnimation = () => {
    loadingIntervalRef.current = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
  };

  const stopLoadingAnimation = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      setDots('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || isComposing) return;
    setIsLoading(true);
    startLoadingAnimation();
    try {
      const config: ChatConfig = {
        model: selectedModel,
        ...(MODEL_CONFIGS[selectedModel].supportsReasoningEffort ? { reasoningEffort } : {})
      };
      await onSubmit(message, config);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('メッセージの送信に失敗しました:', error);
    } finally {
      setIsLoading(false);
      stopLoadingAnimation();
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
    // IME入力中またはIME確定直後は処理をスキップ
    if (isComposing || justFinishedComposing.current) return;

    // キーイベントの詳細なチェック
    if (e.key === 'Enter' && !e.shiftKey) {
      // isComposingがfalseでも、キーコードが229（IME処理中）の場合は送信しない
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) {
        return;
      }
      e.preventDefault();
      // 確実にIME処理が完了してから送信
      setTimeout(() => {
        handleSubmit(e);
      }, 0);
    }
  };

  // アンマウント時にインターバルをクリア
  useEffect(() => {
    return () => stopLoadingAnimation();
  }, []);

  // IME入力の状態を監視
  const handleCompositionStart = () => {
    setIsComposing(true);
    justFinishedComposing.current = false;
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    justFinishedComposing.current = true;
    // 次のイベントループで状態をリセット
    setTimeout(() => {
      justFinishedComposing.current = false;
    }, 0);
  };

  // 選択されたモデルがreasoningEffortをサポートしているか確認
  const supportsReasoningEffort = MODEL_CONFIGS[selectedModel]?.supportsReasoningEffort;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={disabled || isLoading}
          className="rounded-xl bg-slate-800/50 border border-slate-700/50 
                   text-slate-200 text-sm p-2 focus:border-sky-500 
                   focus:ring-1 focus:ring-sky-500 disabled:bg-slate-800/30"
        >
          {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.description}
            </option>
          ))}
        </select>

        {supportsReasoningEffort && (
          <select
            value={reasoningEffort}
            onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
            disabled={disabled || isLoading}
            className="rounded-xl bg-slate-800/50 border border-slate-700/50 
                     text-slate-200 text-sm p-2 focus:border-sky-500 
                     focus:ring-1 focus:ring-sky-500 disabled:bg-slate-800/30"
          >
            <option value="high">じっくり考えて回答</option>
            <option value="medium">バランスよく考えて回答</option>
            <option value="low">素早く考えて回答</option>
          </select>
        )}

        {isLoading && (
          <div className="flex items-center text-slate-400 text-sm">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Thinking{dots}</span>
          </div>
        )}
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
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
          disabled={disabled || isLoading || !message.trim() || isComposing}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18l9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}