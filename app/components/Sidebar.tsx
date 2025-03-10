'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from './SessionContext';
import { useSession } from 'next-auth/react';

// 日付フォーマット関数
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}`;
};

export default function Sidebar() {
  const { sessions, loading, refreshSessions } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const { status: authStatus } = useSession();

  // セッションを作成日時の降順でソート
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sessions]);

  const handlePathChange = useCallback(() => {
    if (prevPathRef.current !== pathname && pathname?.startsWith('/chat/')) {
      refreshSessions();
      prevPathRef.current = pathname;
    }
  }, [pathname, refreshSessions]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    // パスの変更を監視
    handlePathChange();
  }, [authStatus, router, handlePathChange]);

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
      console.error('新規チャット作成エラー:', error);
      alert('新規チャットの作成に失敗しました');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('このチャットを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('チャットの削除に失敗しました');
      }

      await refreshSessions();
      
      // 削除したセッションが現在表示中のセッションだった場合、ホームにリダイレクト
      if (pathname === `/chat/${sessionId}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('チャット削除エラー:', error);
      alert('チャットの削除に失敗しました');
    }
  };

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <aside className="w-80 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900/50 border-r border-slate-700/50 p-4">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-800/50 rounded-xl mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900/50 border-r border-slate-700/50 p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <button
        onClick={handleNewChat}
        disabled={isCreatingChat}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 
                 hover:from-sky-400 hover:to-blue-500 transition-all duration-200 
                 text-white font-medium shadow-lg shadow-blue-500/20
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreatingChat ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>作成中...</span>
          </div>
        ) : (
          <span>新規チャット</span>
        )}
      </button>

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl"></div>
            ))}
          </div>
        ) : sortedSessions.length > 0 ? (
          sortedSessions.map((session) => (
            <div key={session.id} className="group relative">
              <Link
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
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100
                         bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300
                         transition-all duration-200"
                title="このチャットを削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 
                          flex items-center justify-center shadow-lg">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-slate-400">チャット履歴がありません</p>
            <p className="text-sm text-slate-500">上のボタンから新しいチャットを開始してください</p>
          </div>
        )}
      </div>
    </aside>
  );
}