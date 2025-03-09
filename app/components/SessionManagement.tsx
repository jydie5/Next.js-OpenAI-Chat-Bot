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
    return <div className="text-center p-4">読み込み中...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">セッション管理</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">セッションID</th>
              <th className="px-6 py-3 text-left">タイトル</th>
              <th className="px-6 py-3 text-left">ユーザー名</th>
              <th className="px-6 py-3 text-left">作成日時</th>
              <th className="px-6 py-3 text-left">メッセージ数</th>
              <th className="px-6 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{session.id}</td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate">{session.title}</div>
                </td>
                <td className="px-6 py-4">{session.username}</td>
                <td className="px-6 py-4">{formatDate(session.createdAt)}</td>
                <td className="px-6 py-4">{session.messageCount}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}