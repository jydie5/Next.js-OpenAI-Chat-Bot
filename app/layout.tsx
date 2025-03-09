import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from './components/SessionProvider';
import { SessionProvider as ChatSessionProvider } from './components/SessionContext';
import NavigationBar from './components/NavigationBar';
import Sidebar from './components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI ChatBot',
  description: 'A modern chat interface using OpenAI API',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ja" className="dark">
      <body className="bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
        <SessionProvider session={session}>
          <ChatSessionProvider>
            <div className="flex flex-col min-h-screen">
              <header className="h-16 glass-effect border-b border-slate-700/50">
                <div className="h-full mx-auto px-4">
                  <NavigationBar />
                </div>
              </header>

              <div className="flex flex-1">
                {session?.user && <Sidebar />}
                <main className="flex-1">{children}</main>
              </div>

              <footer className="glass-effect border-t border-slate-700/50 py-3">
                <div className="mx-auto px-4 text-center">
                  <p className="text-sm text-slate-400">
                    &copy; {new Date().getFullYear()} AI ChatBot Demo
                  </p>
                </div>
              </footer>
            </div>
          </ChatSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
