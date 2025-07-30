import Link from "next/link";
import type { Metadata } from "next";

// Enable static generation for the home page
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Home - Stream Music Online",
  description: "Welcome to Spotify MVP. Stream millions of songs, discover new artists, create playlists, and enjoy ad-free music with our premium subscription.",
  openGraph: {
    title: "Spotify MVP - Your Music, Your Way",
    description: "Start streaming millions of songs today. Sign up for free or upgrade to premium for the ultimate listening experience.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "Spotify MVP Home - Music Streaming Platform"
      }
    ],
  },
};

export default function HomePage() {
  // Structured data for the homepage
  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Spotify MVP Home",
    "description": "Stream music online with Spotify MVP. Discover new artists and create personalized playlists.",
    "url": "https://spotify-mvp.com",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Spotify MVP",
      "url": "https://spotify-mvp.com"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://spotify-mvp.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center px-4 py-8 safe-top safe-bottom">
      {/* Skip Navigation Links */}
      <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
        <Link 
          href="#main-content" 
          className="bg-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          style={{ color: '#15803d' }} // WCAG AA compliant
        >
          Skip to main content
        </Link>
      </nav>

      <main id="main-content" className="text-center text-white w-full max-w-lg mx-auto" role="main">
        <header>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">🎵 Spotify MVP</h1>
          <p className="text-lg md:text-xl mb-8">Your personalized music streaming experience</p>
        </header>
        
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Available Features</h2>
          <ul className="space-y-3 md:space-y-4 list-none text-left max-w-xs mx-auto">
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Authentication System</li>
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Music Search & Discovery</li>
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Advanced Audio Player</li>
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Playlist Management</li>
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Premium Subscriptions</li>
            <li className="text-base md:text-lg flex items-center"><span className="mr-2">✅</span> Social Features</li>
          </ul>
        </section>
        
        <section aria-labelledby="auth-actions-heading" className="mt-8">
          <h2 id="auth-actions-heading" className="sr-only">Get Started</h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center justify-center bg-white text-green-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 hover:text-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-500 min-h-[48px] w-full sm:w-auto"
              style={{ color: '#15803d' }} // WCAG AA compliant green
              aria-label="Sign in to your account"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="inline-flex items-center justify-center text-white px-8 py-4 rounded-full font-semibold hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-500 min-h-[48px] w-full sm:w-auto"
              style={{ backgroundColor: '#166534' }} // WCAG AA compliant green-800
              aria-label="Create a new account"
            >
              Sign Up
            </Link>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}