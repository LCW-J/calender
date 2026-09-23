import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createBackup } from "@/lib/backup/format";
import { toEventItem } from "@/lib/events/server";
import { NextResponse } from "next/server";
import { toTaskItem } from "@/lib/tasks/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [events, tasks] = await Promise.all([
    prisma.event.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
    }),
  ]);
  const backup = createBackup(events.map(toEventItem), tasks.map(toTaskItem));
  const date = backup.exportedAt.slice(0, 10);

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="shicheng-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
