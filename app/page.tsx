import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">ログインしてください...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          チャットを始めましょう
        </h2>
        <p className="text-gray-600">
          左のサイドバーから過去のチャットを選択するか、
          <br />
          新規チャットを開始してください。
        </p>
      </div>
    </div>
  );
}