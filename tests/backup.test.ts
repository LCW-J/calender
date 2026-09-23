import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "@/lib/backup/format";
import { EventItem } from "@/types/event";

function event(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "backup-event-1",
    title: "備份測試",
    description: "",
    date: "2026-09-23",
    startTime: "19:00",
    endTime: "20:00",
    timeZone: "Asia/Taipei",
    completed: false,
    completedDates: {},
    repeatRule: null,
    reminder: { offset: "10_MIN" },
    color: undefined,
    ...overrides,
  };
}

describe("calendar backup", () => {
  it("匯出的備份可以完整讀回", () => {
    const backup = createBackup([event()], new Date("2026-09-23T12:00:00.000Z"));
    expect(parseBackup(backup)).toEqual(backup);
  });

  it("拒絕未知版本，避免錯誤格式覆蓋資料", () => {
    const backup = createBackup([event()]);
    expect(parseBackup({ ...backup, schemaVersion: 999 })).toBeNull();
  });

  it("拒絕事件欄位不完整的備份", () => {
    expect(
      parseBackup({
        schemaVersion: 1,
        exportedAt: "2026-09-23T12:00:00.000Z",
        events: [{ id: "broken" }],
      })
    ).toBeNull();
  });

  it("舊備份缺少時區時採用台北時區", () => {
    const { timeZone: _timeZone, ...legacyEvent } = event();
    const parsed = parseBackup({
      schemaVersion: 1,
      exportedAt: "2026-09-23T12:00:00.000Z",
      events: [legacyEvent],
    });
    expect(parsed?.events[0].timeZone).toBe("Asia/Taipei");
  });
});
