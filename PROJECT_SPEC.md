# 個人行事曆與時間管理系統

## Project Specification v0.1

---

## 1. 專案目的

建立一個跨裝置的個人時間管理與行程規劃系統。

核心概念不是單純的「月曆」，而是將：

1. 今日待辦（Today）
2. 每週規劃（Weekly Plan）
3. 一般行事曆（Calendar）
4. 活動完成狀態（Completion）
5. 重複活動（Recurring Events）
6. 活動提醒（Notifications）

整合成同一套資料系統。

使用者在其中任何一個介面建立、修改或完成活動後，其他介面都必須同步更新。

---

# 2. 核心設計原則

## 2.1 Single Source of Truth

所有活動只能有一個主要資料來源。

例如：

```text
Event #1024
```

這筆活動可以同時出現在：

```text
Today
Weekly Plan
Calendar
Notifications
Statistics
```

但這些頁面不能各自建立自己的活動資料。

應該由同一個 Event 資料來源提供資料。

---

## 2.2 三個主要介面必須互相同步

### Today

顯示今天需要完成的活動。

### Weekly Plan

顯示目前這一週的活動與規劃。

### Calendar

顯示完整日期與活動。

三者不是三個獨立的待辦系統。

例如：

使用者在 Calendar 建立：

```text
2026/09/15
19:00 - 20:30
複習類比電子學
```

系統應自動讓這筆活動出現在：

```text
Calendar → 9/15

Weekly Plan → 星期二

Today → 當日期為 9/15 時顯示
```

---

# 3. MVP 第一階段功能

第一版不需要一次完成所有功能。

MVP 優先完成：

* 月曆顯示
* 新增活動
* 編輯活動
* 刪除活動
* 活動完成／未完成
* Today
* Weekly Plan
* 三個介面資料同步

暫時可以不實作：

* Google Login
* 雲端同步
* Push Notification
* 複雜權限
* AI 自動排程
* 統計分析

這些功能在後續版本加入。

---

# 4. Today 首頁

使用者打開 App 後，預設進入 Today。

顯示：

```text
2026/09/12 星期六

今日行程

☐ 類比電子學
   19:00 - 20:30

☐ 英文
   20:40 - 21:10

☑ 健身
   21:30 - 22:30
```

---

## 4.1 活動排序

預設按照：

```text
開始時間 ASC
```

排列。

例如：

```text
09:00
13:00
18:00
19:30
21:00
```

---

## 4.2 今日活動

Today 只顯示：

```text
start_time / end_time
```

位於今天的活動。

---

## 4.3 已完成活動

活動完成後：

```text
☐ 活動
```

變成：

```text
☑ 活動
```

視覺上降低顯眼程度，例如：

* 降低 opacity
* 文字加刪除線
* 顏色變淡

但不要刪除活動。

使用者仍然可以看到自己今天完成了什麼。

---

# 5. Weekly Plan

Weekly Plan 用來規劃一週。

例如：

```text
2026/09/14 ～ 2026/09/20

Monday
☐ 複習電子學
☐ 跑步

Tuesday
☐ 英文
☐ 專題

Wednesday
☐ 類比 IC

Thursday
☐ 程式設計

Friday
☐ 英文

Saturday
☐ 投資研究

Sunday
☐ 整理下週計畫
```

---

## 5.1 Weekly Plan 與 Event 的關係

Weekly Plan 不應該另外建立完全不同的 Task 資料。

如果使用者在 Weekly Plan 建立：

```text
星期二
19:00 - 20:30
電子學
```

實際上應該建立一個 Event。

因此：

```text
Weekly Plan
      ↓
    Event
      ↓
Calendar
      ↓
Today
```

---

# 6. Calendar

Calendar 提供一般月曆功能。

主要功能：

* 顯示月份
* 上個月
* 下個月
* 回到今天
* 點擊日期
* 顯示該日活動
* 新增活動
* 編輯活動
* 刪除活動
* 顯示完成狀態

---

## 6.1 月曆範例

```text
        September 2026

Mon Tue Wed Thu Fri Sat Sun
     1   2   3   4   5   6
 7   8   9  10  11  12  13
14  15  16  17  18  19  20
21  22  23  24  25  26  27
28  29  30
```

日期下面可以顯示活動摘要：

```text
15

● 電子學
● 英文
```

---

# 7. Event 建立

所有活動使用統一的 Event Model。

新增活動至少包含：

```text
Title
Date
Start Time
End Time
Description
Repeat Rule
Reminder
Color
Completed
```

---

# 8. Event Model

初期可以使用 TypeScript interface：

```typescript
interface Event {
  id: string;

  title: string;

  description?: string;

  startTime: string;

  endTime: string;

  completed: boolean;

  color?: string;

  repeatRule?: RepeatRule;

  reminder?: Reminder;
}
```

---

# 9. 活動完成狀態

每一個 Event 都具有：

```text
completed: boolean
```

預設：

```text
completed = false
```

使用者點擊 checkbox：

```text
false → true
```

再次點擊：

```text
true → false
```

完成狀態必須同步到：

```text
Today
Weekly Plan
Calendar
```

---

# 10. Repeat Rule

活動可以設定重複。

第一階段支援：

```text
NONE
DAILY
WEEKLY
MONTHLY
YEARLY
CUSTOM
```

例如：

### 每天

```text
英文
20:00 - 20:30

Repeat:
DAILY
```

---

### 每週

```text
健身
19:00 - 20:00

Repeat:
WEEKLY
MONDAY
WEDNESDAY
FRIDAY
```

---

### 每月

```text
繳費
每月 1 日
```

---

### 自訂

例如：

```text
每週：

☑ Monday
☐ Tuesday
☑ Wednesday
☐ Thursday
☑ Friday
☐ Saturday
☐ Sunday
```

---

# 11. 重複活動的資料設計

不要在資料庫中無限複製所有未來活動。

應保存：

```text
原始 Event
+
Repeat Rule
```

例如：

```text
Event:

title:
英文

start:
2026/09/15 20:00

end:
2026/09/15 20:30

repeat:
WEEKLY

days:
TUESDAY
```

系統在顯示 Calendar 時，再根據 Repeat Rule 產生對應日期。

---

# 12. Reminder

每個活動可以設定提醒。

支援：

```text
NONE

5 minutes before

10 minutes before

15 minutes before

30 minutes before

1 hour before

2 hours before

1 day before

CUSTOM
```

例如：

```text
Event:

電子學
19:00 - 20:30

Reminder:
30 minutes before
```

系統應在：

```text
18:30
```

產生通知。

---

# 13. Notification

最終目標是支援：

```text
手機
平板
電腦
```

通知內容例如：

```text
🔔 即將開始

電子學

30 分鐘後開始
19:00 - 20:30
```

---

## 13.1 Notification 注意事項

Web Notification 與 Mobile Push Notification 的技術限制不同。

因此開發時不要假設：

```text
JavaScript setTimeout()
```

就能可靠完成手機背景通知。

後續正式版本應考慮：

```text
Web Push
+
Service Worker
```

或：

```text
Native Mobile Push
```

例如：

```text
Firebase Cloud Messaging
```

或其他適合的 Push Notification infrastructure。

---

# 14. 三個介面的資料關係

核心架構：

```text
                 Event
                   │
       ┌───────────┼───────────┐
       │           │           │
       ↓           ↓           ↓
     Today      Weekly       Calendar
       │           │           │
       └───────────┼───────────┘
                   ↓
              Completion
                   ↓
              Notification
```

---

# 15. 資料庫規劃

正式版本預計使用：

```text
PostgreSQL
```

主要資料表：

```text
users
events
event_recurrences
reminders
user_settings
```

初期可以先不用資料庫。

MVP 可以先使用：

```text
LocalStorage
```

或：

```text
IndexedDB
```

等核心 UI 與資料邏輯穩定後，再導入 PostgreSQL。

---

# 16. 建議技術架構

Frontend：

```text
Next.js
TypeScript
React
Tailwind CSS
```

Backend：

第一階段：

```text
Next.js Server Actions / API Routes
```

後續如果系統變大：

```text
Node.js
Express / NestJS
```

Database：

```text
PostgreSQL
```

ORM：

```text
Prisma
```

Authentication：

```text
Auth.js
```

Version Control：

```text
Git
GitHub
```

Deployment：

```text
Vercel
```

---

# 17. 建議專案結構

```text
calendar-app/
│
├── app/
│   ├── page.tsx
│   │
│   ├── today/
│   │   └── page.tsx
│   │
│   ├── weekly/
│   │   └── page.tsx
│   │
│   ├── calendar/
│   │   └── page.tsx
│   │
│   └── settings/
│       └── page.tsx
│
├── components/
│   ├── Calendar/
│   ├── Today/
│   ├── Weekly/
│   ├── Event/
│   └── Notification/
│
├── lib/
│   ├── events/
│   ├── recurrence/
│   ├── notification/
│   └── date/
│
├── types/
│   └── event.ts
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── tests/
│
├── README.md
├── package.json
├── tsconfig.json
└── .gitignore
```

---

# 18. Git 版本管理

每完成一個重要功能建立版本。

例如：

```text
v0.1.0
Basic Calendar

v0.2.0
Today

v0.3.0
Weekly Plan

v0.4.0
Event Completion

v0.5.0
Recurring Events

v0.6.0
Reminder

v0.7.0
Database

v0.8.0
Authentication

v0.9.0
Mobile / PWA

v1.0.0
Production Release
```

---

# 19. 開發原則

AI 修改程式時必須遵守：

### 原則 1

不要為了新增功能而破壞既有功能。

### 原則 2

修改前先理解現有架構。

### 原則 3

不要隨意更換 Framework。

例如專案已經使用：

```text
Next.js + TypeScript
```

不要因為某一個功能就突然改成：

```text
Vue
```

除非使用者明確要求。

### 原則 4

Event 必須維持 Single Source of Truth。

### 原則 5

新增功能時優先考慮：

```text
可維護性
可擴充性
資料一致性
型別安全
```

而不是只追求「現在可以跑」。

### 原則 6

不要一次大幅修改整個專案。

優先：

```text
小幅修改
→ 測試
→ Commit
→ 下一個功能
```

---

# 20. AI 開發規則

當使用 Claude、ChatGPT 或其他 AI 開發此專案時：

AI 必須先理解：

```text
PROJECT_SPEC.md
```

再修改程式。

每次修改前應回答：

1. 我要修改哪些檔案？
2. 為什麼需要修改？
3. 是否會影響既有功能？
4. 是否會影響 Event Model？
5. 是否需要修改資料庫 Schema？
6. 是否需要 migration？
7. 如何測試？

修改完成後應提供：

```text
修改檔案
+
修改內容
+
測試方式
+
可能的風險
```

---

# 21. 開發流程

建議：

```text
需求
 ↓
更新 PROJECT_SPEC.md
 ↓
AI 分析
 ↓
建立 Implementation Plan
 ↓
修改程式
 ↓
測試
 ↓
Git Commit
 ↓
下一個功能
```

---

# 22. 未來可能加入的功能

以下功能不是 MVP 必須功能，但架構應預留擴充能力。

### Statistics

```text
今日完成率
本週完成率
本月完成率
```

### Categories

```text
學業
工作
運動
英文
投資
生活
其他
```

### Search

搜尋：

```text
電子學
英文
健身
```

### Tags

例如：

```text
#學校
#重要
#考試
```

### Sharing

與其他使用者共享活動。

### Google Calendar Integration

與 Google Calendar 雙向同步。

### AI Assistant

例如：

```text
「幫我安排這週三小時複習電子學」
```

AI 根據現有行程尋找空閒時間。

---

# 23. 最終產品概念

最終不是單純：

```text
Calendar
```

而是：

```text
Personal Productivity System
```

核心資料：

```text
                    Event
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
     Today          Weekly         Calendar
       │              │              │
       └──────────────┼──────────────┘
                      │
                Completion
                      │
                Recurrence
                      │
                 Reminder
                      │
                Notification
                      │
                 Statistics
```

---

# 24. 第一階段開發目標

目前只實作：

```text
[ ] Calendar
[ ] Today
[ ] Weekly Plan
[ ] Create Event
[ ] Edit Event
[ ] Delete Event
[ ] Complete Event
[ ] 三者同步
```

暫時不實作：

```text
[ ] Login
[ ] Database
[ ] Push Notification
[ ] Google Calendar
[ ] AI
[ ] Statistics
```

等核心架構穩定後再逐步加入。

---

# 25. Definition of Done

一個功能只有在以下條件全部滿足時，才算完成：

```text
[ ] 功能可以正常使用
[ ] 不會破壞既有功能
[ ] Today / Weekly / Calendar 資料一致
[ ] UI 正常
[ ] Desktop 正常
[ ] Mobile responsive 正常
[ ] 沒有明顯 Console Error
[ ] 已完成基本測試
[ ] Git 已 Commit
[ ] 文件已更新
```

---

# 26. 專案目前狀態

Current Version:

```text
v0.1.0-planning
```

Status:

```text
Planning
```

Next milestone:

```text
v0.1.0
Basic Calendar + Event CRUD + Today + Weekly Plan
```

---

# 27. AI 接手專案時的基本指令

當新的 AI 接手這個專案時，先讀取：

```text
PROJECT_SPEC.md
```

然後理解：

```text
這是一個個人時間管理與行事曆系統。

核心資料單位是 Event。

Today、Weekly Plan、Calendar 都是 Event 的不同視圖，而不是三套獨立資料。

任何新增、修改、刪除或完成活動的操作，都必須維持三個介面的資料一致性。

目前優先開發 MVP，不要提前實作尚未排入當前版本的功能。

修改程式前先分析現有架構，不要直接重構整個專案。

若需求與 PROJECT_SPEC.md 衝突，先指出衝突，不要自行決定。
```

這份文件是整個專案的「最高層級需求規格」，後續功能應以此為基礎逐步擴充。
