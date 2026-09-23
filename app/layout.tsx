import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EventProvider } from "@/lib/events/store";
import Sidebar from "@/components/Nav/Sidebar";
import PWARegister from "@/components/PWA/PWARegister";
import { PWAInstallProvider } from "@/components/PWA/PWAInstallCard";
import AuthSessionProvider from "@/components/Auth/AuthSessionProvider";
import AppShell from "@/components/Nav/AppShell";
import SyncStatusBanner from "@/components/Sync/SyncStatusBanner";
import { TaskProvider } from "@/lib/tasks/store";

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
  themeColor: "#f7f1e7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthSessionProvider>
          <PWAInstallProvider>
            <EventProvider>
              <TaskProvider>
                <PWARegister />
                <SyncStatusBanner />
                <AppShell sidebar={<Sidebar />}>{children}</AppShell>
              </TaskProvider>
            </EventProvider>
          </PWAInstallProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
