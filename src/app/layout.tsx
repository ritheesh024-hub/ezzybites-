
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BrandIntro } from '@/components/BrandIntro';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Ezzy Bites | Premium Fast Food Cafe',
  description: 'Experience premium fast food redefined. Quality, speed, and taste unified in one perfect bite. Order now for 30-min delivery.',
  keywords: 'Fast Food, Biryani, Maggie, Momos, Ice Cream, Hyderabad, Pocharam, Anurag University',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ezzy Bites',
  },
  openGraph: {
    title: 'Ezzy Bites | Premium Fast Food Cafe',
    description: 'Order the legendary Maggie and Biryani variations. Fresh. Fast. Premium.',
    url: 'https://ezzybites.vercel.app',
    siteName: 'Ezzy Bites',
    images: [
      {
        url: 'https://picsum.photos/seed/ezzybites-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'Ezzy Bites Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ezzy Bites | Premium Fast Food Cafe',
    description: 'Elevate your daily ritual with chef-crafted flavors.',
    images: ['https://picsum.photos/seed/ezzybites-og/1200/630'],
  }
};

export const viewport: Viewport = {
  themeColor: '#ef4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <FirebaseClientProvider>
          <BrandIntro />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
