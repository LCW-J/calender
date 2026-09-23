import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { eventCreateData, toEventItem } from "@/lib/events/server";
import { parseEvent } from "@/lib/events/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(events.map(toEventItem));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = parseEvent(await request.json().catch(() => null));
  if (!event) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  // 讓本機待同步佇列可以安全重試：若前一次已建立成功但回應遺失，直接回傳同一筆。
  const existing = await prisma.event.findUnique({ where: { id: event.id } });
  if (existing) {
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Event id conflict" }, { status: 409 });
    }
    return NextResponse.json(toEventItem(existing));
  }

  const created = await prisma.event.create({ data: eventCreateData(session.user.id, event) });
  return NextResponse.json(toEventItem(created), { status: 201 });
}
