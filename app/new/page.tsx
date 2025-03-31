import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function NewChat() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // ログイン済みの場合はホームページにリダイレクト
  redirect('/');
}