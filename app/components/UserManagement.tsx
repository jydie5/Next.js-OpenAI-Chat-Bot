'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';

interface UserWithSessionCount extends Omit<User, 'password'> {
  _count: {
    sessions: number;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithSessionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithSessionCount | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isRoot: false,
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingUser && { id: editingUser.id }),
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      await fetchUsers();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('ユーザーの削除に失敗しました');
      }

      await fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      isRoot: false,
    });
    setEditingUser(null);
  };

  const handleEdit = (user: UserWithSessionCount) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // パスワードは空にする（変更時のみ入力）
      isRoot: user.isRoot,
    });
    setIsModalOpen(true);
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-200">ユーザー管理</h2>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="primary-button flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新規ユーザー作成
        </button>
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
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">ユーザー名</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">作成日時</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">権限</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">セッション数</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-slate-300">{user.username}</td>
                <td className="px-6 py-4 text-slate-400">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isRoot 
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/50' 
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/50'
                  }`}>
                    {user.isRoot ? '管理者' : 'ユーザー'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{user._count.sessions}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-effect rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editingUser ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                )}
              </svg>
              <h3 className="text-xl font-semibold text-slate-200">
                {editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">ユーザー名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 
                           text-slate-200 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  パスワード
                  {editingUser && (
                    <span className="text-slate-500 ml-1">（変更する場合のみ入力）</span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 
                           text-slate-200 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  {...(!editingUser && { required: true })}
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRoot}
                    onChange={(e) => setFormData({ ...formData, isRoot: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-sky-500 rounded border-slate-700 
                             bg-slate-800/50 focus:ring-offset-slate-900 focus:ring-sky-500"
                  />
                  <span className="ml-2 text-slate-300">管理者権限</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="secondary-button"
                >
                  キャンセル
                </button>
                <button type="submit" className="primary-button">
                  {editingUser ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}