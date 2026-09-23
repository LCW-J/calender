import { Task as PrismaTask, Prisma } from "@prisma/client";
import { TaskItem } from "@/types/task";

export function taskCreateData(userId: string, task: TaskItem): Prisma.TaskUncheckedCreateInput {
  return {
    id: task.id,
    userId,
    title: task.title,
    description: task.description || null,
    dueDate: task.dueDate,
    completed: task.completed,
  };
}

export function toTaskItem(task: PrismaTask): TaskItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    dueDate: task.dueDate,
    completed: task.completed,
  };
}
