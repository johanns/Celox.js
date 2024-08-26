import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/assets/css/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Celox.JS',
    description: 'Encrypted self-destructing messages',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <main className="flex min-h-screen flex-col items-center justify-between p-32">
                    {children}
                </main>
            </body>
        </html>
    );
}
