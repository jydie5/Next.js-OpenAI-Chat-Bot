import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import ChatRoom from './ChatRoom';
import SessionUpdater from '../../components/SessionUpdater';

const prisma = new PrismaClient();

interface PageProps {
  params: {
    id: string;
  };
}

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
      <ChatRoom initialMessages={chatSession.messages} sessionId={chatSession.id} />
    </>
  );
}