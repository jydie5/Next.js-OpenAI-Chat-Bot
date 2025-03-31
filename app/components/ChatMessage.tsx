'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('python', python);

type Props = {
  role: 'user' | 'assistant';
  content: string;
  debugInfo?: {
    id: string;
    model: string;
    usage: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
      completion_tokens_details?: {
        accepted_prediction_tokens: number;
        audio_tokens: number;
        reasoning_tokens: number;
        rejected_prediction_tokens: number;
      };
      prompt_tokens_details?: {
        audio_tokens: number;
        cached_tokens: number;
      };
    };
    service_tier: string;
    system_fingerprint: string;
  };
};

export default function ChatMessage({ role, content, debugInfo }: Props) {
  return (
    <div
      className={`p-6 mb-4 ${
        role === 'user' 
          ? 'chat-message-user border-l-4 border-sky-500' 
          : 'chat-message-assistant border-l-4 border-indigo-500'
      }`}
    >
      <div className="flex items-start max-w-4xl mx-auto">
        <div className={`w-10 h-10 mr-4 rounded-xl flex items-center justify-center 
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
          {role === 'assistant' ? (
            <div className="markdown-content prose prose-slate dark:prose-invert max-w-full">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml={false}
                components={{
                  pre: ({ children }) => {
                    const code = React.Children.toArray(children).find(
                      child => React.isValidElement(child) && child.type === 'code'
                    );
                    if (!React.isValidElement(code)) {
                      return <pre>{children}</pre>;
                    }
                    const className = code.props.className || '';
                    const language = /language-(\w+)/.exec(className)?.[1] || '';
                    return (
                      <div className="my-4 relative group">
                        <div className="absolute right-3 top-2 z-10">
                          {language && (
                            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
                              {language}
                            </span>
                          )}
                        </div>
                        <SyntaxHighlighter
                          language={language}
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.75rem',
                            padding: '2rem 1rem 1rem',
                            backgroundColor: 'rgb(15 23 42)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          {code.props.children.trim()}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  code: ({ children, className }) => {
                    if (!className || className.indexOf('language-') === -1) {
                      return (
                        <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-800 border border-slate-700/50 font-mono text-[0.9rem] text-slate-200">
                          {children}
                        </code>
                      );
                    }
                    return children;
                  },
                  p: ({ children }) => <p className="mb-4 text-slate-300">{children}</p>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold my-4 gradient-text">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold my-3 gradient-text">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold my-2 text-slate-200">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc ml-6 mb-4 text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 text-slate-300">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-sky-400 hover:text-sky-300 transition-colors" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-slate-300">{content}</div>
          )}
          {role === 'assistant' && debugInfo && (
            <details className="mt-4 group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors flex items-center gap-2">
                <span>デバッグ情報を表示</span>
                <span className="text-xs text-slate-600">({debugInfo.model})</span>
              </summary>
              <div className="mt-3 space-y-3">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-inner">
                  <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre">
                    <code>
{`基本情報:
• ID: ${debugInfo.id}
• モデル: ${debugInfo.model}
• サービスティア: ${debugInfo.service_tier}
• システムフィンガープリント: ${debugInfo.system_fingerprint}
トークン使用状況:
• 合計: ${debugInfo.usage?.total_tokens?.toLocaleString() ?? 'N/A'} トークン
  - 完了: ${debugInfo.usage?.completion_tokens?.toLocaleString() ?? 'N/A'}
  - プロンプト: ${debugInfo.usage?.prompt_tokens?.toLocaleString() ?? 'N/A'}`}
                    </code>
                  </pre>
                </div>
                
                <details className="group">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
                    詳細情報を表示
                  </summary>
                  <div className="mt-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-inner">
                    <pre className="text-xs text-slate-400 overflow-x-auto">
                      <code>{JSON.stringify(debugInfo, null, 2)}</code>
                    </pre>
                  </div>
                </details>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}