"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/today", label: "今日", icon: "sun" },
  { href: "/weekly", label: "週計畫", icon: "columns" },
  { href: "/calendar", label: "行事曆", icon: "calendar" },
  { href: "/settings", label: "設定", icon: "settings" },
] as const;

function NavIcon({ name }: { name: (typeof NAV_ITEMS)[number]["icon"] }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>;
  if (name === "columns") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M15 4v16"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.97a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.03 4.2l.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.03 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.97 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  return (
    <nav aria-label="主要導覽" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[24px] border border-white/70 bg-[#fffaf3]/90 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-xl md:sticky md:left-auto md:top-6 md:ml-5 md:mt-6 md:h-[calc(100vh-3rem)] md:w-[220px] md:shrink-0 md:grid-cols-1 md:grid-rows-[auto_repeat(4,auto)_1fr] md:gap-1.5 md:rounded-[28px] md:border-border/80 md:p-4 md:pb-5">
      <div className="mb-7 hidden items-center gap-3 px-2 pt-2 md:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white shadow-[0_8px_18px_rgba(198,107,75,0.22)]">時</span>
        <div><div className="text-lg font-bold tracking-[0.12em]">時程</div><div className="text-[10px] tracking-wider text-text-faint">CALENDAR</div></div>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5 text-[10.5px] font-semibold md:min-h-0 md:flex-row md:justify-start md:gap-3 md:px-3.5 md:py-3 md:text-sm ${active ? "bg-accent-dim text-[#9b5138] shadow-[inset_0_0_0_1px_rgba(214,129,95,.08)]" : "text-text-dim hover:bg-white/60 hover:text-text"}`} aria-current={active ? "page" : undefined}>
            <span className={active ? "text-accent" : "text-text-faint"}><NavIcon name={item.icon} /></span>
            {item.label}
            {active && <span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-accent md:bottom-auto md:left-0 md:h-5 md:w-1" />}
          </Link>
        );
      })}
      <div className="mt-auto hidden self-end px-2 pt-4 text-xs leading-relaxed text-text-faint md:block">
        <div className="mb-3 truncate rounded-xl bg-surface2/60 px-3 py-2 text-text-dim" title={session?.user?.email || undefined}>{session?.user?.email}</div>
        <button type="button" onClick={() => void signOut({ callbackUrl: "/signin" })} className="px-2 py-1 text-text-faint hover:text-accent">登出</button>
      </div>
    </nav>
  );
}
