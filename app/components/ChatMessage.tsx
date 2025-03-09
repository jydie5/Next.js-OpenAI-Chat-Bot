import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      className={`p-4 mb-4 rounded-lg ${
        role === 'user' ? 'chat-message-user' : 'chat-message-assistant'
      }`}
    >
      <div className="flex items-start">
        <div className="w-8 h-8 mr-3 rounded-full bg-gray-300 flex items-center justify-center">
          {role === 'user' ? '👤' : '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-1">
            {role === 'user' ? 'あなた' : 'AI'}
          </div>
          {role === 'assistant' ? (
            <div className="markdown-content max-w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml={false}
                components={{
                  pre: ({ children, node }) => {
                    const code = React.Children.toArray(children).find(
                      child => React.isValidElement(child) && child.type === 'code'
                    );

                    if (!React.isValidElement(code)) {
                      return <pre>{children}</pre>;
                    }

                    const className = code.props.className || '';
                    const language = /language-(\w+)/.exec(className)?.[1];

                    return (
                      <div className="my-4 relative group">
                        <pre className="rounded-lg bg-gray-50 p-4 pt-8 overflow-x-auto border border-gray-200 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100">
                          {language && (
                            <div className="absolute right-3 top-2">
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-sm border border-gray-200 opacity-75 group-hover:opacity-100 transition-opacity">
                                {language}
                              </span>
                            </div>
                          )}
                          <code className={`block font-mono text-[0.9rem] leading-relaxed ${className}`}>
                            {code.props.children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  code: ({ children, className }) => {
                    // コードブロックの判定をclassNameの有無で行う
                    if (!className || className.indexOf('language-') === -1) {
                      return (
                        <code className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-50 border border-gray-200 font-mono text-[0.9rem]">
                          {children}
                        </code>
                      );
                    }
                    return children;
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
          {role === 'assistant' && debugInfo && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2">
                <span>デバッグ情報を表示</span>
                <span className="text-xs text-gray-400">({debugInfo.model})</span>
              </summary>
              <div className="mt-2 space-y-2">
                {/* 整形表示 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre">
                    <code>
{`基本情報:
• ID: ${debugInfo.id}
• モデル: ${debugInfo.model}
• サービスティア: ${debugInfo.service_tier}
• システムフィンガープリント: ${debugInfo.system_fingerprint}

トークン使用状況:
• 合計: ${debugInfo.usage?.total_tokens?.toLocaleString() ?? 'N/A'} トークン
  - 完了: ${debugInfo.usage?.completion_tokens?.toLocaleString() ?? 'N/A'}
  - プロンプト: ${debugInfo.usage?.prompt_tokens?.toLocaleString() ?? 'N/A'}

完了トークン詳細:
• 予測受入: ${debugInfo.usage?.completion_tokens_details?.accepted_prediction_tokens?.toLocaleString() ?? 'N/A'}
• 音声: ${debugInfo.usage?.completion_tokens_details?.audio_tokens?.toLocaleString() ?? 'N/A'}
• 推論: ${debugInfo.usage?.completion_tokens_details?.reasoning_tokens?.toLocaleString() ?? 'N/A'}
• 予測拒否: ${debugInfo.usage?.completion_tokens_details?.rejected_prediction_tokens?.toLocaleString() ?? 'N/A'}

プロンプトトークン詳細:
• 音声: ${debugInfo.usage?.prompt_tokens_details?.audio_tokens?.toLocaleString() ?? 'N/A'}
• キャッシュ: ${debugInfo.usage?.prompt_tokens_details?.cached_tokens?.toLocaleString() ?? 'N/A'}`}
                    </code>
                  </pre>
                </div>
                
                {/* JSON表示 */}
                <details className="group">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    JSON形式で表示
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
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