'use client';

import { useState, useEffect } from 'react';

interface SessionInfo {
  id: number;
  title: string;
  createdAt: Date;
  username: string;
  messageCount: number;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      if (!response.ok) {
        throw new Error('セッション一覧の取得に失敗しました');
      }
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (sessionId: number) => {
    if (!confirm('このセッションを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('セッションの削除に失敗しました');
      }

      await fetchSessions();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 className="text-xl font-semibold text-slate-200">セッション管理</h2>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-700/50">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">セッションID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">タイトル</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">ユーザー名</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">作成日時</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">メッセージ数</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
                    {session.id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate text-slate-300">{session.title || `Chat #${session.id}`}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                    <span className="text-slate-300">{session.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">{formatDate(session.createdAt)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-slate-800/50 border border-slate-700/50 text-slate-400">
                    {session.messageCount}件
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>削除</span>
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  セッションがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}