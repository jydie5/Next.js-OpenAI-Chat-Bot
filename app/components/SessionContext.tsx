'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const { status: authStatus } = useSession();

  const fetchSessions = async () => {
    // すでに更新中なら処理をスキップ
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      setLoading(true);
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
      
      // リフレッシュ完了後、一定時間経過してからフラグをリセット
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        isRefreshingRef.current = false;
      }, 500); // 500ミリ秒のクールダウン
    }
  };

  // 初期ロードとクリーンアップ
  useEffect(() => {
    fetchSessions();
    
    return () => {
      // クリーンアップ関数
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // 認証状態が変化したときにセッションリストを更新
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchSessions();
    } else if (authStatus === 'unauthenticated') {
      // 未認証状態ではセッションリストをクリア
      setSessions([]);
    }
  }, [authStatus]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        loading,
        refreshSessions: fetchSessions
      }}
    >
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