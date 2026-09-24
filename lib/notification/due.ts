import { DateTime } from "luxon";
import { EventItem } from "@/types/event";
import { occurrenceCompleted, occurrencesInRange, occursOnDate } from "@/lib/recurrence/occurs";
import { reminderMinutes } from "@/lib/notification";

export interface DueReminder {
  occurDate: string;
  scheduledFor: Date;
}

export function reminderForOccurrence(event: EventItem, occurDate: string): DueReminder | null {
  const minutes = reminderMinutes(event);
  if (minutes === null || !occursOnDate(event, occurDate) || occurrenceCompleted(event, occurDate)) {
    return null;
  }
  const zone = event.timeZone || "Asia/Taipei";
  const start = DateTime.fromISO(`${occurDate}T${event.startTime}`, { zone });
  const scheduledFor = start.minus({ minutes });
  if (!scheduledFor.isValid) return null;
  return { occurDate, scheduledFor: scheduledFor.toJSDate() };
}

/** 產生未來一段時間內要交給 QStash 的精確提醒時間。 */
export function upcomingReminders(
  event: EventItem,
  now = new Date(),
  horizonDays = 6
): DueReminder[] {
  const minutes = reminderMinutes(event);
  if (minutes === null) return [];
  const zone = event.timeZone || "Asia/Taipei";
  const zonedNow = DateTime.fromJSDate(now, { zone });
  if (!zonedNow.isValid) return [];
  const startISO = zonedNow.minus({ days: 1 }).toISODate();
  const endISO = zonedNow.plus({ days: horizonDays + 1 }).toISODate();
  if (!startISO || !endISO) return [];

  const earliest = now.getTime() + 5_000;
  const latest = now.getTime() + horizonDays * 24 * 60 * 60 * 1000;
  return occurrencesInRange([event], startISO, endISO)
    .map((occurrence) => reminderForOccurrence(event, occurrence.occurDate))
    .filter((reminder): reminder is DueReminder => reminder !== null)
    .filter(({ scheduledFor }) => {
      const time = scheduledFor.getTime();
      return time > earliest && time <= latest;
    });
}

/**
 * 找出最近剛到期的提醒。排程每兩分鐘執行，五分鐘回看區間可容忍少量延遲；
 * ReminderDelivery 的唯一索引會阻止重複通知。
 */
export function dueReminders(event: EventItem, now = new Date(), lookbackMinutes = 5): DueReminder[] {
  const minutes = reminderMinutes(event);
  if (minutes === null) return [];

  const zone = event.timeZone || "Asia/Taipei";
  const zonedNow = DateTime.fromJSDate(now, { zone });
  if (!zonedNow.isValid) return [];

  const startISO = zonedNow.minus({ days: 1 }).toISODate();
  const endISO = zonedNow.plus({ days: 2 }).toISODate();
  if (!startISO || !endISO) return [];

  const earliest = DateTime.fromJSDate(now).minus({ minutes: lookbackMinutes }).toMillis();
  const latest = DateTime.fromJSDate(now).toMillis();

  return occurrencesInRange([event], startISO, endISO)
    .filter((occurrence) => !occurrenceCompleted(event, occurrence.occurDate))
    .map((occurrence) => {
      const start = DateTime.fromISO(`${occurrence.occurDate}T${event.startTime}`, { zone });
      const fireAt = start.minus({ minutes });
      return { occurDate: occurrence.occurDate, fireAt };
    })
    .filter(({ fireAt }) => fireAt.isValid && fireAt.toMillis() > earliest && fireAt.toMillis() <= latest)
    .map(({ occurDate, fireAt }) => ({ occurDate, scheduledFor: fireAt.toJSDate() }));
}
