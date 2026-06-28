import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
import './globals.css';
import { TopBar } from '@/components/hud/TopBar';
import { ParticleField } from '@/components/fx/ParticleField';
import { BootGate } from '@/components/boot/BootGate';
import { Companion } from '@/components/companion/Companion';
import { LevelUpWatcher } from '@/components/state/LevelUpWatcher';
import { CareerSyncWatcher } from '@/components/state/CareerSyncWatcher';
import { PromotionCeremony } from '@/components/state/PromotionCeremony';
import { MentorWatcher } from '@/components/state/MentorWatcher';

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
        <ParticleField />
        <div className="relative z-10">
          <TopBar />
          <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        </div>
        <Companion />
        <LevelUpWatcher />
        <CareerSyncWatcher />
        <PromotionCeremony />
        <MentorWatcher />
        <BootGate />
      </body>
    </html>
  );
}
