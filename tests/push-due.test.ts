import { describe, expect, it } from "vitest";
import { dueReminders, reminderForOccurrence, upcomingReminders } from "@/lib/notification/due";
import { EventItem } from "@/types/event";

function event(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "event-1",
    title: "類比電子學",
    date: "2026-09-23",
    startTime: "10:10",
    endTime: "11:00",
    timeZone: "Asia/Taipei",
    completed: false,
    completedDates: {},
    repeatRule: null,
    reminder: { offset: "10_MIN" },
    ...overrides,
  };
}

describe("dueReminders", () => {
  it("依活動時區找出剛到提醒時間的活動", () => {
    const now = new Date("2026-09-23T02:01:00.000Z"); // 台北 10:01
    const due = dueReminders(event(), now);
    expect(due).toHaveLength(1);
    expect(due[0].occurDate).toBe("2026-09-23");
    expect(due[0].scheduledFor.toISOString()).toBe("2026-09-23T02:00:00.000Z");
  });

  it("尚未到提醒時間時不會提前發送", () => {
    const now = new Date("2026-09-23T01:59:00.000Z");
    expect(dueReminders(event(), now)).toHaveLength(0);
  });

  it("已完成的活動不再提醒", () => {
    const now = new Date("2026-09-23T02:01:00.000Z");
    expect(dueReminders(event({ completed: true }), now)).toHaveLength(0);
  });

  it("重複活動會使用該次發生日期，並略過已完成的一次", () => {
    const recurring = event({
      date: "2026-09-20",
      repeatRule: { type: "DAILY" },
      completedDates: { "2026-09-23": true },
    });
    const now = new Date("2026-09-23T02:01:00.000Z");
    expect(dueReminders(recurring, now)).toHaveLength(0);
  });
});

describe("queued reminders", () => {
  it("會精確計算未來六天內要交給 QStash 的提醒", () => {
    const now = new Date("2026-09-23T01:00:00.000Z");
    const reminders = upcomingReminders(event(), now);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].scheduledFor.toISOString()).toBe("2026-09-23T02:00:00.000Z");
  });

  it("超過免費方案延遲範圍的活動等待低頻排程器之後補排", () => {
    const now = new Date("2026-09-15T01:00:00.000Z");
    expect(upcomingReminders(event(), now)).toHaveLength(0);
  });

  it("派送前重新核對已完成狀態", () => {
    expect(reminderForOccurrence(event({ completed: true }), "2026-09-23")).toBeNull();
  });
});
