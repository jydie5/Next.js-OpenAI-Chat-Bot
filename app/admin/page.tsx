'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import UserManagement from '../components/UserManagement';
import SessionManagement from '../components/SessionManagement';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'users' | 'sessions'>('users');

  if (status === 'loading') {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  if (!session?.user?.isRoot) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理画面</h1>

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
            >
              ユーザー管理
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
            >
              セッション管理
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'users' ? <UserManagement /> : <SessionManagement />}
      </div>
    </div>
  );
}