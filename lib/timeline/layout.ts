import { EventOccurrence } from "@/types/event";

export const HOUR_HEIGHT = 72;

export function minuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return Math.min(1440, Math.max(0, hour * 60 + minute));
}

export interface TimelineItem {
  occurrence: EventOccurrence;
  startMinute: number;
  endMinute: number;
  lane: number;
  laneCount: number;
}

export function layoutTimeline(occurrences: EventOccurrence[]): TimelineItem[] {
  const ordered = occurrences
    .map((occurrence) => {
      const startMinute = minuteOfDay(occurrence.event.startTime);
      const rawEnd = minuteOfDay(occurrence.event.endTime);
      return {
        occurrence,
        startMinute,
        endMinute: Math.min(1440, rawEnd > startMinute ? rawEnd : startMinute + 30),
      };
    })
    .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);

  const result: TimelineItem[] = [];
  let cursor = 0;
  while (cursor < ordered.length) {
    const group = [ordered[cursor++]];
    let groupEnd = group[0].endMinute;
    while (cursor < ordered.length && ordered[cursor].startMinute < groupEnd) {
      group.push(ordered[cursor]);
      groupEnd = Math.max(groupEnd, ordered[cursor].endMinute);
      cursor++;
    }

    const laneEnds: number[] = [];
    const placed = group.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.startMinute);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = item.endMinute;
      return { ...item, lane };
    });
    const laneCount = Math.max(1, laneEnds.length);
    result.push(...placed.map((item) => ({ ...item, laneCount })));
  }
  return result;
}

export function minuteToPixels(minute: number): number {
  return (minute / 60) * HOUR_HEIGHT;
}
