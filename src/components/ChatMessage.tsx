import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  return (
    <div
      className={`p-4 mb-4 rounded-lg ${
        role === 'user' ? 'chat-message-user' : 'chat-message-assistant'
      }`}
    >
      <div className="flex items-start">
        <div className="w-8 h-8 mr-3 rounded-full bg-gray-300 flex items-center justify-center">
          {role === 'user' ? '👤' : '🤖'}
        </div>
        <div className="flex-1">
          <div className="font-semibold mb-1">
            {role === 'user' ? 'あなた' : 'AI'}
          </div>
          {role === 'assistant' ? (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // コードブロックのカスタマイズ
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative">
                        <pre className="rounded bg-gray-100 p-4 overflow-x-auto border border-gray-300">
                          <code
                            className={`${className} text-sm text-gray-800`}
                            {...props}
                          >
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-gray-100 px-1 py-0.5 rounded" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // 他のMarkdownコンポーネントも必要に応じてカスタマイズ
                  p: ({ children }) => <p className="mb-4">{children}</p>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold my-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  );
}
