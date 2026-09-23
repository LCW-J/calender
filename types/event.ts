/**
 * Event 是整個系統的 Single Source of Truth（PROJECT_SPEC.md §2.1, §19 原則4）。
 * Today / Weekly Plan / Calendar 都只是這份資料的不同「視圖」，
 * 不應該各自建立獨立的資料結構。
 */

/** 重複規則類型（PROJECT_SPEC.md §10） */
export type RepeatType = "NONE" | "DAILY" | "WEEKLY" | "CUSTOM" | "MONTHLY" | "YEARLY";

/**
 * 重複規則。
 * 不在資料庫中無限展開未來所有活動（§11）——只保存「原始 Event + Repeat Rule」，
 * 顯示時（lib/recurrence）才即時算出哪些日期會出現這個活動。
 */
export interface RepeatRule {
  type: RepeatType;
  /**
   * 星期幾重複，僅 WEEKLY / CUSTOM 使用。
   * 使用 ISO 星期索引：一=0, 二=1, 三=2, 四=3, 五=4, 六=5, 日=6。
   */
  days?: number[];
  /** 重複結束日期（選填），格式 'YYYY-MM-DD'，留空代表不設限 */
  until?: string;
}

/** 提醒設定（PROJECT_SPEC.md §12）— 型別已定義，通知邏輯屬於後續版本，MVP 暫不實作 */
export type ReminderOffset =
  | "NONE"
  | "5_MIN"
  | "10_MIN"
  | "15_MIN"
  | "30_MIN"
  | "1_HOUR"
  | "2_HOUR"
  | "1_DAY"
  | "CUSTOM";

export interface Reminder {
  offset: ReminderOffset;
  /** 當 offset === 'CUSTOM' 時，提前的分鐘數 */
  customMinutes?: number;
}

/** Event Model（PROJECT_SPEC.md §8） */
export interface EventItem {
  id: string;
  title: string;
  description?: string;
  /** 錨定日期（重複活動以此為起點），格式 'YYYY-MM-DD' */
  date: string;
  /** 'HH:MM' */
  startTime: string;
  /** 'HH:MM' */
  endTime: string;
  /** 建立活動時的 IANA 時區，例如 Asia/Taipei，供伺服器準時推播 */
  timeZone: string;
  /**
   * 非重複活動的完成狀態。
   * 重複活動請改看 completedDates（每一次發生各自獨立完成，而不是整個系列共用一個狀態）。
   */
  completed: boolean;
  color?: string;
  repeatRule?: RepeatRule | null;
  /** 重複活動每一次發生各自的完成狀態，key 為該次發生的日期 'YYYY-MM-DD' */
  completedDates?: Record<string, boolean>;
  reminder?: Reminder;
}

/**
 * Occurrence：某個 Event 在某一天「實際出現」的一次發生。
 * 這不是獨立儲存的資料，而是 lib/recurrence 依照 RepeatRule 即時算出來的視圖物件。
 */
export interface EventOccurrence {
  event: EventItem;
  /** 這一次發生落在哪一天，'YYYY-MM-DD' */
  occurDate: string;
  /** 這一次發生是否為重複活動展開出來的（用來判斷完成狀態要看 completed 還是 completedDates） */
  isRecurring: boolean;
  /** 這一次發生的完成狀態（已經處理過 completed / completedDates 的差異） */
  completed: boolean;
}

export type NewEventInput = Omit<EventItem, "id" | "completed" | "completedDates"> & {
  completed?: boolean;
};
