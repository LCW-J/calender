import { EventItem, ReminderOffset } from "@/types/event";
import { occurrencesInRange } from "@/lib/recurrence/occurs";
import { addDays, parseISO, toISO } from "@/lib/date/date";

/**
 * v0.6 頁面內提醒的純計算工具。
 * PROJECT_SPEC.md §13.1 提醒過：不能假設 setTimeout() 能可靠完成「背景」通知。
 * v0.9 背景通知改由 due.ts + Web Push + Service Worker 處理；這裡保留純函式與舊版相容測試。
 */

const OFFSET_MINUTES: Record<ReminderOffset, number | null> = {
  NONE: null,
  "5_MIN": 5,
  "10_MIN": 10,
  "15_MIN": 15,
  "30_MIN": 30,
  "1_HOUR": 60,
  "2_HOUR": 120,
  "1_DAY": 24 * 60,
  CUSTOM: null, // 用 event.reminder.customMinutes
};

export interface PendingNotification {
  key: string; // eventId::occurDate，用來避免同一次發生重複跳通知
  eventId: string;
  occurDate: string;
  title: string;
  startTime: string;
  fireAt: Date;
}

export function reminderMinutes(e: EventItem): number | null {
  const r = e.reminder;
  if (!r || r.offset === "NONE") return null;
  if (r.offset === "CUSTOM") return r.customMinutes ?? null;
  return OFFSET_MINUTES[r.offset];
}

function occurrenceStart(occurDate: string, startTime: string): Date {
  const d = parseISO(occurDate);
  const [h, m] = startTime.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * 算出「現在」附近應該要提醒的所有次數。
 * 掃描 [今天-1, 今天+2] 的區間，涵蓋跨日提醒（例如「提前 1 天」的情況）。
 */
export function computePendingNotifications(events: EventItem[], now: Date): PendingNotification[] {
  const withReminder = events.filter((e) => reminderMinutes(e) !== null);
  if (!withReminder.length) return [];

  const startISO = toISO(addDays(now, -1));
  const endISO = toISO(addDays(now, 2));
  const occs = occurrencesInRange(withReminder, startISO, endISO);

  return occs.map((occ) => {
    const minutes = reminderMinutes(occ.event) as number;
    const start = occurrenceStart(occ.occurDate, occ.event.startTime);
    const fireAt = new Date(start.getTime() - minutes * 60000);
    return {
      key: `${occ.event.id}::${occ.occurDate}`,
      eventId: occ.event.id,
      occurDate: occ.occurDate,
      title: occ.event.title,
      startTime: occ.event.startTime,
      fireAt,
    };
  });
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!notificationsSupported()) return null;
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function fireNotification(p: PendingNotification) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  new Notification(`🔔 即將開始：${p.title}`, {
    body: `${p.startTime} 開始`,
    tag: p.key, // 同一個 key 再跳一次會直接取代舊的，不會疊出一堆通知
  });
}
