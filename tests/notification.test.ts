import { describe, expect, it } from "vitest";
import { computePendingNotifications } from "@/lib/notification";
import { EventItem } from "@/types/event";

function baseEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "e1",
    title: "測試活動",
    date: "2026-09-22",
    startTime: "19:00",
    endTime: "20:00",
    completed: false,
    completedDates: {},
    repeatRule: null,
    ...overrides,
  };
}

describe("computePendingNotifications", () => {
  it("沒有設定提醒的活動不會產生任何待提醒項目", () => {
    const events = [baseEvent()];
    const now = new Date(2026, 8, 22, 12, 0);
    expect(computePendingNotifications(events, now)).toHaveLength(0);
  });

  it("30 分鐘前提醒：fireAt 應該是開始時間往前推 30 分鐘", () => {
    const events = [baseEvent({ reminder: { offset: "30_MIN" } })];
    const now = new Date(2026, 8, 22, 12, 0);
    const pending = computePendingNotifications(events, now);
    const item = pending.find((p) => p.occurDate === "2026-09-22");
    expect(item).toBeTruthy();
    expect(item!.fireAt.getHours()).toBe(18);
    expect(item!.fireAt.getMinutes()).toBe(30);
  });

  it("CUSTOM 分鐘數會照 customMinutes 計算", () => {
    const events = [baseEvent({ reminder: { offset: "CUSTOM", customMinutes: 90 } })];
    const now = new Date(2026, 8, 22, 12, 0);
    const pending = computePendingNotifications(events, now);
    const item = pending.find((p) => p.occurDate === "2026-09-22");
    expect(item!.fireAt.getHours()).toBe(17);
    expect(item!.fireAt.getMinutes()).toBe(30);
  });

  it("重複活動的每一次發生都各自算出提醒時間", () => {
    const events = [
      baseEvent({ repeatRule: { type: "DAILY" }, reminder: { offset: "10_MIN" } }),
    ];
    const now = new Date(2026, 8, 23, 12, 0); // 隔天
    const pending = computePendingNotifications(events, now);
    expect(pending.some((p) => p.occurDate === "2026-09-23")).toBe(true);
  });
});
