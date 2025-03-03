import React, { useState, FormEvent } from 'react';

type Props = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export default function ChatInput({ onSendMessage, isLoading }: Props) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex items-center border rounded-lg overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力してください..."
          className="flex-grow p-3 outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`px-4 py-3 bg-primary-500 text-white font-medium ${
            isLoading || !input.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-primary-600'
          }`}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            '送信'
          )}
        </button>
      </div>
    </form>
  );
}
