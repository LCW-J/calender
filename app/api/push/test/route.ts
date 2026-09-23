import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { pushSubscriptionExpired, sendPush } from "@/lib/notification/push-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = body && typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id, endpoint },
  });
  if (!subscriptions.length) {
    return NextResponse.json({ error: "No push subscription" }, { status: 404 });
  }

  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await sendPush(subscription, {
        title: "🔔 時程測試通知",
        body: "背景推播已設定成功！",
        tag: `push-test-${Date.now()}`,
        url: "/settings",
      });
      sent++;
    } catch (error) {
      if (pushSubscriptionExpired(error)) {
        await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
      } else {
        console.error("Test push failed", error);
      }
    }
  }

  if (!sent) return NextResponse.json({ error: "Push delivery failed" }, { status: 502 });
  return NextResponse.json({ sent });
}
