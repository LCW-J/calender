import { describe, expect, it } from "vitest";
import { parseEvent, parseEventArray } from "@/lib/events/validation";

const validEvent = {
  id: "event-1",
  title: "複習類比電子學",
  description: "Chapter 3",
  date: "2026-09-22",
  startTime: "19:00",
  endTime: "20:30",
  completed: false,
  color: "#e8a33d",
  repeatRule: { type: "WEEKLY", days: [0, 2, 4] },
  completedDates: { "2026-09-22": true },
  reminder: { offset: "10_MIN" },
};

describe("event API validation", () => {
  it("接受完整且有效的 Event", () => {
    expect(parseEvent(validEvent)).toMatchObject(validEvent);
  });

  it("拒絕不合法日期與時間", () => {
    expect(parseEvent({ ...validEvent, date: "09/22/2026" })).toBeNull();
    expect(parseEvent({ ...validEvent, startTime: "25:00" })).toBeNull();
  });

  it("拒絕不合法的重複星期與提醒", () => {
    expect(parseEvent({ ...validEvent, repeatRule: { type: "INVALID" } })).toBeNull();
    expect(parseEvent({ ...validEvent, reminder: { offset: "CUSTOM", customMinutes: 0 } })).toBeNull();
  });

  it("限制一次匯入的活動數量", () => {
    expect(parseEventArray([validEvent])).toHaveLength(1);
    expect(parseEventArray(Array.from({ length: 2001 }, () => validEvent))).toBeNull();
  });
});
