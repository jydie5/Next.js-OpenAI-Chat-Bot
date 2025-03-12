import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ChatRoom from './ChatRoom';
import SessionUpdater from '../../components/SessionUpdater';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: {
    id: string;
  };
}

// データの再検証を無効化して、キャッシュを防ぐ
export const revalidate = 0;

export default async function ChatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

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

  return (
    <>
      <SessionUpdater />
      <ChatRoom 
        key={chatSession.id} // キーを追加して強制的に再マウント
        initialMessages={chatSession.messages} 
        sessionId={chatSession.id} 
      />
    </>
  );
}