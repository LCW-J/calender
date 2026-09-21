import type { Metadata } from "next";
import "./globals.css";
import { EventProvider } from "@/lib/events/store";
import Sidebar from "@/components/Nav/Sidebar";

export const metadata: Metadata = {
  title: "時程 — 個人時間管理系統",
  description: "個人行事曆與時間管理系統",
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
        <EventProvider>
          <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col md:flex-row">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 pb-14 pt-6 md:px-9 md:pt-8">{children}</main>
          </div>
        </EventProvider>
      </body>
    </html>
  );
}
