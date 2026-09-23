import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { taskCreateData, toTaskItem } from "@/lib/tasks/server";
import { parseTask } from "@/lib/tasks/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(tasks.map(toTaskItem));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const task = parseTask(await request.json().catch(() => null));
  if (!task) return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  const existing = await prisma.task.findUnique({ where: { id: task.id } });
  if (existing) {
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Task id conflict" }, { status: 409 });
    }
    return NextResponse.json(toTaskItem(existing));
  }
  const created = await prisma.task.create({ data: taskCreateData(session.user.id, task) });
  return NextResponse.json(toTaskItem(created), { status: 201 });
}
