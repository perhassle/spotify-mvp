import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider } from "@/lib/auth/provider";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ErrorProvider } from "@/providers/error-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ClientInitializer } from "@/components/common/client-initializer";
import { handleErrorBoundaryError } from "@/lib/error-tracking";
import { MonitoringProvider } from "@/lib/monitoring/monitoring-provider";
import { PerformanceMonitor } from "@/components/monitoring/performance-monitor";
import { DevelopmentMonitoringToolbar } from "@/components/monitoring/monitoring-dashboard";

// const inter = Inter({ 
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: 'swap', // Optimize font loading
// });

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "Spotify MVP - Your Music, Your Way | Stream Music Online",
    template: "%s | Spotify MVP"
  },
  description: "Stream millions of songs, discover new artists, and create personalized playlists. Join Spotify MVP for the ultimate music streaming experience with high-quality audio and exclusive features.",
  keywords: ["music streaming", "online music", "spotify alternative", "music player", "playlists", "artists", "albums", "podcasts", "audio streaming", "music discovery"],
  authors: [{ name: "Spotify MVP Team" }],
  creator: "Spotify MVP",
  publisher: "Spotify MVP",
  
  // Viewport and theme - Mobile-first optimized
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5, // Allow zooming for accessibility
    userScalable: true,
    viewportFit: "cover", // For iPhone X+ notch support
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1ed760" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" }
  ],
  
  // Manifest and icons
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon-180x180.png", sizes: "180x180" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
      }
    ]
  },
  
  // Open Graph metadata
  openGraph: {
    type: "website",
    siteName: "Spotify MVP",
    title: "Spotify MVP - Your Music, Your Way",
    description: "Stream millions of songs, discover new artists, and create personalized playlists. Join Spotify MVP for the ultimate music streaming experience.",
    url: "https://spotify-mvp.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spotify MVP - Music Streaming Platform"
      }
    ],
    locale: "en_US",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Spotify MVP - Your Music, Your Way",
    description: "Stream millions of songs, discover new artists, and create personalized playlists with Spotify MVP.",
    creator: "@spotifymvp",
    images: ["/twitter-image.png"],
  },
  
  // Robots and verification
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Additional metadata
  category: "music",
  classification: "Music Streaming Service",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Apple-specific web app metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Spotify MVP",
  },
  
  // Other mobile-specific metadata
  applicationName: "Spotify MVP",
  alternates: {
    canonical: "https://spotify-mvp.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Spotify MVP",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "description": "Stream millions of songs, discover new artists, and create personalized playlists with Spotify MVP - the ultimate music streaming platform.",
    "url": "https://spotify-mvp.com",
    "logo": "https://spotify-mvp.com/logo.png",
    "sameAs": [
      "https://twitter.com/spotifymvp",
      "https://facebook.com/spotifymvp",
      "https://instagram.com/spotifymvp"
    ],
    "offers": {
      "@type": "Offer",
      "name": "Spotify MVP Premium",
      "description": "Ad-free music streaming with offline downloads and high-quality audio",
      "price": "9.99",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "10000"
    },
    "provider": {
      "@type": "Organization",
      "name": "Spotify MVP",
      "url": "https://spotify-mvp.com"
    }
  };

  return (
    <html lang="en" className="">{/* className={inter.variable} */}
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://spotify-mvp.com" />
        
        {/* Alternate languages */}
        <link rel="alternate" hrefLang="en" href="https://spotify-mvp.com" />
        <link rel="alternate" hrefLang="es" href="https://spotify-mvp.com/es" />
        <link rel="alternate" hrefLang="x-default" href="https://spotify-mvp.com" />
        
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
      </head>
      <body className={`antialiased`}>{/* className={`${inter.className} antialiased`} */}
        <ErrorBoundary onError={handleErrorBoundaryError}>
          <ErrorProvider>
            <ToastProvider>
              <MonitoringProvider
                enableSentry={process.env.NODE_ENV === 'production'}
                enableWebVitals={true}
                enableErrorMonitoring={true}
              >
                <ClientInitializer />
                <PerformanceMonitor
                  enableRUM={true}
                  enableWebVitals={true}
                  sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 1}
                />
                <AuthProvider>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </AuthProvider>
                <DevelopmentMonitoringToolbar />
              </MonitoringProvider>
            </ToastProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}