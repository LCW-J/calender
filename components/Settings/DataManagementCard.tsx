"use client";

import { ChangeEvent, useRef, useState } from "react";
import { parseBackup } from "@/lib/backup/format";
import { useEvents } from "@/lib/events/store";

export default function DataManagementCard() {
  const { syncState, replaceAllEvents } = useEvents();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function exportBackup() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) throw new Error("無法從雲端匯出活動。");
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "shicheng-backup.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("備份已下載，請妥善保存 JSON 檔案。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "備份失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(change: ChangeEvent<HTMLInputElement>) {
    const file = change.target.files?.[0];
    change.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("備份檔案不可超過 5 MB。");
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) throw new Error("這不是有效的「時程」v1 備份檔案。");
      const confirmed = window.confirm(
        `備份中有 ${parsed.events.length} 筆活動。還原會完整取代目前所有雲端活動，確定繼續嗎？`
      );
      if (!confirmed) {
        setMessage("已取消還原，目前資料沒有變更。");
        return;
      }
      await replaceAllEvents(parsed.events);
      setMessage(`已成功還原 ${parsed.events.length} 筆活動，所有裝置重新整理後會同步。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "還原失敗。");
    } finally {
      setBusy(false);
    }
  }

  const canImport = syncState === "synced" && !busy;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-1 text-sm font-medium">備份與還原</div>
      <p className="mb-3 text-xs leading-relaxed text-text-dim">
        匯出會下載 Neon 中的完整活動；還原會先檢查檔案格式，再經確認後取代目前資料。
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void importBackup(event)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportBackup()}
          className="min-h-11 rounded-card border border-accent px-3.5 py-2 text-xs font-medium text-accent disabled:opacity-50"
        >
          匯出備份
        </button>
        <button
          type="button"
          disabled={!canImport}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-card border border-border px-3.5 py-2 text-xs font-medium text-text-dim disabled:opacity-50"
        >
          從備份還原
        </button>
      </div>
      {syncState !== "synced" && (
        <p className="mt-2 text-[11px] text-text-faint">請等待雲端同步完成後再還原。</p>
      )}
      {message && <p className="mt-3 text-xs leading-relaxed text-text-dim">{message}</p>}
    </div>
  );
}
