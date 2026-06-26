import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
import './globals.css';
import { TopBar } from '@/components/hud/TopBar';

const display = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '800'],
});
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Project ARC Reactor — Theory of Automata',
  description:
    'The Future of Computer Science Education. Learn Theory of Automata inside a living laboratory.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
