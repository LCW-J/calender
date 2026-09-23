import { describe, expect, it } from "vitest";
import { parseTask, parseTaskArray } from "@/lib/tasks/validation";

describe("task validation", () => {
  const valid = { id: "task-1", title: "交報告", description: "備註", dueDate: "2026-09-25", completed: false };

  it("接受完整任務", () => expect(parseTask(valid)).toEqual(valid));
  it("拒絕缺少到期日", () => expect(parseTask({ ...valid, dueDate: "" })).toBeNull());
  it("陣列中任一任務錯誤時拒絕整批資料", () => expect(parseTaskArray([valid, { id: "bad" }])).toBeNull());
});
