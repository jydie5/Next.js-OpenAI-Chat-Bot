'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-800 border border-slate-700/50 font-mono text-[0.9rem] text-slate-200">
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative my-4">
                        {language && (
                          <div className="absolute right-3 top-2 z-10">
                            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
                              {language}
                            </span>
                          </div>
                        )}
                        <SyntaxHighlighter
                          style={oneDark}
                          language={language}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.75rem',
                            padding: '2rem 1rem 1rem',
                            backgroundColor: 'rgb(15 23 42)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}