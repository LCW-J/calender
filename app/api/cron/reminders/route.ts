import { prisma } from "@/lib/db/prisma";
import { toEventItem } from "@/lib/events/server";
import { cronAuthorized } from "@/lib/notification/cron-auth";
import { queueEventReminders } from "@/lib/notification/qstash";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 低頻補排程器。建議 QStash 每六小時呼叫一次；它只負責把未來六天的提醒
 * 放進延遲佇列，不再每兩分鐘掃描並立即推播。
 */
export async function POST(request: Request) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { events: true },
  });
  const origin = new URL(request.url).origin;
  const now = new Date();
  let considered = 0;
  let queued = 0;
  let existing = 0;
  let failed = 0;

  for (const user of users) {
    for (const storedEvent of user.events) {
      const result = await queueEventReminders(toEventItem(storedEvent), origin, now);
      considered += result.considered;
      queued += result.queued;
      existing += result.existing;
      failed += result.failed;
    }
  }

  // 清掉極少數因訊息遺失而沒有回呼的舊排程紀錄，之後仍可重新補排。
  await prisma.reminderSchedule.deleteMany({
    where: { scheduledFor: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({ plannedAt: now.toISOString(), considered, queued, existing, failed });
}

export async function GET() {
  return NextResponse.json({ error: "Use authenticated POST" }, { status: 405 });
}
