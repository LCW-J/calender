"use client";

import { parseISO, todayISO, WEEKDAY_ZH } from "@/lib/date/date";
import { occurrencesOn } from "@/lib/recurrence/occurs";
import { useEvents } from "@/lib/events/store";
import { EventItem } from "@/types/event";

export default function DayPanel({
  selectedDate,
  onEdit,
  onQuickAdd,
}: {
  selectedDate: string;
  onEdit: (event: EventItem) => void;
  onQuickAdd: (date: string) => void;
}) {
  const { events } = useEvents();
  const d = parseISO(selectedDate);
  const list = occurrencesOn(events, selectedDate);

  return (
    <div className="soft-card w-full shrink-0 rounded-[24px] p-5 md:w-[260px]">
      <h3 className="mb-0.5 text-[15px] font-semibold">
        {selectedDate === todayISO() ? "今天 " : ""}
        {selectedDate}
      </h3>
      <div className="mb-3.5 text-xs text-text-faint">
        星期{WEEKDAY_ZH[d.getDay()]}　·　{list.length} 個活動
      </div>

      {list.length === 0 ? (
        <div className="py-2.5 text-[12.5px] text-text-faint">這天還沒有活動</div>
      ) : (
        list.map((occ, i) => (
          <div
            key={occ.event.id + occ.occurDate}
            onClick={() => onEdit(occ.event)}
            className={`cursor-pointer rounded-xl px-2 py-2.5 transition hover:bg-surface2/60 ${i > 0 ? "border-t border-border/60" : ""}`}
          >
            <div className="mono text-xs text-text-dim">
              {occ.event.startTime} – {occ.event.endTime}
            </div>
            <div
              className={`text-[13.5px] ${occ.completed ? "text-text-faint line-through" : ""}`}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: occ.event.color }}
              />
              {occ.event.title}
              {occ.isRecurring && <span className="ml-1 text-[11px] text-text-faint">↻</span>}
            </div>
          </div>
        ))
      )}

      <button
        className="mt-2.5 text-xs text-text-faint hover:text-accent"
        onClick={() => onQuickAdd(selectedDate)}
      >
        ＋ 在這天新增活動
      </button>
    </div>
  );
}
