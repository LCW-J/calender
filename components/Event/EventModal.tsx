"use client";

import { useEffect, useState } from "react";
import { EventItem, RepeatType } from "@/types/event";
import { todayISO, ISO_WEEKDAY_LABELS_ZH } from "@/lib/date/date";
import { useEvents } from "@/lib/events/store";

const COLORS = ["#e8a33d", "#4fa8a0", "#7a8fd6", "#d9685f", "#9b7fd6"];

export interface EventModalState {
  open: boolean;
  /** 有 id 代表編輯既有 Event（含整個重複系列）；沒有 id 代表新增，date 是預填日期 */
  editing?: EventItem;
  defaultDate?: string;
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
    } else {
      setTitle("");
      setDate(state.defaultDate || todayISO());
      setStartTime("19:00");
      setEndTime("20:00");
      setDescription("");
      setColor(COLORS[0]);
      setRepeatType("NONE");
      setDays([]);
      setUntil("");
    }
  }, [state.open, state.editing, state.defaultDate, editing]);

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
      description: description.trim(),
      color,
      repeatRule,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold">{editing ? "編輯活動" : "新增活動"}</h2>

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
              className="rounded-card bg-accent px-4 py-2 text-sm font-semibold text-[#1a1305] hover:brightness-110"
              onClick={save}
            >
              儲存
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 9px 10px;
          color: var(--text);
          font-family: inherit;
          font-size: 13.5px;
        }
        .input:focus {
          outline: none;
          border-color: var(--accent);
        }
      `}</style>
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
