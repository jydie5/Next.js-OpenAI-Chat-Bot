'use client';

import { useEffect } from 'react';
import { useSessionContext } from './SessionContext';

export default function SessionUpdater() {
  const { refreshSessions } = useSessionContext();

  useEffect(() => {
    // コンポーネントがマウントされたらセッションリストを更新
    refreshSessions();
  }, [refreshSessions]);

  // このコンポーネントは何も表示しない
  return null;
}