import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { eventCreateData, toEventItem } from "@/lib/events/server";
import { parseEvent } from "@/lib/events/validation";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = parseEvent(await request.json().catch(() => null));
  if (!event || event.id !== params.id) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const data = eventCreateData(session.user.id, event);
  const { id: _id, userId: _userId, ...updateData } = data;
  const result = await prisma.event.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: updateData,
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.event.findUniqueOrThrow({ where: { id: params.id } });
  return NextResponse.json(toEventItem(updated));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.event.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });
  // DELETE 必須可重試；已經不存在代表最終狀態相同，仍回傳成功。
  void result;
  return new NextResponse(null, { status: 204 });
}
