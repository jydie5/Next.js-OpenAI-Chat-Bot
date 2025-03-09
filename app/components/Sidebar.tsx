'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from './SessionContext';

export default function Sidebar() {
  const { sessions, loading, refreshSessions } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      refreshSessions();
      prevPathRef.current = pathname;
    }
  }, [pathname, refreshSessions]);

  const handleNewChat = async () => {
    try {
      if (isCreatingChat) return;
      setIsCreatingChat(true);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('新規チャットの作成に失敗しました');
      }
      
      const data = await response.json();
      await refreshSessions();
      router.push(`/chat/${data.session.id}`);
    } catch (error) {
      console.error('エラー:', error);
      alert('新規チャットの作成に失敗しました');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-72 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="h-full glass-effect">
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={handleNewChat}
            disabled={isCreatingChat}
            className="w-full primary-button flex items-center justify-center gap-2 py-3"
          >
            {isCreatingChat ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>作成中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>新規チャット</span>
              </>
            )}
          </button>
        </div>

        <div className="h-[calc(100%-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400 flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>読み込み中...</span>
              </div>
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/chat/${session.id}`}
                className={`block p-3 rounded-xl transition-all duration-200 border 
                  ${pathname === `/chat/${session.id}`
                    ? 'bg-slate-700/50 border-sky-500/50 shadow-lg shadow-sky-500/10'
                    : 'border-transparent hover:bg-slate-700/30 hover:border-slate-600/50'
                  }`}
              >
                <div className="font-medium text-slate-200 truncate">
                  {session.title || `Chat #${session.id}`}
                </div>
                <div className="flex justify-between text-sm text-slate-400 mt-1">
                  <span>{formatDate(session.createdAt)}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 border border-slate-600/50">
                    {session._count.messages}件
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 
                            flex items-center justify-center shadow-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="text-slate-400">
                <p className="font-medium mb-1">チャット履歴がありません</p>
                <p className="text-sm text-slate-500">新規チャットを作成してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}