'use client';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NavigationBar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-slate-200/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <span className="text-xl font-bold gradient-text">ChatBot</span>
        </Link>
        
        <div className="flex items-center gap-6">
          {session?.user ? (
            <>
              <span className="text-sm text-slate-300">
                {session.user.name}
                {session.user.isRoot && ' (管理者)'}
              </span>
              {session.user.isRoot && (
                <Link
                  href="/admin"
                  className="text-sm text-slate-300 hover:text-sky-400 transition-colors"
                >
                  管理画面
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="secondary-button text-sm"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="primary-button text-sm"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}