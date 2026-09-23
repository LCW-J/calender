import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { taskCreateData, toTaskItem } from "@/lib/tasks/server";
import { parseTaskArray } from "@/lib/tasks/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = parseTaskArray(await request.json().catch(() => null));
  if (!tasks) return NextResponse.json({ error: "Invalid tasks" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany({ where: { userId: session.user.id } });
    if (tasks.length) {
      await tx.task.createMany({ data: tasks.map((task) => taskCreateData(session.user.id, task)) });
    }
  });
  const stored = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(stored.map(toTaskItem));
}
