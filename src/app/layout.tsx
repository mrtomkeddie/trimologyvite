import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: 'Trimology',
  description: 'Get the best haircut and beauty services from our award-winning team',
  manifest: '/manifest.json?v=1',
  icons: {
    icon: [
        { url: '/trimology-logo.png?v=1', type: 'image/png', sizes: '192x192' },
        { url: '/trimology-logo.png?v=1', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
        { url: '/trimology-logo.png?v=1', type: 'image/png' },
        { url: '/trimology-logo.png?v=1', type: 'image/png', sizes: '180x180' }
    ],
    shortcut: '/trimology-logo.png?v=1'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
