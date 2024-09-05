import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/assets/css/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Secure Share',
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
                    <div className="w-full max-w-screen-lg p-10 bg-white shadow-lg rounded">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
