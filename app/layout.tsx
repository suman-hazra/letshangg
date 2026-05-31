import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./_components/posthog-provider";
import { DesktopGate } from "./_components/desktop-gate";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  applicationName: "letshangg",
  title: "letshangg",
  description: "An AI matchmaker for hangouts. No awkward texts.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "letshangg",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8D6",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${dmSans.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PostHogProvider>
          <DesktopGate>{children}</DesktopGate>
        </PostHogProvider>
      </body>
    </html>
  );
}
