"use client";

import { usePathname } from "next/navigation";
import { useEvents } from "@/lib/events/store";

export default function SyncStatusBanner() {
  const pathname = usePathname();
  const { syncState, retrySync } = useEvents();
  if (pathname === "/signin" || syncState !== "error") return null;

  return (
    <div className="sticky top-0 z-40 border-b border-danger/50 bg-[#2a1718] px-4 py-2 text-center text-xs text-[#ffd5d2]">
      雲端同步失敗，目前顯示本機快取。請確認網路，避免在多台裝置同時修改。
      <button
        type="button"
        onClick={retrySync}
        className="ml-2 rounded border border-danger px-2 py-1 font-medium text-white"
      >
        重新同步
      </button>
    </div>
  );
}
