"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { EventItem, NewEventInput } from "@/types/event";
import { todayISO } from "@/lib/date/date";

/**
 * Event 仍是 Today / Weekly / Calendar 的 Single Source of Truth。
 * Neon 是登入後的權威資料來源；LocalStorage 只保留快取與尚未送出的操作。
 */

const LEGACY_STORAGE_KEY = "calendar-app:events:v1";
const MIGRATION_OWNER_KEY = "calendar-app:legacy-owner:v1";

function userStorageKey(userId: string) {
  return `calendar-app:events:v2:${userId}`;
}

function userPendingKey(userId: string) {
  return `calendar-app:pending:v2:${userId}`;
}

export type SyncState = "loading" | "syncing" | "synced" | "error" | "local";

interface PendingMutation {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "e" + Math.random().toString(36).slice(2, 10);
}

function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Taipei";
  } catch {
    return "Asia/Taipei";
  }
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
      timeZone: currentTimeZone(),
      completed: false,
      color: "#e8a33d",
      repeatRule: null,
      completedDates: {},
      reminder: { offset: "NONE" },
    },
    {
      id: uid(),
      title: "英文",
      description: "",
      date: today,
      startTime: "20:40",
      endTime: "21:10",
      timeZone: currentTimeZone(),
      completed: false,
      color: "#4fa8a0",
      repeatRule: { type: "DAILY" },
      completedDates: {},
      reminder: { offset: "NONE" },
    },
    {
      id: uid(),
      title: "健身",
      description: "",
      date: today,
      startTime: "13:00",
      endTime: "14:00",
      timeZone: currentTimeZone(),
      completed: true,
      color: "#7a8fd6",
      repeatRule: null,
      completedDates: {},
      reminder: { offset: "NONE" },
    },
  ];
}

function loadEvents(key: string, seedWhenMissing = false): EventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return seedWhenMissing ? seedEvents() : [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EventItem[]) : seedWhenMissing ? seedEvents() : [];
  } catch {
    return seedWhenMissing ? seedEvents() : [];
  }
}

function persist(key: string, events: EventItem[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(events));
  } catch (error) {
    console.warn("儲存本機快取失敗", error);
  }
}

function loadPending(key: string): PendingMutation[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? (parsed as PendingMutation[]) : [];
  } catch {
    return [];
  }
}

function savePending(key: string, queue: PendingMutation[]) {
  window.localStorage.setItem(key, JSON.stringify(queue));
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

interface EventStoreValue {
  events: EventItem[];
  loaded: boolean;
  syncState: SyncState;
  addEvent: (input: NewEventInput) => void;
  updateEvent: (id: string, patch: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  toggleOccurrence: (id: string, occurDate: string) => void;
  resetToSeed: () => void;
  retrySync: () => void;
  replaceAllEvents: (events: EventItem[]) => Promise<void>;
  clearLocalData: () => void;
}

const EventStoreContext = createContext<EventStoreValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const activeStorageKey = userId ? userStorageKey(userId) : LEGACY_STORAGE_KEY;
  const activePendingKey = userId ? userPendingKey(userId) : null;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const eventsRef = useRef<EventItem[]>([]);
  const flushRef = useRef<Promise<void> | null>(null);

  const replaceLocal = useCallback((next: EventItem[]) => {
    eventsRef.current = next;
    setEvents(next);
    persist(activeStorageKey, next);
  }, [activeStorageKey]);

  const flushPending = useCallback(async () => {
    if (status !== "authenticated" || !activePendingKey) return;
    if (flushRef.current) return flushRef.current;

    const work = (async () => {
      const queue = loadPending(activePendingKey);
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
        savePending(activePendingKey, queue);
      }
      setSyncState("synced");
    })();

    flushRef.current = work;
    try {
      await work;
    } catch (error) {
      console.warn("雲端同步失敗，已保留待同步操作", error);
      setSyncState("error");
      throw error;
    } finally {
      flushRef.current = null;
    }
  }, [status, activePendingKey]);

  const enqueue = useCallback(
    (mutation: Omit<PendingMutation, "id">) => {
      if (!activePendingKey) return;
      const queue = loadPending(activePendingKey);
      queue.push({ ...mutation, id: uid() });
      savePending(activePendingKey, queue);
      setSyncState("syncing");
      void flushPending().catch(() => undefined);
    },
    [activePendingKey, flushPending]
  );

  const loadFromCloud = useCallback(async () => {
    if (!userId) return;
    const hasUserCache = window.localStorage.getItem(activeStorageKey) !== null;
    const legacyOwner = window.localStorage.getItem(MIGRATION_OWNER_KEY);
    const canUseLegacy = !hasUserCache && (!legacyOwner || legacyOwner === userId);
    const local = hasUserCache
      ? loadEvents(activeStorageKey)
      : canUseLegacy
        ? loadEvents(LEGACY_STORAGE_KEY, true)
        : [];
    setLoaded(false);
    setSyncState("loading");

    try {
      await flushPending();
      let cloud = await jsonRequest<EventItem[]>("/api/events");
      if (!cloud.length && local.length) {
        cloud = await jsonRequest<EventItem[]>("/api/events/import", {
          method: "POST",
          body: JSON.stringify(local),
        });
        if (canUseLegacy) window.localStorage.setItem(MIGRATION_OWNER_KEY, userId);
      }
      replaceLocal(cloud);
      setSyncState("synced");
    } catch (error) {
      console.warn("無法載入 Neon，暫時顯示本機快取", error);
      replaceLocal(local);
      setSyncState("error");
    } finally {
      setLoaded(true);
    }
  }, [userId, activeStorageKey, flushPending, replaceLocal]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      replaceLocal(loadEvents(LEGACY_STORAGE_KEY, true));
      setLoaded(true);
      setSyncState("local");
      return;
    }
    void loadFromCloud();
  }, [status, loadFromCloud, replaceLocal]);

  const addEvent = useCallback(
    (input: NewEventInput) => {
      const event: EventItem = {
        ...input,
        timeZone: input.timeZone || currentTimeZone(),
        id: uid(),
        completed: input.completed ?? false,
        completedDates: {},
      };
      replaceLocal([...eventsRef.current, event]);
      enqueue({ method: "POST", url: "/api/events", body: event });
    },
    [enqueue, replaceLocal]
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<EventItem>) => {
      const current = eventsRef.current.find((event) => event.id === id);
      if (!current) return;
      const updated = { ...current, ...patch, id };
      replaceLocal(eventsRef.current.map((event) => (event.id === id ? updated : event)));
      enqueue({ method: "PATCH", url: `/api/events/${encodeURIComponent(id)}`, body: updated });
    },
    [enqueue, replaceLocal]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      replaceLocal(eventsRef.current.filter((event) => event.id !== id));
      enqueue({ method: "DELETE", url: `/api/events/${encodeURIComponent(id)}` });
    },
    [enqueue, replaceLocal]
  );

  const toggleOccurrence = useCallback(
    (id: string, occurDate: string) => {
      const current = eventsRef.current.find((event) => event.id === id);
      if (!current) return;
      const recurring = !!(current.repeatRule && current.repeatRule.type !== "NONE");
      const updated: EventItem = recurring
        ? {
            ...current,
            completedDates: {
              ...(current.completedDates || {}),
              [occurDate]: !current.completedDates?.[occurDate],
            },
          }
        : { ...current, completed: !current.completed };
      replaceLocal(eventsRef.current.map((event) => (event.id === id ? updated : event)));
      enqueue({ method: "PATCH", url: `/api/events/${encodeURIComponent(id)}`, body: updated });
    },
    [enqueue, replaceLocal]
  );

  const resetToSeed = useCallback(() => {
    const next = seedEvents();
    replaceLocal(next);
    enqueue({ method: "POST", url: "/api/events/replace", body: next });
  }, [enqueue, replaceLocal]);

  const retrySync = useCallback(() => {
    void loadFromCloud();
  }, [loadFromCloud]);

  const replaceAllEvents = useCallback(
    async (next: EventItem[]) => {
      if (!userId || !activePendingKey) throw new Error("尚未登入");
      if (loadPending(activePendingKey).length || flushRef.current) {
        throw new Error("仍有資料正在同步，請稍後再試");
      }
      setSyncState("syncing");
      try {
        const cloud = await jsonRequest<EventItem[]>("/api/events/replace", {
          method: "POST",
          body: JSON.stringify(next),
        });
        replaceLocal(cloud);
        setSyncState("synced");
      } catch (error) {
        setSyncState("error");
        throw error;
      }
    },
    [userId, activePendingKey, replaceLocal]
  );

  const clearLocalData = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(activeStorageKey);
    if (activePendingKey) window.localStorage.removeItem(activePendingKey);
    if (userId && window.localStorage.getItem(MIGRATION_OWNER_KEY) === userId) {
      window.localStorage.removeItem(MIGRATION_OWNER_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    eventsRef.current = [];
    setEvents([]);
  }, [activeStorageKey, activePendingKey, userId]);

  const value = useMemo(
    () => ({
      events,
      loaded,
      syncState,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleOccurrence,
      resetToSeed,
      retrySync,
      replaceAllEvents,
      clearLocalData,
    }),
    [
      events,
      loaded,
      syncState,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleOccurrence,
      resetToSeed,
      retrySync,
      replaceAllEvents,
      clearLocalData,
    ]
  );

  return <EventStoreContext.Provider value={value}>{children}</EventStoreContext.Provider>;
}

export function useEvents(): EventStoreValue {
  const context = useContext(EventStoreContext);
  if (!context) throw new Error("useEvents 必須在 <EventProvider> 內使用");
  return context;
}
