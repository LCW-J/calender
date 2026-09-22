"use client";

import { useEffect, useRef, useState } from "react";
import { useEvents } from "@/lib/events/store";
import {
  computePendingNotifications,
  fireNotification,
  notificationsSupported,
  requestNotificationPermission,
} from "@/lib/notification";

const CHECK_INTERVAL_MS = 20_000; // 每 20 秒檢查一次，足夠準確又不會太耗資源

export default function ReminderScheduler() {
  const { events, loaded } = useEvents();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  // 有任何活動設定了提醒，且瀏覽器支援、還沒問過權限時，才跳出請求
  useEffect(() => {
    if (!loaded) return;
    if (!notificationsSupported()) return;
    const hasReminder = events.some((e) => e.reminder && e.reminder.offset !== "NONE");
    if (!hasReminder) return;
    if (Notification.permission === "default") {
      requestNotificationPermission().then(setPermission);
    } else {
      setPermission(Notification.permission);
    }
  }, [loaded, events]);

  useEffect(() => {
    if (!loaded || !notificationsSupported()) return;

    function check() {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const pending = computePendingNotifications(events, now);
      for (const p of pending) {
        // fireAt 已經過了、而且是最近一段時間內（避免補跳很久以前錯過的提醒），且還沒跳過
        const diffMs = now.getTime() - p.fireAt.getTime();
        const isDue = diffMs >= 0 && diffMs < CHECK_INTERVAL_MS * 3;
        if (isDue && !firedRef.current.has(p.key)) {
          fireNotification(p);
          firedRef.current.add(p.key);
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loaded, events]);

  // 這個元件不畫任何東西，純粹在背景排程
  return null;
}
