import { describe, expect, it } from "vitest";
import { layoutTimeline, minuteOfDay, minuteToPixels } from "@/lib/timeline/layout";
import { EventOccurrence } from "@/types/event";

function occurrence(id: string, startTime: string, endTime: string): EventOccurrence {
  return {
    occurDate: "2026-09-23",
    isRecurring: false,
    completed: false,
    event: { id, title: id, date: "2026-09-23", startTime, endTime, timeZone: "Asia/Taipei", completed: false },
  };
}

describe("today timeline", () => {
  it("依分鐘比例定位跨時段活動", () => {
    const [item] = layoutTimeline([occurrence("a", "19:25", "22:37")]);
    expect(item.startMinute).toBe(19 * 60 + 25);
    expect(item.endMinute - item.startMinute).toBe(192);
    expect(minuteToPixels(item.endMinute - item.startMinute)).toBeCloseTo(230.4);
  });

  it("重疊活動分到不同欄", () => {
    const items = layoutTimeline([occurrence("a", "09:00", "10:00"), occurrence("b", "09:30", "10:30")]);
    expect(items.map((item) => [item.lane, item.laneCount])).toEqual([[0, 2], [1, 2]]);
  });

  it("解析整點", () => expect(minuteOfDay("23:00")).toBe(1380));
});
