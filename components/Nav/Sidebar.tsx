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
    <nav className="flex w-full shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4 py-3 md:w-[220px] md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-4 md:py-7">
      <div className="mb-0 flex items-baseline gap-2 px-2 text-xl font-bold tracking-tight md:mb-7">
        時<span className="text-accent">程</span>
        <small className="text-[11px] font-normal text-text-faint">v0.1.0</small>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex w-full items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-surface2 text-text" : "text-text-dim hover:bg-surface hover:text-text"
            }`}
          >
            <span className={`w-4 text-center ${active ? "text-accent" : "text-text-faint"}`}>
              {item.glyph}
            </span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto hidden px-2 pt-4 text-xs leading-relaxed text-text-faint md:block">
        Single Source of Truth
        <br />
        Today / Weekly / Calendar 即時同步
      </div>
    </nav>
  );
}
