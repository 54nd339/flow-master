import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  metadataBase: new URL("https://flow.sandeepswain.dev"),
  title: { default: "FlowMaster", template: "%s | FlowMaster" },
  description: "Numberlink puzzle generator and player — grids up to 50×50, daily challenges, campaigns, and more.",
  applicationName: "FlowMaster",
  keywords: ["numberlink", "puzzle", "flow", "game", "daily challenge", "campaign", "brain teaser", "logic puzzle"],
  authors: [{ name: "FlowMaster" }],
  creator: "FlowMaster",
  openGraph: {
    title: "FlowMaster",
    description: "Numberlink puzzle generator and player — grids up to 50×50, daily challenges, campaigns, and more.",
    url: "https://flow.sandeepswain.dev",
    siteName: "FlowMaster",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FlowMaster — Numberlink Puzzle Game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowMaster",
    description: "Numberlink puzzle generator and player — grids up to 50×50, daily challenges, campaigns, and more.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white font-sans antialiased dark:bg-zinc-950`}
      >
        <Link
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </Link>
        <ThemeProvider>
          <main id="main-content">
            {children}
          </main>
        </ThemeProvider>
        <noscript>
          <p className="p-8 text-center">
            JavaScript is required to run FlowMaster.
          </p>
        </noscript>
      </body>
    </html>
  );
}
