import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { taskCreateData, toTaskItem } from "@/lib/tasks/server";
import { parseTask } from "@/lib/tasks/validation";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const task = parseTask(await request.json().catch(() => null));
  if (!task || task.id !== params.id) return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  const data = taskCreateData(session.user.id, task);
  const { id: _id, userId: _userId, ...updateData } = data;
  const result = await prisma.task.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: updateData,
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.task.findUniqueOrThrow({ where: { id: params.id } });
  return NextResponse.json(toTaskItem(updated));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.task.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
