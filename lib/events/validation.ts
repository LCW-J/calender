import { EventItem, Reminder, ReminderOffset, RepeatRule, RepeatType } from "@/types/event";

const REPEAT_TYPES = new Set<RepeatType>(["NONE", "DAILY", "WEEKLY", "CUSTOM", "MONTHLY", "YEARLY"]);
const REMINDER_OFFSETS = new Set<ReminderOffset>([
  "NONE",
  "5_MIN",
  "10_MIN",
  "15_MIN",
  "30_MIN",
  "1_HOUR",
  "2_HOUR",
  "1_DAY",
  "CUSTOM",
]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_TIME_ZONE = "Asia/Taipei";

function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRepeatRule(value: unknown): RepeatRule | null | undefined {
  if (value === null || value === undefined) return null;
  if (!record(value) || !REPEAT_TYPES.has(value.type as RepeatType)) return undefined;
  const type = value.type as RepeatType;
  const days = Array.isArray(value.days)
    ? value.days.filter((day): day is number => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6)
    : undefined;
  const until = typeof value.until === "string" && DATE_RE.test(value.until) ? value.until : undefined;
  return { type, ...(days ? { days: [...new Set(days)] } : {}), ...(until ? { until } : {}) };
}

function parseReminder(value: unknown): Reminder | undefined {
  if (value === undefined || value === null) return { offset: "NONE" };
  if (!record(value) || !REMINDER_OFFSETS.has(value.offset as ReminderOffset)) return undefined;
  const offset = value.offset as ReminderOffset;
  if (offset === "CUSTOM") {
    const customMinutes = Number(value.customMinutes);
    if (!Number.isInteger(customMinutes) || customMinutes < 1 || customMinutes > 10080) return undefined;
    return { offset, customMinutes };
  }
  return { offset };
}

export function parseEvent(value: unknown): EventItem | null {
  if (!record(value)) return null;
  if (typeof value.id !== "string" || value.id.length < 1 || value.id.length > 128) return null;
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 200) return null;
  if (typeof value.date !== "string" || !DATE_RE.test(value.date)) return null;
  if (typeof value.startTime !== "string" || !TIME_RE.test(value.startTime)) return null;
  if (typeof value.endTime !== "string" || !TIME_RE.test(value.endTime)) return null;
  if (typeof value.completed !== "boolean") return null;

  const repeatRule = parseRepeatRule(value.repeatRule);
  const reminder = parseReminder(value.reminder);
  if (repeatRule === undefined || reminder === undefined) return null;

  const completedDates: Record<string, boolean> = {};
  if (value.completedDates !== undefined) {
    if (!record(value.completedDates)) return null;
    for (const [date, completed] of Object.entries(value.completedDates)) {
      if (!DATE_RE.test(date) || typeof completed !== "boolean") return null;
      completedDates[date] = completed;
    }
  }

  return {
    id: value.id,
    title: value.title.trim(),
    description: typeof value.description === "string" ? value.description.slice(0, 5000) : "",
    date: value.date,
    startTime: value.startTime,
    endTime: value.endTime,
    timeZone: validTimeZone(value.timeZone) ? value.timeZone : DEFAULT_TIME_ZONE,
    completed: value.completed,
    color: typeof value.color === "string" ? value.color.slice(0, 32) : undefined,
    repeatRule,
    completedDates,
    reminder,
  };
}

export function parseEventArray(value: unknown): EventItem[] | null {
  if (!Array.isArray(value) || value.length > 2000) return null;
  const parsed = value.map(parseEvent);
  if (parsed.some((event) => event === null)) return null;
  return parsed as EventItem[];
}
