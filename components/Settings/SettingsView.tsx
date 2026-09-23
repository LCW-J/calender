"use client";

import PWAInstallCard from "@/components/PWA/PWAInstallCard";
import PushNotificationCard from "@/components/Notification/PushNotificationCard";
import DataManagementCard from "@/components/Settings/DataManagementCard";
import DeleteAccountCard from "@/components/Settings/DeleteAccountCard";
import ReminderHistoryCard from "@/components/Notification/ReminderHistoryCard";
import { useEvents } from "@/lib/events/store";
import { signOut, useSession } from "next-auth/react";

const SYNC_LABEL = {
  loading: "正在載入…",
  syncing: "正在同步…",
  synced: "已同步",
  error: "同步失敗",
  local: "僅儲存在本機",
} as const;

export default function SettingsView() {
  const { resetToSeed, syncState, retrySync } = useEvents();
  const { data: session } = useSession();

  return (
    <section>
      <h1 className="mb-1 text-2xl tracking-tight">設定</h1>
      <p className="mb-6 text-sm text-text-dim">
        管理帳號同步、App 安裝與每台裝置的活動提醒。
      </p>
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">帳號與雲端同步</div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                syncState === "synced" ? "bg-teal-dim text-teal" : "bg-surface2 text-text-dim"
              }`}
            >
              {SYNC_LABEL[syncState]}
            </span>
          </div>
          <p className="mb-3 break-all text-xs text-text-dim">{session?.user?.email || "尚未登入"}</p>
          <div className="flex flex-wrap gap-2">
            {syncState === "error" && (
              <button
                type="button"
                onClick={retrySync}
                className="min-h-11 rounded-card border border-accent px-3.5 py-2 text-xs font-medium text-accent"
              >
                重新同步
              </button>
            )}
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/signin" })}
              className="min-h-11 rounded-card border border-border px-3.5 py-2 text-xs font-medium text-text-dim hover:text-text"
            >
              登出
            </button>
          </div>
        </div>

        <PWAInstallCard />

        <PushNotificationCard />

        <DataManagementCard />

        <ReminderHistoryCard />

        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-1 text-sm font-medium">重置活動</div>
          <p className="mb-3 text-xs leading-relaxed text-text-dim">
            這會以三筆示範活動取代目前的雲端活動，並同步到所有裝置。
          </p>
          <button
            className="min-h-11 rounded-card border border-danger px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10"
            onClick={() => {
              if (confirm("確定要刪除目前所有活動並還原成預設資料嗎？")) resetToSeed();
            }}
          >
            重置為預設資料
          </button>
        </div>

        <DeleteAccountCard />
      </div>
    </section>
  );
}
