import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from './components/SessionProvider';
import NavigationBar from './components/NavigationBar';
import Sidebar from './components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenAI Chat Bot',
  description: 'A simple chat interface using OpenAI API',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ja">
      <body>
        <SessionProvider session={session}>
          <div className="flex flex-col min-h-screen">
            <header className="bg-primary-500 text-white py-4">
              <div className="container mx-auto px-4">
                <NavigationBar />
              </div>
            </header>
            <div className="flex flex-1">
              {session?.user && <Sidebar />}
              <main className="flex-1 px-4 py-8">
                {children}
              </main>
            </div>
            <footer className="bg-gray-100 py-4">
              <div className="container mx-auto px-4 text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} OpenAI Chat Bot Demo</p>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
