import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

import "./globals.css";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

// Premium display font
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Clean readable body font
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// SEO Metadata
export const metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: `${siteConfig.name} | All-in-One AI Creative Studio`,
    template: `%s | ${siteConfig.name}`,
  },

  description: siteConfig.description,
  applicationName: siteConfig.name,

  keywords: [
    "AI Studio",
    "AI Image Generator",
    "AI Video Generator",
    "AI Background Remover",
    "AI Photo Editor",
    "AI Avatar Generator",
    "AI Content Generator",
    "AI Tools",
    "AI Creative Platform",
  ],

  authors: [{ name: "Zubi AI Studio" }],
  creator: "Zubi AI Studio",

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(display.variable, body.variable)}
    >
      <body className="min-h-screen font-sans antialiased dark:bg-gray-800 dark:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="zubi-ai-theme"
        >
          <AuthProvider>
            <SiteHeader />

            <main
              id="main-content"
              className="mx-auto min-h-screen w-full max-w-7xl px-4 sm:px-6 lg:px-8"
            >
              {children}
            </main>

            <SiteFooter />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
