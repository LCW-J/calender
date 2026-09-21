import { EventItem, EventOccurrence } from "@/types/event";
import { isoWeekday, parseISO } from "@/lib/date/date";

/**
 * PROJECT_SPEC.md §11：
 * 「不要在資料庫中無限複製所有未來活動。應保存：原始 Event + Repeat Rule。
 *  系統在顯示 Calendar 時，再根據 Repeat Rule 產生對應日期。」
 *
 * 這個檔案就是那個「產生對應日期」的邏輯，全部是純函式、不寫入任何資料。
 */

export function isRecurring(e: EventItem): boolean {
  return !!(e.repeatRule && e.repeatRule.type !== "NONE");
}

/** 判斷某個 Event 是否會在指定日期出現一次發生 */
export function occursOnDate(e: EventItem, dateISO: string): boolean {
  if (dateISO < e.date) return false;

  const rule = e.repeatRule;
  if (!rule || rule.type === "NONE") {
    return dateISO === e.date;
  }
  if (rule.until && dateISO > rule.until) return false;

  const d = parseISO(dateISO);
  const a = parseISO(e.date);

  switch (rule.type) {
    case "DAILY":
      return true;
    case "WEEKLY":
    case "CUSTOM": {
      const days = rule.days && rule.days.length ? rule.days : [isoWeekday(a)];
      return days.includes(isoWeekday(d));
    }
    case "MONTHLY":
      return d.getDate() === a.getDate();
    case "YEARLY":
      return d.getDate() === a.getDate() && d.getMonth() === a.getMonth();
    default:
      return dateISO === e.date;
  }
}

export function occurrenceCompleted(e: EventItem, dateISO: string): boolean {
  if (isRecurring(e)) return !!e.completedDates?.[dateISO];
  return !!e.completed;
}

/** 取出所有 Event 在某一天實際出現的發生，依開始時間排序 */
export function occurrencesOn(events: EventItem[], dateISO: string): EventOccurrence[] {
  return events
    .filter((e) => occursOnDate(e, dateISO))
    .map((e) => ({
      event: e,
      occurDate: dateISO,
      isRecurring: isRecurring(e),
      completed: occurrenceCompleted(e, dateISO),
    }))
    .sort((a, b) => a.event.startTime.localeCompare(b.event.startTime));
}

/** 取出所有 Event 在某個日期區間（含頭尾）內出現的發生，依日期再依開始時間排序 */
export function occurrencesInRange(
  events: EventItem[],
  startISO: string,
  endISO: string
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  let cursor = parseISO(startISO);
  const end = parseISO(endISO);
  // 安全上限，避免不小心傳入超大區間造成無窮迴圈
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
      cursor.getDate()
    ).padStart(2, "0")}`;
    out.push(...occurrencesOn(events, iso));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return out;
}
