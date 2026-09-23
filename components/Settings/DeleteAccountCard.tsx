"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useEvents } from "@/lib/events/store";

export default function DeleteAccountCard() {
  const { clearLocalData, syncState } = useEvents();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function removeAccount() {
    if (confirmation !== "DELETE") return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error("帳號刪除失敗，資料尚未變更。");

      try {
        if ("serviceWorker" in navigator) {
          const worker = await navigator.serviceWorker.ready;
          const subscription = await worker.pushManager.getSubscription();
          await subscription?.unsubscribe();
        }
      } catch {
        // 伺服器資料已刪除；本機失效訂閱不會再收到訊息，無須阻止後續登出。
      }
      clearLocalData();
      try {
        await signOut({ redirect: false });
      } catch {
        // User/Session 已由資料庫刪除，仍直接回登入頁清除畫面狀態。
      }
      window.location.replace("/signin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "帳號刪除失敗。");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-danger/50 bg-surface p-4">
      <div className="mb-1 text-sm font-medium text-danger">永久刪除帳號</div>
      <p className="mb-3 text-xs leading-relaxed text-text-dim">
        這會永久刪除 Google 帳號連結、所有活動、提醒紀錄與裝置訂閱，且無法復原。建議先匯出備份。
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-card border border-danger px-3.5 py-2 text-xs font-medium text-danger"
        >
          我要刪除帳號
        </button>
      ) : (
        <div className="rounded-card bg-surface2 p-3">
          <label className="mb-2 block text-xs text-text-dim">
            請輸入 <span className="font-semibold text-text">DELETE</span> 確認永久刪除：
          </label>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-danger"
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || confirmation !== "DELETE" || syncState === "syncing"}
              onClick={() => void removeAccount()}
              className="min-h-11 rounded-card bg-danger px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {busy ? "刪除中…" : "永久刪除"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirmation("");
                setMessage("");
              }}
              className="min-h-11 rounded-card border border-border px-3.5 py-2 text-xs text-text-dim"
            >
              取消
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-xs text-danger">{message}</p>}
    </div>
  );
}
