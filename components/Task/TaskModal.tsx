"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/date/date";
import { useTasks } from "@/lib/tasks/store";
import { TaskItem } from "@/types/task";

export interface TaskModalState { open: boolean; editing?: TaskItem }

export default function TaskModal({ state, onClose }: { state: TaskModalState; onClose: () => void }) {
  const { addTask, updateTask, deleteTask } = useTasks();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!state.open) return;
    setTitle(state.editing?.title || "");
    setDueDate(state.editing?.dueDate || todayISO());
    setDescription(state.editing?.description || "");
  }, [state.editing, state.open]);

  if (!state.open) return null;

  function save() {
    if (!title.trim() || !dueDate) return;
    const patch = { title: title.trim(), dueDate, description: description.trim() };
    if (state.editing) updateTask(state.editing.id, patch);
    else addTask(patch);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{state.editing ? "編輯任務" : "新增任務"}</h2>
          <button type="button" className="h-10 w-10 rounded-full text-xl text-text-dim hover:bg-surface2" onClick={onClose}>×</button>
        </div>
        <label className="mb-4 block text-sm text-text-dim">任務名稱
          <input className="input mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="例如：繳交報告" />
        </label>
        <label className="mb-4 block text-sm text-text-dim">到期日
          <input className="input mt-1.5" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="mb-5 block text-sm text-text-dim">備註（選填）
          <textarea className="input mt-1.5 min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="flex gap-2">
          {state.editing && <button type="button" className="rounded-card px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10" onClick={() => { deleteTask(state.editing!.id); onClose(); }}>刪除</button>}
          <button type="button" className="ml-auto rounded-card border border-border px-4 py-2.5 text-sm" onClick={onClose}>取消</button>
          <button type="button" className="rounded-card bg-accent px-4 py-2.5 text-sm font-semibold text-[#1a1305]" onClick={save}>儲存</button>
        </div>
      </div>
    </div>
  );
}
