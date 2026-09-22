import { describe, expect, it } from "vitest";
import { occursOnDate, occurrenceCompleted } from "@/lib/recurrence/occurs";
import { EventItem } from "@/types/event";

function baseEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "e1",
    title: "測試活動",
    date: "2026-09-15", // 星期二
    startTime: "19:00",
    endTime: "20:00",
    completed: false,
    completedDates: {},
    repeatRule: null,
    ...overrides,
  };
}

describe("occursOnDate", () => {
  it("不重複的活動只在錨定日期出現", () => {
    const e = baseEvent();
    expect(occursOnDate(e, "2026-09-15")).toBe(true);
    expect(occursOnDate(e, "2026-09-16")).toBe(false);
    expect(occursOnDate(e, "2026-09-14")).toBe(false);
  });

  it("DAILY 從錨定日期起每天都出現", () => {
    const e = baseEvent({ repeatRule: { type: "DAILY" } });
    expect(occursOnDate(e, "2026-09-15")).toBe(true);
    expect(occursOnDate(e, "2026-09-20")).toBe(true);
    expect(occursOnDate(e, "2026-09-14")).toBe(false); // 錨定日期之前不出現
  });

  it("WEEKLY 依指定星期出現（一=0 ... 日=6）", () => {
    // 一、三、五
    const e = baseEvent({ repeatRule: { type: "WEEKLY", days: [0, 2, 4] } });
    expect(occursOnDate(e, "2026-09-14")).toBe(false); // 一，但早於錨定日期
    expect(occursOnDate(e, "2026-09-16")).toBe(true); // 三
    expect(occursOnDate(e, "2026-09-18")).toBe(true); // 五
    expect(occursOnDate(e, "2026-09-17")).toBe(false); // 四
  });

  it("WEEKLY 沒指定 days 時預設為錨定日期的星期幾", () => {
    const e = baseEvent({ repeatRule: { type: "WEEKLY" } }); // 錨定為星期二
    expect(occursOnDate(e, "2026-09-22")).toBe(true); // 下週二
    expect(occursOnDate(e, "2026-09-21")).toBe(false); // 下週一
  });

  it("MONTHLY 每月同一天出現", () => {
    const e = baseEvent({ repeatRule: { type: "MONTHLY" } });
    expect(occursOnDate(e, "2026-10-15")).toBe(true);
    expect(occursOnDate(e, "2026-10-16")).toBe(false);
  });

  it("YEARLY 每年同一月同一天出現", () => {
    const e = baseEvent({ repeatRule: { type: "YEARLY" } });
    expect(occursOnDate(e, "2027-09-15")).toBe(true);
    expect(occursOnDate(e, "2027-09-16")).toBe(false);
  });

  it("until 之後不再出現", () => {
    const e = baseEvent({ repeatRule: { type: "DAILY", until: "2026-09-17" } });
    expect(occursOnDate(e, "2026-09-17")).toBe(true);
    expect(occursOnDate(e, "2026-09-18")).toBe(false);
  });
});

describe("occurrenceCompleted", () => {
  it("非重複活動看 completed 欄位", () => {
    const e = baseEvent({ completed: true });
    expect(occurrenceCompleted(e, "2026-09-15")).toBe(true);
  });

  it("重複活動的每一次發生各自獨立完成，不互相影響", () => {
    const e = baseEvent({
      repeatRule: { type: "DAILY" },
      completedDates: { "2026-09-15": true },
    });
    expect(occurrenceCompleted(e, "2026-09-15")).toBe(true);
    expect(occurrenceCompleted(e, "2026-09-16")).toBe(false);
  });
});
