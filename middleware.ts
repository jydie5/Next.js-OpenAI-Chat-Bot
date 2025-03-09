import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 管理者ページへのアクセス制御のみをここで行う
    if (path.startsWith('/admin') && !token?.isRoot) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const publicPaths = [
          '/_next',        // Next.jsのシステムファイル
          '/api/auth',     // 認証API
          '/favicon.ico',  // ファビコン
          '/sitemap.xml'   // サイトマップ
        ];

        // パブリックパスは常にアクセス可能
        if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
          return true;
        }

        // ログインページは未認証ユーザーのみアクセス可能
        if (req.nextUrl.pathname === '/login') {
          return !token;
        }

        // その他のパスは認証が必要
        return !!token;
      },
    },
  }
);

// 保護するパスを設定
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (auth endpoints)
     * 2. /_next/* (Next.js internals)
     * 3. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api/auth|_next|favicon.ico|sitemap.xml).*)',
  ],
};