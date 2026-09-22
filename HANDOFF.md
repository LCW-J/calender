# 專案交接文件（HANDOFF.md）

給任何接手這個專案的 AI 助手看的摘要。**請先讀過同目錄下的 `PROJECT_SPEC.md`**（特別是 §19 開發原則、§20 AI 開發規則、§21 開發流程），再開始修改程式。

最後更新：2026-09-21（依對話內容整理，非自動產生）

---

## 1. 這是什麼專案

個人行事曆與時間管理系統「時程」。核心概念：Today／週計畫／行事曆是同一份 `Event` 資料的三種視圖，**不是三套獨立資料**（見 `PROJECT_SPEC.md` §2）。

## 2. 目前的狀態

- **程式碼倉庫**：https://github.com/LCW-J/calender （分支 `main`）
- **第一個 commit**：`v0.1.0: Basic Calendar + Event CRUD + Today + Weekly Plan`
- **尚未部署上線**（還沒有 Vercel 網址）
- **資料庫**：使用者已經在 Neon 申請了一個 Postgres 專案（provider: AWS，region: Singapore / `aws-ap-southeast-1`，免費方案），**但專案程式碼還沒有接上這個資料庫**——目前仍然是 LocalStorage，`prisma/schema.prisma` 只有註解掉的佔位內容，還沒有寫真正的 model、沒有跑過 migration、也還沒有 `.env` 存連線字串。這是下一步（§7 的 v0.7）要做的事。

## 3. 技術棧

- Next.js 14.2.35（App Router）+ TypeScript + Tailwind CSS
- 沒有用外部狀態管理套件，用 React Context 自己實作 Single Source of Truth（見下方檔案地圖）
- 測試用 Vitest

## 4. 已完成的功能（對照 PROJECT_SPEC.md §24）

- [x] Calendar 月曆顯示、上月／下月／回到今天
- [x] 新增／編輯／刪除活動（Modal）
- [x] 活動完成／未完成 checkbox
- [x] Today 首頁（依開始時間排序）
- [x] Weekly Plan（一週七欄，可切換上一週／下一週）
- [x] 三個介面資料同步（都透過 `useEvents()` 讀寫同一份 `events`）
- [x] Repeat Rule：DAILY / WEEKLY / CUSTOM / MONTHLY / YEARLY，展開邏輯在渲染時即時計算，**不會**把未來活動複製進資料裡（對應 §11）
- [x] 重複活動的完成狀態逐次獨立記錄（`completedDates`），不是整個系列共用一個完成狀態
- [x] LocalStorage 持久化（key: `calendar-app:events:v1`）
- [x] 9 個 `lib/recurrence` 的單元測試（`npm run test`，全數通過）
- [x] `npm run build` 已驗證型別檢查與編譯成功

## 5. 還沒做的（依原訂路線圖排序）

1. **v0.6 Reminder（提醒）**——目前完全還沒動。基礎版（頁面開著時用瀏覽器 Notification API 跳提醒）**不需要申請任何帳號或金鑰**，純寫程式就能做。使用者對這步有點卻步，主要是誤以為要申請服務，實際上基礎版不用。
2. **v0.7 資料庫**——把 `lib/events/store.tsx` 目前讀寫 LocalStorage 的部分，改成呼叫 API／Prisma，接上使用者已經建好的 Neon Postgres（Singapore, AWS）。需要：寫 `prisma/schema.prisma` 的實際 model（參考 §15 的 `users / events / event_recurrences / reminders / user_settings`）、跑 `prisma migrate`、把連線字串放進 `.env`（`DATABASE_URL`）。
3. **v0.8 登入**——Auth.js + GitHub 或 Google OAuth（尚未申請 OAuth App）
4. **部署**——Vercel（尚未建立專案／尚未連 GitHub repo）
5. **v0.9 PWA + Web Push**——手機背景推播提醒，需要 manifest.json + Service Worker + VAPID 金鑰（金鑰是本機指令產生，不用申請外部服務），iOS 需要先加入主畫面變成 PWA 才收得到背景推播

## 6. 檔案地圖（重要的看這幾個就好）

```
types/event.ts              Event / RepeatRule / Reminder 型別定義（Single Source of Truth 的資料形狀）
lib/events/store.tsx         EventProvider — 目前是 LocalStorage 版的 Single Source of Truth，
                              之後換資料庫只需要改這個檔案內部的讀寫實作
lib/recurrence/occurs.ts     Repeat Rule 展開邏輯（occursOnDate / occurrencesOn），純函式、有單元測試
lib/date/date.ts             共用日期工具
lib/notification/index.ts    Reminder/通知的型別與空殼，邏輯還沒實作
components/Today/            Today 視圖
components/Weekly/            週計畫視圖
components/Calendar/          行事曆視圖 + 側邊 DayPanel
components/Event/            新增/編輯 Modal（EventModal）、共用的活動列（EventRow）
app/{today,weekly,calendar,settings}/page.tsx   對應四個路由
tests/recurrence.test.ts     Repeat Rule 的單元測試
prisma/schema.prisma          目前只有佔位註解，還沒寫實際 model
```

## 7. 已知的設計限制（不是 bug，是刻意簡化）

- 編輯一個重複活動的任一次發生，改的是**整個系列**（標題、時間、重複規則），沒有做「只改這一次」的例外處理
- `CUSTOM` 重複類型目前跟 `WEEKLY` 行為完全一樣（星期選擇器），因為規格書裡 CUSTOM 的範例本身就是星期選擇
- `MONTHLY` 沒有處理月底邊界（例如錨定在 1/31，2 月沒有 31 號時那個月就不會出現，不會自動改成月底最後一天）

## 8. 給接手的 AI 的提醒

- 修改前先讀 `PROJECT_SPEC.md`，尤其 §19 六條開發原則（不要破壞既有功能、先理解架構、別亂換框架、Event 要維持 Single Source of Truth、優先可維護性、小幅修改）
- 若需求跟 `PROJECT_SPEC.md` 衝突，先跟使用者指出衝突，不要自己決定
- 目前的開發節奏是：小幅修改 → `npm run test` / `npm run build` → git commit → 下一個功能
- 使用者偏好用**繁體中文**溝通
