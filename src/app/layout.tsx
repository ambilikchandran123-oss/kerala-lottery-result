import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

export const viewport: Viewport = {
  themeColor: "#C9A227",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kerala Lottery Result Checker | Official Gazette Verification",
  description: "High-accuracy, draw-specific Kerala State Lottery ticket verification system anchored to official published gazette source documents.",
  keywords: [
    "Kerala Lottery Result",
    "Kerala Lottery Result Today",
    "Kerala Lottery Ticket Checker",
    "Kerala Lottery Previous Results",
    "Kerala Lottery PDF",
    "Kerala Lottery Results Malayalam"
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Kerala Lottery Result Checker",
    description: "High-accuracy Kerala State Lottery result verification system.",
    type: "website",
    locale: "en_IN"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ml">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@400;500;600;700;800&family=Anek+Malayalam:wght@400;500;600;700;800&family=Anek+Tamil:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <meta name="theme-color" content="#C9A227" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen flex flex-col text-[#1D221F] selection:bg-[#C9A227] selection:text-[#1C1404]">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
            {children}
          </main>
          <BottomNav />
        </LanguageProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
