/** 共用的日期工具，所有日期以本地時區的 'YYYY-MM-DD' 字串表示，避免時區造成的誤差。 */

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

/** ISO 星期索引：一=0 ... 日=6（跟 JS 內建的 getDay() 以週日=0 起算不同，統一整個系統用這個） */
export function isoWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeek(d: Date): Date {
  const day = isoWeekday(d);
  const r = new Date(d);
  r.setDate(d.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"]; // index = getDay()
export const ISO_WEEKDAY_LABELS_ZH = ["一", "二", "三", "四", "五", "六", "日"]; // index = isoWeekday()
export const MONTH_ZH = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];
