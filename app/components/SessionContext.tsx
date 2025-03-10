'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from '@prisma/client';

interface SessionWithMessageCount extends Session {
  _count: {
    messages: number;
  };
}

interface SessionContextType {
  sessions: SessionWithMessageCount[];
  loading: boolean;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionWithMessageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const { status: authStatus } = useSession();

  const fetchSessions = useCallback(async (force = false) => {
    // 強制更新でない場合、現在実行中のリフレッシュがあればスキップ
    if (!isMountedRef.current || (!force && isRefreshingRef.current)) return;

    try {
      isRefreshingRef.current = true;
      // 実行中のデバウンスタイマーをキャンセル
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // 即時にローディング状態を設定
      setLoading(true);

      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error('セッションの取得に失敗しました');
      }

      if (!isMountedRef.current) return;

      const data = await response.json();
      // セッションを作成日時の降順（新しい順）でソート
      const sortedSessions = data.sessions.sort((a: SessionWithMessageCount, b: SessionWithMessageCount) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setSessions(sortedSessions);
    } catch (error) {
      console.error('セッション取得エラー:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isRefreshingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (authStatus === 'authenticated') {
      // 認証状態になったら即時にセッションを取得
      fetchSessions(true);
    } else if (authStatus === 'unauthenticated') {
      setSessions([]);
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [authStatus, fetchSessions]);

  const value = React.useMemo(() => ({
    sessions,
    loading,
    refreshSessions: fetchSessions,
  }), [sessions, loading, fetchSessions]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}