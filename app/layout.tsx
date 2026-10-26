import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import { GeistMono } from "geist/font/mono";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SyncBoot } from "@/components/SyncBoot";
import { ThemeSync } from "@/components/ThemeSync";
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

// Runs before the first paint so a light-theme choice doesn't flash dark (dark is the default).
const THEME_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("sw_prefs_v1")||"{}").theme;var r=document.documentElement;if(t==="light")r.setAttribute("data-theme","light");else if(t==="system")r.removeAttribute("data-theme")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${GeistMono.variable} antialiased`}>
        {children}
        <ServiceWorker />
        <SyncBoot />
        <ThemeSync />
      </body>
    </html>
  );
}
