import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ChatRoom from './ChatRoom';
import SessionUpdater from '../../components/SessionUpdater';
import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: PageProps) {
  // キャッシュを完全に無効化
  noStore();

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  try {
    const chatSession = await prisma.session.findUnique({
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

    if (!chatSession) {
      redirect('/');
    }

    // 他のユーザーのセッションへのアクセスを防ぐ
    if (chatSession.userId !== parseInt(session.user.id)) {
      redirect('/');
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