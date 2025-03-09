import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import { authOptions } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">すでにログインしています...</p>
      </div>
    );
  }

  return <LoginForm />;
}