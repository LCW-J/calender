"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EventItem, NewEventInput } from "@/types/event";
import { todayISO } from "@/lib/date/date";

/**
 * PROJECT_SPEC.md §2.1 Single Source of Truth：
 * 所有活動只能有一個主要資料來源。Today / Weekly / Calendar 都從這裡讀取，
 * 不能各自建立自己的活動資料。
 *
 * PROJECT_SPEC.md §15：MVP 階段先用 LocalStorage，等核心 UI 與資料邏輯穩定後
 * 再導入 PostgreSQL — 這裡把讀寫都包成一層，之後要換成打 API 也只需要改這個檔案。
 */

const STORAGE_KEY = "calendar-app:events:v1";

function uid(): string {
  return "e" + Math.random().toString(36).slice(2, 10);
}

function seedEvents(): EventItem[] {
  const today = todayISO();
  return [
    {
      id: uid(),
      title: "類比電子學複習",
      description: "",
      date: today,
      startTime: "19:00",
      endTime: "20:30",
      completed: false,
      color: "#e8a33d",
      repeatRule: null,
      completedDates: {},
    },
    {
      id: uid(),
      title: "英文",
      description: "",
      date: today,
      startTime: "20:40",
      endTime: "21:10",
      completed: false,
      color: "#4fa8a0",
      repeatRule: { type: "DAILY" },
      completedDates: {},
    },
    {
      id: uid(),
      title: "健身",
      description: "",
      date: today,
      startTime: "13:00",
      endTime: "14:00",
      completed: true,
      color: "#7a8fd6",
      repeatRule: null,
      completedDates: {},
    },
  ];
}

function loadEvents(): EventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedEvents();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedEvents();
    return parsed as EventItem[];
  } catch (err) {
    console.warn("讀取本機儲存失敗，改用預設資料", err);
    return seedEvents();
  }
}

function persist(events: EventItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn("儲存到本機失敗", err);
  }
}

interface EventStoreValue {
  events: EventItem[];
  loaded: boolean;
  addEvent: (input: NewEventInput) => void;
  updateEvent: (id: string, patch: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  /** 切換某一次發生的完成狀態。非重複活動直接切 completed；重複活動切 completedDates[occurDate]。 */
  toggleOccurrence: (id: string, occurDate: string) => void;
  resetToSeed: () => void;
}

const EventStoreContext = createContext<EventStoreValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 只在 client 端掛載後讀取 localStorage，避免 SSR/CSR 內容不一致
  useEffect(() => {
    setEvents(loadEvents());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) persist(events);
  }, [events, loaded]);

  const addEvent = useCallback((input: NewEventInput) => {
    setEvents((prev) => [
      ...prev,
      { ...input, id: uid(), completed: input.completed ?? false, completedDates: {} },
    ]);
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleOccurrence = useCallback((id: string, occurDate: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const recurring = !!(e.repeatRule && e.repeatRule.type !== "NONE");
        if (recurring) {
          const completedDates = { ...(e.completedDates || {}) };
          completedDates[occurDate] = !completedDates[occurDate];
          return { ...e, completedDates };
        }
        return { ...e, completed: !e.completed };
      })
    );
  }, []);

  const resetToSeed = useCallback(() => {
    setEvents(seedEvents());
  }, []);

  const value = useMemo(
    () => ({ events, loaded, addEvent, updateEvent, deleteEvent, toggleOccurrence, resetToSeed }),
    [events, loaded, addEvent, updateEvent, deleteEvent, toggleOccurrence, resetToSeed]
  );

  return <EventStoreContext.Provider value={value}>{children}</EventStoreContext.Provider>;
}

export function useEvents(): EventStoreValue {
  const ctx = useContext(EventStoreContext);
  if (!ctx) throw new Error("useEvents 必須在 <EventProvider> 內使用");
  return ctx;
}
