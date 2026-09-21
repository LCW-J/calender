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
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] text-[12px] font-bold ${
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
        </div>
        <div className="mono mt-0.5 text-xs text-text-dim">
          {event.startTime} – {event.endTime}
        </div>
      </div>
    </div>
  );
}
