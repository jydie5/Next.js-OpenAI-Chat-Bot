import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ChatRoom from './ChatRoom';
import SessionUpdater from '../../components/SessionUpdater';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
    return null; // Safariでのリダイレクト処理を確実にする
  }

  try {
    // セッションIDの型チェック
    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      redirect('/');
      return null;
    }

    const chatSession = await prisma.$transaction(async (tx) => {
      const result = await tx.session.findUnique({
        where: {
          id: parseInt(params.id),
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          user: true,
        },
      });

      if (!result) {
        return null;
      }

      // 他のユーザーのセッションへのアクセスを防ぐ
      if (result.userId !== parseInt(session.user.id)) {
        return null;
      }

      return result;
    });

    if (!chatSession) {
      redirect('/');
      return null;
    }

    // データ取得時のタイムスタンプを追加
    const timestamp = Date.now();

    return (
      <>
        <SessionUpdater />
        <ChatRoom 
          key={`${chatSession.id}-${timestamp}`} // キーを更新時刻も含めて設定
          initialMessages={chatSession.messages} 
          sessionId={chatSession.id} 
        />
      </>
    );
  } catch (error) {
    console.error('Error fetching chat session:', error);
    redirect('/');
  }
}