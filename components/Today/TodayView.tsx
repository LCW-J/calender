"use client";

import { useMemo, useState } from "react";
import { todayISO, WEEKDAY_ZH } from "@/lib/date/date";
import { occurrencesOn } from "@/lib/recurrence/occurs";
import { useEvents } from "@/lib/events/store";
import EventRow from "@/components/Event/EventRow";
import EventModal, { EventModalState } from "@/components/Event/EventModal";
import { EventItem } from "@/types/event";

export default function TodayView() {
  const { events, loaded } = useEvents();
  const [modal, setModal] = useState<EventModalState>({ open: false });

  const today = todayISO();
  const now = new Date();
  const list = useMemo(() => occurrencesOn(events, today), [events, today]);

  function openEdit(event: EventItem) {
    setModal({ open: true, editing: event });
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl tracking-tight">今天</h1>
          <div className="text-sm text-text-dim">
            <span className="mono text-text-faint">{today}</span>　星期{WEEKDAY_ZH[now.getDay()]}
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-card bg-accent px-4 py-2.5 text-sm font-semibold text-[#1a1305] hover:brightness-110"
          onClick={() => setModal({ open: true, defaultDate: today })}
        >
          ＋ 新增活動
        </button>
      </div>

      {!loaded ? (
        <div className="py-10 text-center text-sm text-text-faint">載入中…</div>
      ) : !list.length ? (
        <div className="rounded-card border border-dashed border-border py-10 text-center text-sm text-text-faint">
          今天還沒有安排活動
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((occ) => (
            <EventRow key={occ.event.id + occ.occurDate} occ={occ} onEdit={() => openEdit(occ.event)} />
          ))}
        </div>
      )}

      <EventModal state={modal} onClose={() => setModal({ open: false })} />
    </section>
  );
}
