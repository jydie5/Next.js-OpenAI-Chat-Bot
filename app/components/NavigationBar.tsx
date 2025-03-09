'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NavigationBar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold">
        OpenAI Chat Bot
      </Link>
      
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-sm">
              {session.user.name}
              {session.user.isRoot && ' (管理者)'}
            </span>
            {session.user.isRoot && (
              <Link
                href="/admin"
                className="text-sm hover:text-gray-200 transition-colors"
              >
                管理画面
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
            >
              ログアウト
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          >
            ログイン
          </Link>
        )}
      </div>
    </nav>
  );
}