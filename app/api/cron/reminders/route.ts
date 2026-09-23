import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toEventItem } from "@/lib/events/server";
import { dueReminders } from "@/lib/notification/due";
import { pushSubscriptionExpired, sendPush } from "@/lib/notification/push-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !supplied) return false;
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { pushSubscriptions: true, events: true },
  });
  const now = new Date();
  let sent = 0;
  let due = 0;

  for (const user of users) {
    for (const storedEvent of user.events) {
      const event = toEventItem(storedEvent);
      for (const reminder of dueReminders(event, now)) {
        due++;
        try {
          await prisma.reminderDelivery.create({
            data: {
              eventId: event.id,
              occurDate: reminder.occurDate,
              scheduledFor: reminder.scheduledFor,
            },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
          throw error;
        }

        let delivered = false;
        for (const subscription of user.pushSubscriptions) {
          try {
            await sendPush(subscription, {
              title: `🔔 即將開始：${event.title}`,
              body: `${event.startTime} 開始${event.description ? `｜${event.description}` : ""}`,
              tag: `${event.id}::${reminder.occurDate}`,
              url: `/today?date=${reminder.occurDate}`,
            });
            delivered = true;
            sent++;
          } catch (error) {
            if (pushSubscriptionExpired(error)) {
              await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
            } else {
              console.error("Reminder push failed", error);
            }
          }
        }

        if (!delivered) {
          await prisma.reminderDelivery.deleteMany({
            where: {
              eventId: event.id,
              occurDate: reminder.occurDate,
              scheduledFor: reminder.scheduledFor,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ checkedAt: now.toISOString(), due, sent });
}

export async function GET() {
  return NextResponse.json({ error: "Use authenticated POST" }, { status: 405 });
}
