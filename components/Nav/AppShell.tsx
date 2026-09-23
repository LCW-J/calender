"use client";

import { usePathname } from "next/navigation";

export default function AppShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/signin") return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col md:flex-row">
      {sidebar}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-9 md:pb-14 md:pt-8">{children}</main>
    </div>
  );
}
