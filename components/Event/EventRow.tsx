"use client";

import { EventOccurrence } from "@/types/event";
import { useEvents } from "@/lib/events/store";

export default function EventRow({
  occ,
  onEdit,
}: {
  occ: EventOccurrence;
  onEdit: () => void;
}) {
  const { toggleOccurrence } = useEvents();
  const { event, completed, occurDate } = occ;

  return (
    <div
      className={`flex items-center gap-3.5 rounded-card border border-border bg-surface p-3.5 ${
        completed ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => toggleOccurrence(event.id, occurDate)}
        aria-label={completed ? `將「${event.title}」標記為未完成` : `將「${event.title}」標記為完成`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-sm font-bold md:h-7 md:w-7 ${
          completed ? "border-teal bg-teal text-bg" : "border-text-faint bg-transparent"
        }`}
      >
        {completed ? "✓" : ""}
      </button>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: event.color }} />
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
        <div className={`text-[14.5px] font-medium ${completed ? "text-text-faint line-through" : ""}`}>
          {event.title}
          {occ.isRecurring && <span className="ml-1 text-xs text-text-faint">↻</span>}
          {event.reminder && event.reminder.offset !== "NONE" && (
            <span className="ml-1 text-xs text-text-faint">🔔</span>
          )}
        </div>
        <div className="mono mt-0.5 text-xs text-text-dim">
          {event.startTime} – {event.endTime}
        </div>
      </div>
    </div>
  );
}
