"use client";

import { useEffect, useState } from "react";

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function applicationServerKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function registration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export default function PushNotificationCard() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const canPush = supported();
    setAvailable(canPush);
    setNeedsInstall(isIOS() && !isStandalone());
    if (!canPush) return;
    void registration()
      .then((worker) => worker.pushManager.getSubscription())
      .then(async (subscription) => {
        setEnabled(Boolean(subscription));
        // 同一台裝置切換 Google 帳號時，把既有訂閱安全地綁到目前登入者。
        if (subscription) {
          const response = await fetch("/api/push/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription.toJSON()),
          });
          if (!response.ok) throw new Error("通知訂閱無法與目前帳號同步。");
        }
      })
      .catch(() => setMessage("無法讀取目前的通知設定。"));
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      if (needsInstall) throw new Error("請先將網站加入主畫面，再從主畫面的「時程」開啟設定。 ");
      if (!supported()) throw new Error("這個瀏覽器不支援背景推播通知。");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("通知權限未允許，請到系統設定中開啟通知權限。");

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("網站尚未設定推播公鑰。");
      const worker = await registration();
      const existing = await worker.pushManager.getSubscription();
      const subscription =
        existing ||
        (await worker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(publicKey),
        }));

      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("伺服器無法儲存這台裝置的通知設定。");
      setEnabled(true);
      setMessage("背景提醒已開啟，可以按「傳送測試通知」確認。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "開啟通知失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const worker = await registration();
      const subscription = await worker.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok && response.status !== 404) throw new Error("伺服器無法移除通知設定。");
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage("這台裝置的背景提醒已關閉。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "關閉通知失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");
    try {
      const worker = await registration();
      const subscription = await worker.pushManager.getSubscription();
      if (!subscription) throw new Error("找不到這台裝置的通知訂閱，請重新開啟通知。");
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok) throw new Error("測試通知傳送失敗，請稍後再試。");
      setMessage("測試通知已送出。若沒有看到，請檢查手機的通知與專注模式設定。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "測試通知傳送失敗。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-card rounded-card p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">活動提醒通知</div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
            enabled ? "bg-teal-dim text-teal" : "bg-surface2 text-text-dim"
          }`}
        >
          {enabled ? "已開啟" : "未開啟"}
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-text-dim">
        開啟後，即使網站已關閉，也能在這台裝置收到活動提醒。每一台手機或電腦都需要各自開啟一次。
      </p>

      {needsInstall && (
        <p className="mb-3 rounded-card border border-accent/40 bg-accent-dim p-3 text-xs leading-relaxed text-text">
          iPhone／iPad 請先用 Safari 點「分享」→「加入主畫面」，再從主畫面的「時程」開啟這一頁。
        </p>
      )}
      {available === false && !needsInstall && (
        <p className="mb-3 text-xs text-danger">目前的瀏覽器不支援背景推播，請改用新版 Chrome、Edge 或 Safari。</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!enabled ? (
          <button
            type="button"
            disabled={busy || available === false}
            onClick={() => void enable()}
            className="primary-button min-h-11 rounded-card px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {busy ? "處理中…" : "開啟通知"}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendTest()}
              className="min-h-11 rounded-card border border-accent px-3.5 py-2 text-xs font-medium text-accent disabled:opacity-50"
            >
              傳送測試通知
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void disable()}
              className="min-h-11 rounded-card border border-border px-3.5 py-2 text-xs font-medium text-text-dim disabled:opacity-50"
            >
              關閉通知
            </button>
          </>
        )}
      </div>
      {message && <p className="mt-3 text-xs leading-relaxed text-text-dim">{message}</p>}
    </div>
  );
}
