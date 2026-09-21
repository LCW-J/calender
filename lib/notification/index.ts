/**
 * PROJECT_SPEC.md §13 / §13.1：
 * Web Notification 與 Mobile Push Notification 的技術限制不同，
 * 不能假設 setTimeout() 就能可靠完成背景通知。
 *
 * MVP 階段（PROJECT_SPEC.md §3, §24）明確把 Push Notification 排除在外，
 * 這個檔案只先放型別與介面，真正的排程／推播邏輯留給後續版本
 * （Web Push + Service Worker，或 Firebase Cloud Messaging 等 Native Push）。
 */

import { EventItem } from "@/types/event";

export interface PendingNotification {
  eventId: string;
  title: string;
  occurDate: string;
  fireAt: Date;
}

/**
 * 尚未實作：之後會依 event.reminder 計算出應該在什麼時間點發通知。
 * 目前僅回傳空陣列，避免呼叫端誤以為提醒已經生效。
 */
export function computePendingNotifications(_events: EventItem[]): PendingNotification[] {
  return [];
}
