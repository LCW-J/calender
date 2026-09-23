"use client";

import { useMemo, useState } from "react";
import { todayISO } from "@/lib/date/date";
import { useTasks } from "@/lib/tasks/store";
import { TaskItem } from "@/types/task";
import TaskModal, { TaskModalState } from "./TaskModal";

function TaskRow({ task, onEdit }: { task: TaskItem; onEdit: () => void }) {
  const { toggleTask } = useTasks();
  const overdue = !task.completed && task.dueDate < todayISO();
  return (
    <div className="flex items-start gap-3 rounded-card border border-border bg-surface px-3.5 py-3">
      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mt-1 h-4 w-4 shrink-0 accent-accent" aria-label={`${task.title}標示為${task.completed ? "未完成" : "完成"}`} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <span className={`block text-sm font-medium ${task.completed ? "text-text-faint line-through" : ""}`}>{task.title}</span>
        {task.description && <span className="mt-0.5 block truncate text-xs text-text-faint">{task.description}</span>}
      </button>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${overdue ? "bg-red-400/10 text-red-400" : "bg-surface2 text-text-dim"}`}>
        {overdue ? "已逾期 · " : ""}{task.dueDate}
      </span>
    </div>
  );
}

export default function TaskSection() {
  const { tasks, loaded, syncState } = useTasks();
  const [modal, setModal] = useState<TaskModalState>({ open: false });
  const [pending, completed] = useMemo(() => {
    const ordered = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return [ordered.filter((task) => !task.completed), ordered.filter((task) => task.completed)];
  }, [tasks]);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">任務</h2>
          <p className="text-xs text-text-faint">未完成的任務會持續保留，直到你勾選完成。</p>
        </div>
        <button type="button" className="rounded-card border border-border px-3 py-2 text-sm hover:bg-surface2" onClick={() => setModal({ open: true })}>＋ 新增任務</button>
      </div>
      {syncState === "error" && <p className="mb-2 text-xs text-red-400">任務目前顯示本機資料，恢復連線後會再同步。</p>}
      {!loaded ? <p className="py-5 text-center text-sm text-text-faint">載入任務中…</p> : pending.length ? (
        <div className="flex flex-col gap-2">{pending.map((task) => <TaskRow key={task.id} task={task} onEdit={() => setModal({ open: true, editing: task })} />)}</div>
      ) : <div className="rounded-card border border-dashed border-border py-6 text-center text-sm text-text-faint">沒有未完成任務</div>}
      {!!completed.length && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-text-dim">已完成（{completed.length}）</summary>
          <div className="mt-2 flex flex-col gap-2">{completed.map((task) => <TaskRow key={task.id} task={task} onEdit={() => setModal({ open: true, editing: task })} />)}</div>
        </details>
      )}
      <TaskModal state={modal} onClose={() => setModal({ open: false })} />
    </section>
  );
}
