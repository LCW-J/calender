import { DateTime } from "luxon";
import { EventItem } from "@/types/event";
import { occurrenceCompleted, occurrencesInRange } from "@/lib/recurrence/occurs";
import { reminderMinutes } from "@/lib/notification";

export interface DueReminder {
  occurDate: string;
  scheduledFor: Date;
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
