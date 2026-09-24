import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toEventItem } from "@/lib/events/server";
import { cronAuthorized } from "@/lib/notification/cron-auth";
import { reminderForOccurrence } from "@/lib/notification/due";
import { pushSubscriptionExpired, sendPush } from "@/lib/notification/push-server";
import { ReminderJob } from "@/lib/notification/qstash";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseJob(value: unknown): ReminderJob | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const job = value as Record<string, unknown>;
  if (typeof job.eventId !== "string" || !job.eventId) return null;
  if (typeof job.occurDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(job.occurDate)) return null;
  if (typeof job.scheduledFor !== "string" || Number.isNaN(Date.parse(job.scheduledFor))) return null;
  return { eventId: job.eventId, occurDate: job.occurDate, scheduledFor: job.scheduledFor };
}

function uniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function clearSchedule(job: ReminderJob) {
  await prisma.reminderSchedule.deleteMany({
    where: {
      eventId: job.eventId,
      occurDate: job.occurDate,
      scheduledFor: new Date(job.scheduledFor),
    },
  });
}

export async function POST(request: Request) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const job = parseJob(await request.json().catch(() => null));
  if (!job) return NextResponse.json({ error: "Invalid reminder job" }, { status: 400 });

  const scheduledFor = new Date(job.scheduledFor);
  const now = new Date();
  if (scheduledFor.getTime() > now.getTime() + 60_000) {
    return NextResponse.json({ error: "Reminder arrived too early" }, { status: 425 });
  }
  if (scheduledFor.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    await clearSchedule(job);
    return NextResponse.json({ ignored: "expired" });
  }

  const storedEvent = await prisma.event.findUnique({
    where: { id: job.eventId },
    include: { user: { include: { pushSubscriptions: true } } },
  });
  if (!storedEvent) return NextResponse.json({ ignored: "event deleted" });

  const event = toEventItem(storedEvent);
  const current = reminderForOccurrence(event, job.occurDate);
  if (!current || Math.abs(current.scheduledFor.getTime() - scheduledFor.getTime()) > 1_000) {
    await clearSchedule(job);
    return NextResponse.json({ ignored: "event changed or completed" });
  }

  let deliveryId = "";
  try {
    const delivery = await prisma.reminderDelivery.create({
      data: { eventId: event.id, occurDate: job.occurDate, scheduledFor },
    });
    deliveryId = delivery.id;
  } catch (error) {
    if (uniqueConflict(error)) {
      await clearSchedule(job);
      return NextResponse.json({ ignored: "already delivered" });
    }
    throw error;
  }

  let sent = 0;
  let retryableFailures = 0;
  for (const subscription of storedEvent.user.pushSubscriptions) {
    try {
      await sendPush(subscription, {
        title: `🔔 即將開始：${event.title}`,
        body: `${event.startTime} 開始${event.description ? `｜${event.description}` : ""}`,
        tag: `${event.id}::${job.occurDate}`,
        url: `/today?date=${job.occurDate}`,
      });
      sent++;
    } catch (error) {
      if (pushSubscriptionExpired(error)) {
        await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
      } else {
        retryableFailures++;
        console.error("Reminder push failed", error);
      }
    }
  }

  if (!sent) {
    await prisma.reminderDelivery.deleteMany({ where: { id: deliveryId } });
    if (retryableFailures) {
      return NextResponse.json({ error: "Push delivery failed" }, { status: 503 });
    }
    await clearSchedule(job);
    return NextResponse.json({ ignored: "no active subscriptions" });
  }

  await prisma.reminderDelivery.update({ where: { id: deliveryId }, data: { successCount: sent } });
  await clearSchedule(job);
  return NextResponse.json({ sent, occurDate: job.occurDate, scheduledFor: job.scheduledFor });
}

export async function GET() {
  return NextResponse.json({ error: "Use authenticated POST" }, { status: 405 });
}
