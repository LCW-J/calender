import { Prisma, Event as PrismaEvent } from "@prisma/client";
import { EventItem, Reminder, RepeatRule } from "@/types/event";

export function eventCreateData(userId: string, event: EventItem): Prisma.EventUncheckedCreateInput {
  return {
    id: event.id,
    userId,
    title: event.title,
    description: event.description || null,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    timeZone: event.timeZone,
    completed: event.completed,
    color: event.color || null,
    repeatRule:
      event.repeatRule === null || event.repeatRule === undefined
        ? Prisma.JsonNull
        : (event.repeatRule as unknown as Prisma.InputJsonValue),
    completedDates: (event.completedDates || {}) as Prisma.InputJsonValue,
    reminder:
      event.reminder === undefined
        ? Prisma.JsonNull
        : (event.reminder as unknown as Prisma.InputJsonValue),
  };
}

export function toEventItem(event: PrismaEvent): EventItem {
  return {
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    timeZone: event.timeZone,
    completed: event.completed,
    color: event.color || undefined,
    repeatRule: (event.repeatRule as unknown as RepeatRule | null) ?? null,
    completedDates: (event.completedDates as Record<string, boolean>) || {},
    reminder: (event.reminder as unknown as Reminder | null) || undefined,
  };
}
