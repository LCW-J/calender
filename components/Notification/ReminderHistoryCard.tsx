"use client";

import { useEffect, useState } from "react";

interface HistoryItem {
  id: string;
  title: string;
  startTime: string;
  occurDate: string;
  scheduledFor: string;
  sentAt: string;
  successCount: number;
}

export default function ReminderHistoryCard() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reminders/history", { cache: "no-store" });
      if (!response.ok) throw new Error("無法載入提醒紀錄。");
      setItems((await response.json()) as HistoryItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "無法載入提醒紀錄。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="soft-card rounded-card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">最近提醒紀錄</div>
        <button type="button" onClick={() => void load()} className="text-xs text-accent">
          重新整理
        </button>
      </div>
      <p className="mb-3 text-xs text-text-dim">顯示最近 20 次由伺服器成功送出的活動提醒。</p>
      {loading ? (
        <p className="text-xs text-text-faint">載入中…</p>
      ) : error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-text-faint">目前尚無提醒紀錄。</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-text">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-text-dim">
                  {item.occurDate} {item.startTime}・送達 {item.successCount} 台裝置
                </div>
              </div>
              <time className="shrink-0 text-[10px] text-text-faint">
                {new Date(item.sentAt).toLocaleString("zh-TW", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
