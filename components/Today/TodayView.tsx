"use client";

import { useMemo, useState } from "react";
import { todayISO, WEEKDAY_ZH } from "@/lib/date/date";
import { occurrencesOn } from "@/lib/recurrence/occurs";
import { useEvents } from "@/lib/events/store";
import EventModal, { EventModalState } from "@/components/Event/EventModal";
import { EventOccurrence } from "@/types/event";
import TodayTimeline from "./TodayTimeline";
import TaskSection from "@/components/Task/TaskSection";

export default function TodayView() {
  const { events, loaded } = useEvents();
  const [modal, setModal] = useState<EventModalState>({ open: false });

  const today = todayISO();
  const now = new Date();
  const list = useMemo(() => occurrencesOn(events, today), [events, today]);

  function openEdit(occurrence: EventOccurrence) {
    setModal({ open: true, editing: occurrence.event });
  }

  function openAtHour(hour: number) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = hour === 23 ? "23:59" : `${String(hour + 1).padStart(2, "0")}:00`;
    setModal({ open: true, defaultDate: today, defaultStartTime: start, defaultEndTime: end });
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
      ) : (
        <TodayTimeline occurrences={list} onAdd={openAtHour} onEdit={openEdit} />
      )}

      <TaskSection />

      <EventModal state={modal} onClose={() => setModal({ open: false })} />
    </section>
  );
}
