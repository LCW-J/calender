"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { NewTaskInput, TaskItem } from "@/types/task";

type TaskSyncState = "loading" | "syncing" | "synced" | "error" | "local";
type PendingMutation = { id: string; method: "POST" | "PATCH" | "DELETE"; url: string; body?: unknown };

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "t" + Math.random().toString(36).slice(2, 10);
}

function storageKey(userId?: string) {
  return userId ? `calendar-app:tasks:v1:${userId}` : "calendar-app:tasks:v1:local";
}

function pendingKey(userId: string) {
  return `calendar-app:task-pending:v1:${userId}`;
}

function readArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("儲存任務本機快取失敗", error);
  }
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${init?.method || "GET"} ${url}: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

interface TaskStoreValue {
  tasks: TaskItem[];
  loaded: boolean;
  syncState: TaskSyncState;
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: Partial<TaskItem>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  retrySync: () => void;
  replaceAllTasks: (tasks: TaskItem[]) => Promise<void>;
}

const TaskStoreContext = createContext<TaskStoreValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const cacheKey = storageKey(userId);
  const queueKey = userId ? pendingKey(userId) : null;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState<TaskSyncState>("loading");
  const tasksRef = useRef<TaskItem[]>([]);
  const flushRef = useRef<Promise<void> | null>(null);

  const replaceLocal = useCallback((next: TaskItem[]) => {
    tasksRef.current = next;
    setTasks(next);
    write(cacheKey, next);
  }, [cacheKey]);

  const flushPending = useCallback(async () => {
    if (status !== "authenticated" || !queueKey) return;
    if (flushRef.current) return flushRef.current;
    const work = (async () => {
      const queue = readArray<PendingMutation>(queueKey);
      if (!queue.length) {
        setSyncState("synced");
        return;
      }
      setSyncState("syncing");
      while (queue.length) {
        const item = queue[0];
        await jsonRequest(item.url, {
          method: item.method,
          body: item.body === undefined ? undefined : JSON.stringify(item.body),
        });
        queue.shift();
        write(queueKey, queue);
      }
      setSyncState("synced");
    })();
    flushRef.current = work;
    try {
      await work;
    } catch (error) {
      console.warn("任務同步失敗，已保留待同步操作", error);
      setSyncState("error");
      throw error;
    } finally {
      flushRef.current = null;
    }
  }, [queueKey, status]);

  const enqueue = useCallback((mutation: Omit<PendingMutation, "id">) => {
    if (!queueKey) return;
    const queue = readArray<PendingMutation>(queueKey);
    queue.push({ ...mutation, id: uid() });
    write(queueKey, queue);
    setSyncState("syncing");
    void flushPending().catch(() => undefined);
  }, [flushPending, queueKey]);

  const loadFromCloud = useCallback(async () => {
    if (!userId) return;
    const local = readArray<TaskItem>(cacheKey);
    setLoaded(false);
    setSyncState("loading");
    try {
      await flushPending();
      const cloud = await jsonRequest<TaskItem[]>("/api/tasks");
      replaceLocal(cloud);
      setSyncState("synced");
    } catch (error) {
      console.warn("無法載入雲端任務，暫時顯示本機快取", error);
      replaceLocal(local);
      setSyncState("error");
    } finally {
      setLoaded(true);
    }
  }, [cacheKey, flushPending, replaceLocal, userId]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      replaceLocal(readArray<TaskItem>(cacheKey));
      setLoaded(true);
      setSyncState("local");
      return;
    }
    void loadFromCloud();
  }, [cacheKey, loadFromCloud, replaceLocal, status]);

  const addTask = useCallback((input: NewTaskInput) => {
    const task: TaskItem = { ...input, id: uid(), completed: input.completed ?? false };
    replaceLocal([...tasksRef.current, task]);
    enqueue({ method: "POST", url: "/api/tasks", body: task });
  }, [enqueue, replaceLocal]);

  const updateTask = useCallback((id: string, patch: Partial<TaskItem>) => {
    const current = tasksRef.current.find((task) => task.id === id);
    if (!current) return;
    const updated = { ...current, ...patch, id };
    replaceLocal(tasksRef.current.map((task) => task.id === id ? updated : task));
    enqueue({ method: "PATCH", url: `/api/tasks/${encodeURIComponent(id)}`, body: updated });
  }, [enqueue, replaceLocal]);

  const toggleTask = useCallback((id: string) => {
    const current = tasksRef.current.find((task) => task.id === id);
    if (current) updateTask(id, { completed: !current.completed });
  }, [updateTask]);

  const deleteTask = useCallback((id: string) => {
    replaceLocal(tasksRef.current.filter((task) => task.id !== id));
    enqueue({ method: "DELETE", url: `/api/tasks/${encodeURIComponent(id)}` });
  }, [enqueue, replaceLocal]);

  const replaceAllTasks = useCallback(async (next: TaskItem[]) => {
    if (!userId || !queueKey) throw new Error("尚未登入");
    if (readArray<PendingMutation>(queueKey).length || flushRef.current) {
      throw new Error("仍有任務正在同步，請稍後再試");
    }
    setSyncState("syncing");
    try {
      const cloud = await jsonRequest<TaskItem[]>("/api/tasks/replace", {
        method: "POST",
        body: JSON.stringify(next),
      });
      replaceLocal(cloud);
      setSyncState("synced");
    } catch (error) {
      setSyncState("error");
      throw error;
    }
  }, [queueKey, replaceLocal, userId]);

  const value = useMemo(() => ({
    tasks,
    loaded,
    syncState,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    retrySync: () => void loadFromCloud(),
    replaceAllTasks,
  }), [addTask, deleteTask, loadFromCloud, loaded, replaceAllTasks, syncState, tasks, toggleTask, updateTask]);

  return <TaskStoreContext.Provider value={value}>{children}</TaskStoreContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskStoreContext);
  if (!context) throw new Error("useTasks 必須在 <TaskProvider> 內使用");
  return context;
}
