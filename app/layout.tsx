import './globals.css';
import type { Metadata, Viewport } from 'next';
import SWRegister from './sw-register';

export const metadata: Metadata = {
  title: 'Nova AI Chat',
  description: 'Chat AI pribadi ala ChatGPT — chat, coding, dan buat gambar.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nova AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-white text-gray-900">
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
