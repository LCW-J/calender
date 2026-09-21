"use client";

import { useEvents } from "@/lib/events/store";

export default function SettingsPage() {
  const { resetToSeed } = useEvents();

  return (
    <section>
      <h1 className="mb-1 text-2xl tracking-tight">設定</h1>
      <p className="mb-6 text-sm text-text-dim">
        登入、雲端同步、通知等功能屬於後續版本（PROJECT_SPEC.md §3），此頁面目前只提供本機資料管理。
      </p>
      <div className="rounded-card border border-border bg-surface p-4">
        <div className="mb-1 text-sm font-medium">本機資料</div>
        <p className="mb-3 text-xs text-text-dim">
          目前活動資料儲存在這個瀏覽器的 LocalStorage 中，還沒有跨裝置同步。
        </p>
        <button
          className="rounded-card border border-danger px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10"
          onClick={() => {
            if (confirm("確定要清除所有活動並還原成預設資料嗎？")) resetToSeed();
          }}
        >
          重置為預設資料
        </button>
      </div>
    </section>
  );
}
