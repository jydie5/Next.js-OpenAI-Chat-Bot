'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function Message({ role, content }: MessageProps) {
  return (
    <div className={`py-4 ${
      role === 'user' 
        ? 'bg-slate-800/50 border-l-4 border-sky-500' 
        : 'bg-slate-900/50 border-l-4 border-indigo-500'
    }`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
            ${role === 'user' 
              ? 'bg-gradient-to-br from-sky-400 to-blue-500' 
              : 'bg-gradient-to-br from-indigo-400 to-purple-500'
            }`}>
            <span className="text-lg text-white">
              {role === 'user' ? '👤' : '🤖'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium mb-2 text-slate-400">
              {role === 'user' ? 'あなた' : 'AI'}
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-full">
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