import { EventItem } from "@/types/event";
import { parseEventArray } from "@/lib/events/validation";
import { TaskItem } from "@/types/task";
import { parseTaskArray } from "@/lib/tasks/validation";

export const BACKUP_SCHEMA_VERSION = 2;

export interface CalendarBackup {
  schemaVersion: number;
  exportedAt: string;
  events: EventItem[];
  tasks: TaskItem[];
}

export function createBackup(events: EventItem[], tasks: TaskItem[], exportedAt = new Date()): CalendarBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    events,
    tasks,
  };
}

export function parseBackup(value: unknown): CalendarBackup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 1 && record.schemaVersion !== BACKUP_SCHEMA_VERSION) return null;
  if (typeof record.exportedAt !== "string" || Number.isNaN(Date.parse(record.exportedAt))) return null;
  const events = parseEventArray(record.events);
  if (!events) return null;
  const tasks = record.schemaVersion === 1 ? [] : parseTaskArray(record.tasks);
  if (!tasks) return null;
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(record.exportedAt).toISOString(),
    events,
    tasks,
  };
}
