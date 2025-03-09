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

  // URLが変わった時だけセッションリストを更新し、無限リフレッシュを防止
  useEffect(() => {
    // 実際にパスが変わった場合のみリフレッシュを実行
    if (prevPathRef.current !== pathname) {
      refreshSessions();
      prevPathRef.current = pathname;
    }
  }, [pathname, refreshSessions]);

  const handleNewChat = async () => {
    try {
      // 連続クリック防止
      if (isCreatingChat) return;
      
      setIsCreatingChat(true);
      
      // APIを使って新規セッションを作成
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
      
      // セッションリストを更新
      await refreshSessions();
      
      // 作成されたチャットルームに遷移
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
    <div className="w-64 h-[calc(100vh-theme(spacing.16))] bg-gray-800 text-white p-4 flex flex-col">
      <button
        onClick={handleNewChat}
        disabled={isCreatingChat}
        className={`w-full ${
          isCreatingChat ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-bold py-2 px-4 rounded mb-4 transition-colors`}
      >
        {isCreatingChat ? '作成中...' : '新規チャット'}
      </button>
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center text-gray-400">読み込み中...</div>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <Link
              key={session.id}
              href={`/chat/${session.id}`}
              className={`block p-3 rounded-lg transition-colors ${
                pathname === `/chat/${session.id}`
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="font-medium truncate">{session.title}</div>
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{formatDate(session.createdAt)}</span>
                <span>{session._count.messages}件</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-400">
            チャット履歴がありません
          </div>
        )}
      </div>
    </div>
  );
}