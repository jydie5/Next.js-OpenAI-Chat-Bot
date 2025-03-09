import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenAI Chat Bot',
  description: 'A simple chat interface using OpenAI API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex flex-col min-h-screen">
          <header className="bg-primary-500 text-white py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-2xl font-bold">OpenAI Chat Bot</h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-100 py-4">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} OpenAI Chat Bot Demo</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
