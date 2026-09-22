"use client";

import { useEvents } from "@/lib/events/store";
import PWAInstallCard from "@/components/PWA/PWAInstallCard";

export default function SettingsPage() {
  const { resetToSeed } = useEvents();

  return (
    <section>
      <h1 className="mb-1 text-2xl tracking-tight">設定</h1>
      <p className="mb-6 text-sm text-text-dim">
        目前支援安裝到手機主畫面與頁面開啟時提醒；登入、雲端同步及背景推播屬於後續版本。
      </p>
      <div className="flex flex-col gap-4">
        <PWAInstallCard />
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-1 text-sm font-medium">本機資料</div>
          <p className="mb-3 text-xs text-text-dim">
            活動目前只儲存在這台裝置的瀏覽器中。清除網站資料或更換裝置不會自動帶過去。
          </p>
          <button
            className="min-h-11 rounded-card border border-danger px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10"
            onClick={() => {
              if (confirm("確定要清除所有活動並還原成預設資料嗎？")) resetToSeed();
            }}
          >
            重置為預設資料
          </button>
        </div>
      </div>
    </section>
  );
}
