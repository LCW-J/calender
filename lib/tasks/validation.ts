import { TaskItem } from "@/types/task";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTask(value: unknown): TaskItem | null {
  if (!record(value)) return null;
  if (typeof value.id !== "string" || !value.id || value.id.length > 128) return null;
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 200) return null;
  if (typeof value.dueDate !== "string" || !DATE_RE.test(value.dueDate)) return null;
  if (typeof value.completed !== "boolean") return null;
  return {
    id: value.id,
    title: value.title.trim(),
    description: typeof value.description === "string" ? value.description.slice(0, 5000) : "",
    dueDate: value.dueDate,
    completed: value.completed,
  };
}

export function parseTaskArray(value: unknown): TaskItem[] | null {
  if (!Array.isArray(value) || value.length > 10000) return null;
  const tasks = value.map(parseTask);
  return tasks.every((task): task is TaskItem => task !== null) ? tasks : null;
}
