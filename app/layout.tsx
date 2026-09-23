import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EventProvider } from "@/lib/events/store";
import Sidebar from "@/components/Nav/Sidebar";
import PWARegister from "@/components/PWA/PWARegister";
import { PWAInstallProvider } from "@/components/PWA/PWAInstallCard";
import AuthSessionProvider from "@/components/Auth/AuthSessionProvider";
import AppShell from "@/components/Nav/AppShell";

export const metadata: Metadata = {
  title: "時程 — 個人時間管理系統",
  description: "個人行事曆與時間管理系統",
  applicationName: "時程",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "時程",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12151c",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthSessionProvider>
          <PWAInstallProvider>
            <EventProvider>
              <PWARegister />
              <AppShell sidebar={<Sidebar />}>{children}</AppShell>
            </EventProvider>
          </PWAInstallProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
