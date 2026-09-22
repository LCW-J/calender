"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/today", label: "今日", glyph: "◆" },
  { href: "/weekly", label: "週計畫", glyph: "▤" },
  { href: "/calendar", label: "行事曆", glyph: "▦" },
  { href: "/settings", label: "設定", glyph: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-bg/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:sticky md:top-0 md:h-screen md:w-[220px] md:shrink-0 md:grid-cols-1 md:grid-rows-[auto_repeat(4,auto)_1fr] md:items-stretch md:gap-1 md:border-r md:border-t-0 md:bg-transparent md:px-4 md:py-7 md:backdrop-blur-none"
    >
      <div className="mb-7 hidden items-baseline gap-2 px-2 text-xl font-bold tracking-tight md:flex">
        時<span className="text-accent">程</span>
        <small className="text-[11px] font-normal text-text-faint">PWA</small>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-card px-1 py-1.5 text-[11px] font-medium transition-colors md:min-h-0 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:py-2.5 md:text-sm ${
              active ? "bg-surface2 text-text" : "text-text-dim hover:bg-surface hover:text-text"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className={`text-base md:w-4 md:text-center md:text-sm ${active ? "text-accent" : "text-text-faint"}`}>
              {item.glyph}
            </span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto hidden self-end px-2 pt-4 text-xs leading-relaxed text-text-faint md:block">
        Single Source of Truth
        <br />
        Today / Weekly / Calendar 即時同步
      </div>
    </nav>
  );
}
