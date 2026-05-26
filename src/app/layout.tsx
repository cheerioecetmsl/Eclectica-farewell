import type { Metadata, Viewport } from "next";
import { Kalam, Patrick_Hand, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PresenceTracker } from "@/components/PresenceTracker";

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  subsets: ["latin"],
  weight: "400",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-circuit",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Eclectica Farewell 2026 | The Archival Legacy",
  description: "A journey of a thousand memories begins with a single frame. Preserve the legacy of the Batch of 2026.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eclectica Farewell",
  },
  applicationName: "Eclectica Farewell",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${kalam.variable} ${patrickHand.variable} ${shareTechMono.variable} antialiased min-h-screen theme-hand-drawn`}>
        <PresenceTracker />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
