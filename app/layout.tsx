import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FilterProvider } from '@/components/providers/FilterProvider';
import Sidebar from '@/components/Layout/Sidebar';
import TopBar from '@/components/Layout/TopBar';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Denavita Ads Dashboard',
  description: 'Dashboard de performance Meta Ads — Denavita',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="h-full flex flex-col">
        <FilterProvider>
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">{children}</main>
          </div>
        </FilterProvider>
      </body>
    </html>
  );
}
