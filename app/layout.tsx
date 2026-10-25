import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speakwise",
  description: "Your personal AI English speaking coach.",
  applicationName: "Speakwise",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Speakwise",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
