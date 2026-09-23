import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { eventCreateData, toEventItem } from "@/lib/events/server";
import { parseEventArray } from "@/lib/events/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = parseEventArray(await request.json().catch(() => null));
  if (!events) return NextResponse.json({ error: "Invalid events" }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.event.count({ where: { userId: session.user.id } });
    if (!existing && events.length) {
      await tx.event.createMany({ data: events.map((event) => eventCreateData(session.user.id, event)) });
    }
    return tx.event.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  });

  return NextResponse.json(result.map(toEventItem));
}
