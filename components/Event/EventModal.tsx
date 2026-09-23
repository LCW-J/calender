"use client";

import { useEffect, useState } from "react";
import { EventItem, RepeatType, ReminderOffset } from "@/types/event";
import { todayISO, ISO_WEEKDAY_LABELS_ZH } from "@/lib/date/date";
import { useEvents } from "@/lib/events/store";

const COLORS = ["#d6815f", "#7f9b7a", "#7698a3", "#c77b76", "#a889ad"];

export interface EventModalState {
  open: boolean;
  /** 有 id 代表編輯既有 Event（含整個重複系列）；沒有 id 代表新增，date 是預填日期 */
  editing?: EventItem;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export default function EventModal({
  state,
  onClose,
}: {
  state: EventModalState;
  onClose: () => void;
}) {
  const { addEvent, updateEvent, deleteEvent } = useEvents();
  const editing = state.editing;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:00");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [repeatType, setRepeatType] = useState<RepeatType>("NONE");
  const [days, setDays] = useState<number[]>([]);
  const [until, setUntil] = useState("");
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>("NONE");
  const [reminderCustomMinutes, setReminderCustomMinutes] = useState(10);

  useEffect(() => {
    if (!state.open) return;
    if (editing) {
      setTitle(editing.title);
      setDate(editing.date);
      setStartTime(editing.startTime);
      setEndTime(editing.endTime);
      setDescription(editing.description || "");
      setColor(editing.color || COLORS[0]);
      setRepeatType(editing.repeatRule?.type || "NONE");
      setDays(editing.repeatRule?.days || []);
      setUntil(editing.repeatRule?.until || "");
      setReminderOffset(editing.reminder?.offset || "NONE");
      setReminderCustomMinutes(editing.reminder?.customMinutes ?? 10);
    } else {
      setTitle("");
      setDate(state.defaultDate || todayISO());
      setStartTime(state.defaultStartTime || "19:00");
      setEndTime(state.defaultEndTime || "20:00");
      setDescription("");
      setColor(COLORS[0]);
      setRepeatType("NONE");
      setDays([]);
      setUntil("");
      setReminderOffset("NONE");
      setReminderCustomMinutes(10);
    }
  }, [state.open, state.editing, state.defaultDate, state.defaultStartTime, state.defaultEndTime, editing]);

  if (!state.open) return null;

  function toggleDay(idx: number) {
    setDays((prev) => (prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]));
  }

  function save() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const repeatRule =
      repeatType === "NONE"
        ? null
        : {
            type: repeatType,
            ...(repeatType === "WEEKLY" || repeatType === "CUSTOM" ? { days } : {}),
            ...(until ? { until } : {}),
          };

    const patch = {
      title: trimmed,
      date,
      startTime,
      endTime,
      timeZone: editing?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Taipei",
      description: description.trim(),
      color,
      repeatRule,
      reminder:
        reminderOffset === "NONE"
          ? { offset: "NONE" as ReminderOffset }
          : {
              offset: reminderOffset,
              ...(reminderOffset === "CUSTOM" ? { customMinutes: reminderCustomMinutes } : {}),
            },
    };

    if (editing) {
      updateEvent(editing.id, patch);
    } else {
      addEvent(patch);
    }
    onClose();
  }

  function remove() {
    if (editing) deleteEvent(editing.id);
    onClose();
  }

  const showDays = repeatType === "WEEKLY" || repeatType === "CUSTOM";
  const showUntil = repeatType !== "NONE";

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-t-[28px] border border-white/70 bg-[#fffaf3] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:rounded-[28px] sm:p-6">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{editing ? "編輯活動" : "新增活動"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-text-dim hover:bg-surface2 hover:text-text sm:hidden"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <Field label="標題">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：複習類比電子學"
            autoFocus
          />
        </Field>

        <Field label="日期">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <div className="flex gap-2.5">
          <Field label="開始時間" className="flex-1">
            <input
              className="input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="結束時間" className="flex-1">
            <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>

        <Field label="備註（選填）">
          <textarea
            className="input min-h-[50px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="細節或提醒事項"
          />
        </Field>

        <Field label="重複">
          <select
            className="input"
            value={repeatType}
            onChange={(e) => setRepeatType(e.target.value as RepeatType)}
          >
            <option value="NONE">不重複</option>
            <option value="DAILY">每天</option>
            <option value="WEEKLY">每週</option>
            <option value="CUSTOM">自訂星期</option>
            <option value="MONTHLY">每月（同一天）</option>
            <option value="YEARLY">每年（同一天）</option>
          </select>
        </Field>

        {showDays && (
          <Field label="重複於">
            <div className="flex gap-2">
              {ISO_WEEKDAY_LABELS_ZH.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg border text-xs ${
                    days.includes(idx)
                      ? "border-accent bg-accent-dim text-text"
                      : "border-border bg-surface2 text-text-dim"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {showUntil && (
          <Field label="重複結束日期（選填）">
            <input className="input" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
          </Field>
        )}

        <Field label="提醒">
          <select
            className="input"
            value={reminderOffset}
            onChange={(e) => setReminderOffset(e.target.value as ReminderOffset)}
          >
            <option value="NONE">不提醒</option>
            <option value="5_MIN">提前 5 分鐘</option>
            <option value="10_MIN">提前 10 分鐘</option>
            <option value="15_MIN">提前 15 分鐘</option>
            <option value="30_MIN">提前 30 分鐘</option>
            <option value="1_HOUR">提前 1 小時</option>
            <option value="2_HOUR">提前 2 小時</option>
            <option value="1_DAY">提前 1 天</option>
            <option value="CUSTOM">自訂分鐘數</option>
          </select>
        </Field>

        {reminderOffset === "CUSTOM" && (
          <Field label="提前幾分鐘">
            <input
              className="input"
              type="number"
              min={1}
              value={reminderCustomMinutes}
              onChange={(e) => setReminderCustomMinutes(Number(e.target.value) || 1)}
            />
          </Field>
        )}

        {reminderOffset !== "NONE" && (
          <p className="mb-3 -mt-2 text-[11px] leading-relaxed text-text-faint">
            請先到「設定」開啟推播通知；開啟後即使關閉網站，手機仍可收到提醒。
          </p>
        )}

        <Field label="顏色標籤">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-text" : "border-transparent"}`}
              />
            ))}
          </div>
        </Field>

        <div className="mt-4 flex items-center justify-between">
          {editing ? (
            <button className="px-1 py-2 text-sm text-danger" onClick={remove}>
              刪除
            </button>
          ) : (
            <span />
          )}
          <div className="ml-auto flex gap-2">
            <button className="px-1 py-2 text-sm text-text-dim" onClick={onClose}>
              取消
            </button>
            <button
              className="primary-button rounded-card px-4 py-2 text-sm font-semibold"
              onClick={save}
            >
              儲存
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="mb-1.5 block text-[11.5px] font-semibold tracking-wide text-text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
