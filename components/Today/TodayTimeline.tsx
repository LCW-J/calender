"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EventOccurrence } from "@/types/event";
import { useEvents } from "@/lib/events/store";
import { HOUR_HEIGHT, layoutTimeline, minuteToPixels } from "@/lib/timeline/layout";

export default function TodayTimeline({
  occurrences,
  onAdd,
  onEdit,
}: {
  occurrences: EventOccurrence[];
  onAdd: (hour: number) => void;
  onEdit: (occurrence: EventOccurrence) => void;
}) {
  const { toggleOccurrence } = useEvents();
  const scroller = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const items = useMemo(() => layoutTimeline(occurrences), [occurrences]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    if (scroller.current) scroller.current.scrollTop = Math.max(0, minuteToPixels(currentMinute - 60));
    return () => window.clearInterval(timer);
    // 初次進入時定位現在時間即可，不要每分鐘拉走使用者正在查看的位置。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMinute = now.getHours() * 60 + now.getMinutes();

  return (
    <div ref={scroller} className="max-h-[68dvh] overflow-y-auto rounded-card border border-border bg-surface">
      <div className="flex" style={{ height: HOUR_HEIGHT * 24 }}>
        <div className="relative w-14 shrink-0 border-r border-border/70 bg-surface2/30">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-text-faint"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {Array.from({ length: 24 }, (_, hour) => (
            <button
              key={hour}
              type="button"
              aria-label={`在 ${String(hour).padStart(2, "0")}:00 新增活動`}
              className="absolute left-0 right-0 border-t border-border/70 text-left hover:bg-accent/5 focus-visible:bg-accent/10 focus-visible:outline-none"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              onClick={() => onAdd(hour)}
            >
              <span className="sr-only">新增活動</span>
            </button>
          ))}

          {items.map(({ occurrence, startMinute, endMinute, lane, laneCount }) => {
            const { event } = occurrence;
            const width = 100 / laneCount;
            return (
              <button
                key={`${event.id}:${occurrence.occurDate}`}
                type="button"
                onClick={() => onEdit(occurrence)}
                className={`absolute z-10 overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:brightness-110 ${
                  occurrence.completed ? "opacity-55" : ""
                }`}
                style={{
                  top: minuteToPixels(startMinute),
                  height: Math.max(8, minuteToPixels(endMinute - startMinute)),
                  left: `calc(${lane * width}% + 3px)`,
                  width: `calc(${width}% - 6px)`,
                  backgroundColor: `${event.color || "#e8a33d"}24`,
                  borderColor: event.color || "#e8a33d",
                }}
              >
                <span className="flex min-w-0 items-start gap-1.5">
                  <input
                    type="checkbox"
                    checked={occurrence.completed}
                    onChange={() => toggleOccurrence(event.id, occurrence.occurDate)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    aria-label={`${event.title}標示為${occurrence.completed ? "未完成" : "完成"}`}
                  />
                  <span className="min-w-0">
                    <span className={`block truncate text-xs font-semibold ${occurrence.completed ? "line-through" : ""}`}>
                      {event.title}
                    </span>
                    <span className="mono block truncate text-[10px] text-text-dim">
                      {event.startTime}–{event.endTime}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}

          <div
            className="pointer-events-none absolute left-0 right-0 z-20 border-t border-red-400"
            style={{ top: minuteToPixels(currentMinute) }}
            aria-hidden="true"
          >
            <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
