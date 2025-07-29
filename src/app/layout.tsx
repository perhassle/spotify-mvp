import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Spotify MVP - Music Streaming Platform",
  description: "A modern music streaming platform built with Next.js, TypeScript, and Tailwind CSS",
  keywords: ["music", "streaming", "spotify", "nextjs", "typescript"],
  authors: [{ name: "Spotify MVP Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1ed760",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}