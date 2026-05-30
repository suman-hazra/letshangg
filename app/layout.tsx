import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./_components/posthog-provider";

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
  title: "letshangg",
  description: "An AI matchmaker for hangouts. No awkward texts.",
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
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
