# 時程 — 個人行事曆與時間管理系統

依照 `PROJECT_SPEC.md` 建立的正式專案結構。目前狀態：**v0.6.1** — MVP + Reminder + Mobile PWA。

## 開始開發

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm run test    # 執行 lib/recurrence 的單元測試
npm run build   # 產出正式版本，也用來檢查型別 / 編譯錯誤
```

## 目前已完成（對照 §24 checklist）

- [x] Calendar 月曆顯示
- [x] 新增 / 編輯 / 刪除活動
- [x] 活動完成／未完成
- [x] Today
- [x] Weekly Plan
- [x] 三個介面資料同步（Today / Weekly / Calendar 都讀同一份 `events`，見 `lib/events/store.tsx`）
- [x] Repeat Rule（每天／每週／自訂星期／每月／每年），展開邏輯在 `lib/recurrence/occurs.ts`，
      **不會**在資料裡複製未來活動（§11）
- [x] 頁面開啟期間的瀏覽器通知提醒
- [x] 手機響應式介面與底部導覽
- [x] PWA manifest、圖示、Service Worker 與加入主畫面說明

## 暫時未實作（依 §3、§24，留給後續版本）

- [ ] Login / Auth.js
- [ ] PostgreSQL + Prisma（目前用 LocalStorage，見 §15）
- [ ] 手機背景 Web Push（目前提醒仍需保持頁面開啟）
- [ ] Google Calendar 雙向同步
- [ ] AI 自動排程
- [ ] Statistics

## 架構重點

- **Single Source of Truth**：`lib/events/store.tsx` 的 `EventProvider` 是唯一的活動資料來源，
  `components/Today`、`components/Weekly`、`components/Calendar` 都透過 `useEvents()` 讀寫同一份資料，
  不會各自建立獨立的 Task/Event。
- **Repeat Rule 不預先展開**：`EventItem` 只存「原始活動 + repeatRule」，實際哪幾天會出現是
  `lib/recurrence/occurs.ts` 在渲染當下即時算出來的（`occursOnDate` / `occurrencesOn`）。
- **完成狀態**：非重複活動用 `completed: boolean`；重複活動用 `completedDates: Record<日期, boolean>`，
  讓同一個重複活動的每一次發生可以各自獨立完成，不會互相牽動。
- 型別定義集中在 `types/event.ts`，之後要換成打 API / 接 Prisma，只需要改 `lib/events/store.tsx`
  內部的讀寫實作，元件端的介面不需要變動。

## 手機安裝

正式部署到 HTTPS 網址後：

- Android／桌面 Chrome：開啟「設定」頁並點擊「安裝時程」，或使用瀏覽器的安裝選單。
- iPhone／iPad：使用 Safari 開啟，點「分享」→「加入主畫面」。

目前資料仍存在各裝置的 LocalStorage；PWA 安裝不等於雲端同步。要讓手機與電腦共用資料，仍需完成 Neon + Auth.js。

## AI 接手時請先讀

修改任何程式前，先讀過根目錄的 `PROJECT_SPEC.md`（特別是 §19 開發原則與 §20 AI 開發規則），
再依 §21 的流程小幅修改、測試、commit。
