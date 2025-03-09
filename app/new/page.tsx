import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SessionUpdater from '@/app/components/SessionUpdater';

export default async function NewChat() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // 新規セッションを作成
  const newSession = await prisma.session.create({
    data: {
      userId: parseInt(session.user.id),
      title: '新規チャット', // 最初のメッセージで後で更新
      messages: {
        create: [] // 初期メッセージなし
      }
    }
  });

  // 作成したセッションページにリダイレクト
  redirect(`/chat/${newSession.id}`);
}