// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import { AmplitudeProvider } from '@/app/context/AmplitudeContext';
import Script from 'next/script';
import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bents Woodworking Assistant",
  description: "A woodworking assistant for Bents",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <head>
          <Script
            src="https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz"
            strategy="beforeInteractive"
          />
          <Script
            src="https://cdn.amplitude.com/libs/plugin-session-replay-browser-1.6.22-min.js.gz"
            strategy="beforeInteractive"
          />
          
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <AmplitudeProvider apiKey={process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY}>
            {children}
          </AmplitudeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
