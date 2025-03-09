'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Session } from '@prisma/client';

interface SessionWithMessageCount extends Session {
  _count: {
    messages: number;
  };
}

export default function Sidebar() {
  const [sessions, setSessions] = useState<SessionWithMessageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) {
          throw new Error('セッションの取得に失敗しました');
        }
        const data = await response.json();
        setSessions(data.sessions);
      } catch (error) {
        console.error('エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleNewChat = () => {
    router.push('/new');
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 transition-colors"
      >
        新規チャット
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