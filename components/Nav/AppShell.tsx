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
    <div className="relative mx-auto flex min-h-screen max-w-[1240px] flex-col md:flex-row">
      {sidebar}
      <main className="page-content min-w-0 flex-1 px-4 pb-32 pt-7 sm:px-6 md:px-10 md:pb-16 md:pt-10 lg:px-12">{children}</main>
    </div>
  );
}
