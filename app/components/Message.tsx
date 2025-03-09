'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function Message({ role, content }: MessageProps) {
  return (
    <div
      className={`py-4 ${
        role === 'user' ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-start">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              role === 'user' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          >
            <span className="text-white text-sm">
              {role === 'user' ? 'U' : 'A'}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}