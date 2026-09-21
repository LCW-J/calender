"use client";

import { useMemo, useState } from "react";
import { addDays, startOfWeek, toISO, todayISO } from "@/lib/date/date";
import { occurrencesOn } from "@/lib/recurrence/occurs";
import { useEvents } from "@/lib/events/store";
import EventModal, { EventModalState } from "@/components/Event/EventModal";
import { EventItem } from "@/types/event";

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function WeeklyView() {
  const { events } = useEvents();
  const [anchor, setAnchor] = useState(new Date());
  const [modal, setModal] = useState<EventModalState>({ open: false });

  const start = useMemo(() => startOfWeek(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const today = todayISO();

  function openEdit(event: EventItem) {
    setModal({ open: true, editing: event });
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl tracking-tight">週計畫</h1>
          <div className="mono text-sm text-text-dim">
            {toISO(start)} ~ {toISO(addDays(start, 6))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <NavBtn onClick={() => setAnchor((a) => addDays(a, -7))}>‹</NavBtn>
          <NavBtn onClick={() => setAnchor(new Date())}>•</NavBtn>
          <NavBtn onClick={() => setAnchor((a) => addDays(a, 7))}>›</NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-7">
        {days.map((d, i) => {
          const iso = toISO(d);
          const isToday = iso === today;
          const list = occurrencesOn(events, iso);
          return (
            <div
              key={iso}
              className={`flex min-h-[140px] flex-col gap-1.5 rounded-card border bg-surface p-2.5 ${
                isToday ? "border-accent" : "border-border"
              }`}
            >
              <div className="mb-0.5 flex items-baseline justify-between px-0.5">
                <span className="text-[11px] font-semibold tracking-wide text-text-faint">
                  {DAY_NAMES[i]}
                </span>
                <span className={`text-[13px] font-semibold ${isToday ? "text-accent" : ""}`}>
                  {d.getDate()}
                </span>
              </div>

              {list.length === 0 ? (
                <div className="flex-1" />
              ) : (
                list.map((occ) => (
                  <div
                    key={occ.event.id + occ.occurDate}
                    onClick={() => openEdit(occ.event)}
                    className={`cursor-pointer rounded-lg bg-surface2 px-2 py-1.5 text-xs leading-snug ${
                      occ.completed ? "opacity-45" : ""
                    }`}
                    style={{ borderLeft: `2.5px solid ${occ.event.color}` }}
                  >
                    <span className="mono block text-[10.5px] text-text-faint">{occ.event.startTime}</span>
                    <span className={occ.completed ? "line-through" : ""}>
                      {occ.event.title}
                      {occ.isRecurring ? " ↻" : ""}
                    </span>
                  </div>
                ))
              )}

              <button
                className="mt-auto pt-1 text-left text-[11px] text-text-faint hover:text-accent"
                onClick={() => setModal({ open: true, defaultDate: iso })}
              >
                ＋ 新增
              </button>
            </div>
          );
        })}
      </div>

      <EventModal state={modal} onClose={() => setModal({ open: false })} />
    </section>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-dim hover:border-text-faint hover:text-text"
    >
      {children}
    </button>
  );
}
