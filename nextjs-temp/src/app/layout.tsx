import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextAuthProvider from '@/providers/NextAuthProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/providers/ThemeProvider';
import HelpButton from '@/components/HelpButton';
import CookieConsent from '@/components/CookieConsent';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sonne - AI Document Analysis',
  description: 'Advanced AI-powered document analysis for professionals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              {children}
              <HelpButton />
              <CookieConsent />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: "!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !shadow-md",
                }}
              />
              <Analytics />
              <SpeedInsights />
            </SidebarProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
