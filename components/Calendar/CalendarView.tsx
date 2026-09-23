"use client";

import { useMemo, useState } from "react";
import { addDays, isoWeekday, MONTH_ZH, toISO, todayISO } from "@/lib/date/date";
import { occurrencesOn } from "@/lib/recurrence/occurs";
import { useEvents } from "@/lib/events/store";
import EventModal, { EventModalState } from "@/components/Event/EventModal";
import DayPanel from "@/components/Calendar/DayPanel";
import { EventItem } from "@/types/event";

export default function CalendarView() {
  const { events } = useEvents();
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [modal, setModal] = useState<EventModalState>({ open: false });

  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const today = todayISO();

  const cells = useMemo(() => {
    const firstOfMonth = new Date(y, m, 1);
    const startOffset = isoWeekday(firstOfMonth);
    const gridStart = addDays(firstOfMonth, -startOffset);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [y, m]);

  function openEdit(event: EventItem) {
    setModal({ open: true, editing: event });
  }
  function quickAdd(date: string) {
    setModal({ open: true, defaultDate: date });
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">Month at a glance</div>
          <h1 className="mb-1 text-[28px] font-bold tracking-tight">行事曆</h1>
          <div className="text-sm text-text-dim">點選日期查看或新增活動</div>
        </div>
        <div className="flex items-center gap-2.5">
          <NavBtn onClick={() => setAnchor(new Date(y, m - 1, 1))}>‹</NavBtn>
          <span className="min-w-[108px] text-center text-sm font-semibold">
            {y} {MONTH_ZH[m]}
          </span>
          <NavBtn onClick={() => setAnchor(new Date(y, m + 1, 1))}>›</NavBtn>
          <button
            className="secondary-button rounded-xl px-3 py-2 text-[11px] font-semibold"
            onClick={() => {
              setAnchor(new Date());
              setSelectedDate(todayISO());
            }}
          >
            今天
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 md:flex-row">
        <div className="soft-card min-w-0 flex-1 rounded-[24px] p-2.5 sm:p-4">
          <div className="mb-1.5 grid grid-cols-7">
            {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
              <span key={w} className="text-center text-[11px] font-semibold text-text-faint">
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5" style={{ gridAutoRows: "84px" }}>
            {cells.map((d) => {
              const iso = toISO(d);
              const inMonth = d.getMonth() === m;
              const isToday = iso === today;
              const isSelected = iso === selectedDate;
              const list = occurrencesOn(events, iso);
              return (
                <div
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-1.5 transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/80 ${
                    inMonth ? "" : "opacity-35"
                  } ${isSelected ? "border-accent bg-accent-dim/45 shadow-[inset_0_0_0_1px_rgba(214,129,95,.08)]" : "border-transparent bg-white/35"}`}
                >
                  <span className={`text-xs font-semibold ${isToday ? "text-accent" : ""}`}>
                    {d.getDate()}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {list.slice(0, 5).map((occ) => (
                      <span
                        key={occ.event.id + occ.occurDate}
                        className="h-[5px] w-[5px] rounded-full"
                        style={{ background: occ.event.color, opacity: occ.completed ? 0.35 : 1 }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DayPanel selectedDate={selectedDate} onEdit={openEdit} onQuickAdd={quickAdd} />
      </div>

      <EventModal state={modal} onClose={() => setModal({ open: false })} />
    </section>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="secondary-button flex h-11 w-11 items-center justify-center rounded-xl text-base md:h-9 md:w-9 md:text-sm"
    >
      {children}
    </button>
  );
}
