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

  if (!session?.user?.isRoot) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 
                      flex items-center justify-center shadow-lg shadow-sky-500/30">
          <span className="text-2xl">⚙️</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">管理画面</h1>
      </div>

      <div className="glass-effect rounded-xl shadow-xl shadow-black/10 overflow-hidden">
        <div className="border-b border-slate-700/50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-sky-500 text-sky-400 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium transition-all duration-200`}
            >
              ユーザー管理
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`${
                activeTab === 'sessions'
                  ? 'border-sky-500 text-sky-400 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium transition-all duration-200`}
            >
              セッション管理
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'users' ? <UserManagement /> : <SessionManagement />}
        </div>
      </div>
    </div>
  );
}