# 專案交接文件（HANDOFF.md）

給任何接手這個專案的 AI 助手看的摘要。**請先讀過同目錄下的 `PROJECT_SPEC.md`**（特別是 §19 開發原則、§20 AI 開發規則、§21 開發流程），再開始修改程式。

最後更新：2026-09-23

---

## 1. 這是什麼專案

個人行事曆與時間管理系統「時程」。核心概念：Today／週計畫／行事曆是同一份 `Event` 資料的三種視圖，**不是三套獨立資料**（見 `PROJECT_SPEC.md` §2）。

## 2. 目前的狀態

- **程式碼倉庫**：https://github.com/LCW-J/calender （分支 `main`）
- **第一個 commit**：`v0.1.0: Basic Calendar + Event CRUD + Today + Weekly Plan`
- **部署**：使用者已在 Vercel 部署過 v0.6.1；實際網址尚未記入文件
- **目前版本**：v1.1.0（Today 24 小時時間軸＋獨立任務）
- **資料庫**：Neon Postgres（AWS Singapore）。v0.9 背景推播已跨裝置驗收；v1.1 需套用 Task migration。
- **登入**：Auth.js Google Provider 已完成並已跨裝置驗收。

## 3. 技術棧

- Next.js 14.2.35（App Router）+ TypeScript + Tailwind CSS
- 沒有用外部狀態管理套件，用 React Context 自己實作 Single Source of Truth（見下方檔案地圖）
- 測試用 Vitest

## 4. 已完成的功能（對照 PROJECT_SPEC.md §24）

- [x] Calendar 月曆顯示、上月／下月／回到今天
- [x] 新增／編輯／刪除活動（Modal）
- [x] 活動完成／未完成 checkbox
- [x] Today 24 小時時間軸；點選整點格新增，活動高度依開始／結束分鐘比例顯示
- [x] 獨立任務 CRUD、到期日、逾期標示與完成區；未完成前持續顯示
- [x] Task Neon 同步、本機快取與離線待同步佇列
- [x] Weekly Plan（一週七欄，可切換上一週／下一週）
- [x] 三個介面資料同步（都透過 `useEvents()` 讀寫同一份 `events`）
- [x] Repeat Rule：DAILY / WEEKLY / CUSTOM / MONTHLY / YEARLY，展開邏輯在渲染時即時計算，**不會**把未來活動複製進資料裡（對應 §11）
- [x] 重複活動的完成狀態逐次獨立記錄（`completedDates`），不是整個系列共用一個完成狀態
- [x] Neon 為登入後的權威資料來源；LocalStorage 保留快取與待同步操作
- [x] recurrence／notification／API input validation 單元測試
- [x] `npm run build` 已驗證型別檢查與編譯成功
- [x] Web Push：關閉網站後由 Service Worker 顯示活動提醒
- [x] 每台裝置獨立訂閱、取消與測試通知；失效 endpoint 自動清除
- [x] 每兩分鐘排程的 due-window 計算、活動時區與資料庫去重
- [x] 活動＋任務的版本化 JSON 備份匯出與安全還原（相容 v1 舊備份）
- [x] 最近 20 次提醒發送紀錄
- [x] 全頁同步失敗警示與重試
- [x] 永久帳號刪除（伺服器確認＋本機資料清除）
- [x] 手機響應式版：手機使用固定底部導覽、Modal 可在小螢幕捲動並支援安全區
- [x] PWA：manifest、192/512/Apple/Maskable 圖示、Service Worker、安裝說明卡
- [x] PWA Service Worker 只快取雜湊靜態檔案，不快取 Next.js 導覽頁
- [x] Auth.js + Google OAuth + Prisma Adapter（database session）
- [x] 受保護的 Event CRUD／import／replace API，每次查詢都限制 `userId`
- [x] 首次登入自動搬移既有 LocalStorage 活動；離線操作保留待同步佇列

## 5. 還沒做的（依原訂路線圖排序）

1. **完成 v1.1 外部設定**——執行 `npm run db:migrate:deploy` 建立 Task 資料表並部署。
2. **v1.1 驗收**——手機／電腦測試時間軸點選、跨時段高度、任務跨裝置同步與舊備份匯入。
3. **後續功能**——Google Calendar、AI 排程或統計分析。

## 6. 檔案地圖（重要的看這幾個就好）

```
types/event.ts              Event / RepeatRule / Reminder 型別定義（Single Source of Truth 的資料形狀）
types/task.ts               獨立 Task 資料形狀
lib/events/store.tsx         EventProvider — Neon 同步、本機快取、首次匯入與待同步佇列
lib/tasks/store.tsx          TaskProvider — Neon 同步、本機快取與待同步佇列
lib/db/prisma.ts             Prisma Client 單例
lib/events/{server,validation}.ts  API 序列化與輸入驗證
auth.ts                      Auth.js Google Provider + Prisma Adapter
app/api/events/              受登入保護的 Event API
app/api/auth/                Auth.js route handlers
app/signin/                  Google 登入頁
lib/recurrence/occurs.ts     Repeat Rule 展開邏輯（occursOnDate / occurrencesOn），純函式、有單元測試
lib/date/date.ts             共用日期工具
lib/notification/            前端提醒計算、伺服器到期判斷與 Web Push 發送
components/Notification/     裝置推播訂閱、取消與測試介面
app/api/push/                受登入保護的 Push subscription／test API
app/api/cron/reminders/      受 CRON_SECRET 保護的排程提醒 API
app/api/account/             JSON 匯出與永久帳號刪除 API
lib/backup/                  備份格式、版本與驗證
components/Sync/             全域同步錯誤提示
components/PWA/              Service Worker 註冊、安裝事件保存與安裝說明
app/manifest.ts              PWA manifest（名稱、啟動路由、圖示與顯示模式）
public/sw.js                 離線 App Shell／靜態資源快取
public/icons/                Android、iOS 與 maskable PWA 圖示
components/Today/            Today 24 小時時間軸
components/Task/             任務清單與新增／編輯 Modal
components/Weekly/            週計畫視圖
components/Calendar/          行事曆視圖 + 側邊 DayPanel
components/Event/            新增/編輯 Modal（EventModal）、共用的活動列（EventRow）
app/{today,weekly,calendar,settings}/page.tsx   對應四個路由
tests/recurrence.test.ts     Repeat Rule 的單元測試
prisma/schema.prisma          Auth、Event、Task、PushSubscription、ReminderDelivery
prisma/migrations/            v0.8 初始、v0.9 Web Push、v1.0 reliability、v1.1 Task migrations
```

## 7. 已知的設計限制（不是 bug，是刻意簡化）

- 編輯一個重複活動的任一次發生，改的是**整個系列**（標題、時間、重複規則），沒有做「只改這一次」的例外處理
- `CUSTOM` 重複類型目前跟 `WEEKLY` 行為完全一樣（星期選擇器），因為規格書裡 CUSTOM 的範例本身就是星期選擇
- `MONTHLY` 沒有處理月底邊界（例如錨定在 1/31，2 月沒有 31 號時那個月就不會出現，不會自動改成月底最後一天）
- QStash 每兩分鐘檢查一次，通知可能比設定時間晚約兩分鐘
- iOS／iPadOS 只有加入主畫面的 Web App 可以訂閱 Web Push
- 離線時可保留操作佇列，但完整頁面重新載入會顯示離線說明，恢復網路後再同步

## 8. 給接手的 AI 的提醒

- 修改前先讀 `PROJECT_SPEC.md`，尤其 §19 六條開發原則（不要破壞既有功能、先理解架構、別亂換框架、Event 要維持 Single Source of Truth、優先可維護性、小幅修改）
- 若需求跟 `PROJECT_SPEC.md` 衝突，先跟使用者指出衝突，不要自己決定
- 目前的開發節奏是：小幅修改 → `npm run test` / `npm run build` → git commit → 下一個功能
- 使用者偏好用**繁體中文**溝通
