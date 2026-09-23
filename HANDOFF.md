# 專案交接文件（HANDOFF.md）

給任何接手這個專案的 AI 助手看的摘要。**請先讀過同目錄下的 `PROJECT_SPEC.md`**（特別是 §19 開發原則、§20 AI 開發規則、§21 開發流程），再開始修改程式。

最後更新：2026-09-22

---

## 1. 這是什麼專案

個人行事曆與時間管理系統「時程」。核心概念：Today／週計畫／行事曆是同一份 `Event` 資料的三種視圖，**不是三套獨立資料**（見 `PROJECT_SPEC.md` §2）。

## 2. 目前的狀態

- **程式碼倉庫**：https://github.com/LCW-J/calender （分支 `main`）
- **第一個 commit**：`v0.1.0: Basic Calendar + Event CRUD + Today + Weekly Plan`
- **部署**：使用者已在 Vercel 部署過 v0.6.1；實際網址尚未記入文件
- **目前版本**：v0.8.0（Neon Cloud Sync + Google Login 程式碼完成）
- **資料庫**：Neon Postgres（AWS Singapore）。Schema 與 migration 已完成，但使用者仍需在自己的環境設定新連線字串並執行 `npm run db:migrate:deploy`。
- **登入**：Auth.js Google Provider 已完成；仍需在 Google Cloud Console 建立 OAuth Web Client 並設定正式 redirect URI。

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
- [x] Neon 為登入後的權威資料來源；LocalStorage 保留快取與待同步操作
- [x] 17 個 recurrence／notification／API input validation 單元測試（`npm run test`，全數通過）
- [x] `npm run build` 已驗證型別檢查與編譯成功
- [x] Reminder 基礎版：頁面開啟期間使用 Notification API 檢查與顯示提醒
- [x] 手機響應式版：手機使用固定底部導覽、Modal 可在小螢幕捲動並支援安全區
- [x] PWA：manifest、192/512/Apple/Maskable 圖示、Service Worker、安裝說明卡
- [x] PWA Service Worker 只快取雜湊靜態檔案，不快取 Next.js 導覽頁
- [x] Auth.js + Google OAuth + Prisma Adapter（database session）
- [x] 受保護的 Event CRUD／import／replace API，每次查詢都限制 `userId`
- [x] 首次登入自動搬移既有 LocalStorage 活動；離線操作保留待同步佇列

## 5. 還沒做的（依原訂路線圖排序）

1. **完成外部設定**——Neon 執行 migration；Google Cloud 建立 OAuth Client；Vercel 填入五個環境變數並重新部署。
2. **跨裝置驗收**——手機與電腦使用同一 Google 帳號登入，確認 CRUD、完成狀態與首次 LocalStorage 匯入。
3. **v0.9 Web Push**——手機背景推播仍需要 Push subscription、VAPID 金鑰、後端發送端與可靠排程。iOS 需要先加入主畫面才收得到背景推播。

## 6. 檔案地圖（重要的看這幾個就好）

```
types/event.ts              Event / RepeatRule / Reminder 型別定義（Single Source of Truth 的資料形狀）
lib/events/store.tsx         EventProvider — Neon 同步、本機快取、首次匯入與待同步佇列
lib/db/prisma.ts             Prisma Client 單例
lib/events/{server,validation}.ts  API 序列化與輸入驗證
auth.ts                      Auth.js Google Provider + Prisma Adapter
app/api/events/              受登入保護的 Event API
app/api/auth/                Auth.js route handlers
app/signin/                  Google 登入頁
lib/recurrence/occurs.ts     Repeat Rule 展開邏輯（occursOnDate / occurrencesOn），純函式、有單元測試
lib/date/date.ts             共用日期工具
lib/notification/index.ts    頁面開啟期間的 Reminder 計算與 Notification API 封裝
components/PWA/              Service Worker 註冊、安裝事件保存與安裝說明
app/manifest.ts              PWA manifest（名稱、啟動路由、圖示與顯示模式）
public/sw.js                 離線 App Shell／靜態資源快取
public/icons/                Android、iOS 與 maskable PWA 圖示
components/Today/            Today 視圖
components/Weekly/            週計畫視圖
components/Calendar/          行事曆視圖 + 側邊 DayPanel
components/Event/            新增/編輯 Modal（EventModal）、共用的活動列（EventRow）
app/{today,weekly,calendar,settings}/page.tsx   對應四個路由
tests/recurrence.test.ts     Repeat Rule 的單元測試
prisma/schema.prisma          User / Account / Session / VerificationToken / Event
prisma/migrations/            尚待使用者套用到 Neon 的初始 migration
```

## 7. 已知的設計限制（不是 bug，是刻意簡化）

- 編輯一個重複活動的任一次發生，改的是**整個系列**（標題、時間、重複規則），沒有做「只改這一次」的例外處理
- `CUSTOM` 重複類型目前跟 `WEEKLY` 行為完全一樣（星期選擇器），因為規格書裡 CUSTOM 的範例本身就是星期選擇
- `MONTHLY` 沒有處理月底邊界（例如錨定在 1/31，2 月沒有 31 號時那個月就不會出現，不會自動改成月底最後一天）
- 真正背景 Web Push 尚未完成；目前 Notification API 仍需頁面保持開啟
- 離線時可保留操作佇列，但完整頁面重新載入會顯示離線說明，恢復網路後再同步

## 8. 給接手的 AI 的提醒

- 修改前先讀 `PROJECT_SPEC.md`，尤其 §19 六條開發原則（不要破壞既有功能、先理解架構、別亂換框架、Event 要維持 Single Source of Truth、優先可維護性、小幅修改）
- 若需求跟 `PROJECT_SPEC.md` 衝突，先跟使用者指出衝突，不要自己決定
- 目前的開發節奏是：小幅修改 → `npm run test` / `npm run build` → git commit → 下一個功能
- 使用者偏好用**繁體中文**溝通
