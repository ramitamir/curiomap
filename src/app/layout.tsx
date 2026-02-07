import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeClient from '@/components/ThemeClient';
import ThemeToggleButton from '@/components/ThemeToggleButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Curio Space',
  description: 'Transform any subject into a navigable 2D coordinate map of AI-generated curiosities',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeClient />
        <ThemeToggleButton />
        {children}
      </body>
    </html>
  );
}
