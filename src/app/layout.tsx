import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { withAuth } from "@workos-inc/authkit-nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dangerously Ship — AI Wins & Sins",
  description:
    "Post AI fails and wins. Vote on the best. Buy the t-shirt. Featuring our mascot: the lobster who ships dangerously.",
  openGraph: {
    title: "Dangerously Ship",
    description: "AI Wins & Sins — Community curated, lobster approved.",
    siteName: "Dangerously Ship",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { accessToken, ...initialAuth } = await withAuth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialAuth={initialAuth}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
