import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deliveries = await prisma.reminderDelivery.findMany({
    where: { event: { userId: session.user.id } },
    orderBy: { sentAt: "desc" },
    take: 20,
    select: {
      id: true,
      occurDate: true,
      scheduledFor: true,
      sentAt: true,
      successCount: true,
      event: { select: { title: true, startTime: true } },
    },
  });

  return NextResponse.json(
    deliveries.map((delivery) => ({
      id: delivery.id,
      title: delivery.event.title,
      startTime: delivery.event.startTime,
      occurDate: delivery.occurDate,
      scheduledFor: delivery.scheduledFor.toISOString(),
      sentAt: delivery.sentAt.toISOString(),
      successCount: delivery.successCount,
    }))
  );
}
