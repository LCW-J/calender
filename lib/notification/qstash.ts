import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { upcomingReminders } from "@/lib/notification/due";
import { EventItem } from "@/types/event";

export interface ReminderJob {
  eventId: string;
  occurDate: string;
  scheduledFor: string;
}

interface QueueResult {
  considered: number;
  queued: number;
  existing: number;
  failed: number;
}

function qstashConfiguration() {
  const token = process.env.QSTASH_TOKEN;
  const secret = process.env.CRON_SECRET;
  const baseUrl = (process.env.QSTASH_URL || "https://qstash.upstash.io").replace(/\/$/, "");
  return token && secret ? { token, secret, baseUrl } : null;
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function reserve(job: ReminderJob): Promise<string | null> {
  try {
    const row = await prisma.reminderSchedule.create({
      data: {
        eventId: job.eventId,
        occurDate: job.occurDate,
        scheduledFor: new Date(job.scheduledFor),
      },
    });
    return row.id;
  } catch (error) {
    if (isUniqueConflict(error)) return null;
    throw error;
  }
}

export async function queueEventReminders(
  event: EventItem,
  origin: string,
  now = new Date()
): Promise<QueueResult> {
  const reminders = upcomingReminders(event, now);
  const result: QueueResult = { considered: reminders.length, queued: 0, existing: 0, failed: 0 };
  const config = qstashConfiguration();
  if (!config || origin.includes("localhost") || origin.includes("127.0.0.1")) return result;

  const destination = `${origin.replace(/\/$/, "")}/api/cron/reminders/dispatch`;
  const endpoint = `${config.baseUrl}/v2/publish/${destination}`;

  await Promise.all(reminders.map(async (reminder) => {
    const job: ReminderJob = {
      eventId: event.id,
      occurDate: reminder.occurDate,
      scheduledFor: reminder.scheduledFor.toISOString(),
    };
    const reservationId = await reserve(job);
    if (!reservationId) {
      result.existing++;
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
          "Upstash-Method": "POST",
          "Upstash-Not-Before": String(Math.floor(reminder.scheduledFor.getTime() / 1000)),
          "Upstash-Forward-Authorization": `Bearer ${config.secret}`,
          "Upstash-Retries": "3",
          "Upstash-Label": "calendar-reminder",
          "Upstash-Deduplication-Id": `${event.id}-${reminder.occurDate}-${reminder.scheduledFor.getTime()}`,
        },
        body: JSON.stringify(job),
      });
      if (!response.ok) throw new Error(`QStash publish failed: ${response.status}`);
      const payload = (await response.json().catch(() => ({}))) as { messageId?: string };
      await prisma.reminderSchedule.update({
        where: { id: reservationId },
        data: { messageId: payload.messageId || null },
      });
      result.queued++;
    } catch (error) {
      result.failed++;
      await prisma.reminderSchedule.deleteMany({ where: { id: reservationId } });
      console.error("Unable to queue reminder", error);
    }
  }));
  return result;
}
