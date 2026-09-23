import { EventItem } from "@/types/event";
import { parseEventArray } from "@/lib/events/validation";

export const BACKUP_SCHEMA_VERSION = 1;

export interface CalendarBackup {
  schemaVersion: number;
  exportedAt: string;
  events: EventItem[];
}

export function createBackup(events: EventItem[], exportedAt = new Date()): CalendarBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    events,
  };
}

export function parseBackup(value: unknown): CalendarBackup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== BACKUP_SCHEMA_VERSION) return null;
  if (typeof record.exportedAt !== "string" || Number.isNaN(Date.parse(record.exportedAt))) return null;
  const events = parseEventArray(record.events);
  if (!events) return null;
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(record.exportedAt).toISOString(),
    events,
  };
}
