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
    <div className="soft-card flex items-start gap-3 rounded-card px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-soft-hover">
      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mt-1 h-[18px] w-[18px] shrink-0 accent-accent" aria-label={`${task.title}標示為${task.completed ? "未完成" : "完成"}`} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <span className={`block text-sm font-medium ${task.completed ? "text-text-faint line-through" : ""}`}>{task.title}</span>
        {task.description && <span className="mt-0.5 block truncate text-xs text-text-faint">{task.description}</span>}
      </button>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${overdue ? "bg-danger/10 text-danger" : "bg-surface2/80 text-text-dim"}`}>
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
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-teal">Keep moving</div>
          <h2 className="text-xl font-bold">任務</h2>
          <p className="text-xs text-text-faint">未完成的任務會持續保留，直到你勾選完成。</p>
        </div>
        <button type="button" className="secondary-button rounded-card px-3.5 py-2 text-sm font-semibold" onClick={() => setModal({ open: true })}>＋ 新增任務</button>
      </div>
      {syncState === "error" && <p className="mb-2 text-xs text-red-400">任務目前顯示本機資料，恢復連線後會再同步。</p>}
      {!loaded ? <p className="py-5 text-center text-sm text-text-faint">載入任務中…</p> : pending.length ? (
        <div className="stagger-list flex flex-col gap-2.5">{pending.map((task) => <TaskRow key={task.id} task={task} onEdit={() => setModal({ open: true, editing: task })} />)}</div>
      ) : <div className="soft-card rounded-card border-dashed py-7 text-center text-sm text-text-faint">今天沒有未完成任務，做得很好。</div>}
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
