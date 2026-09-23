# 時程 — 個人行事曆與時間管理系統

目前版本：**v1.0.0 — Production Reliability**。

## 已完成功能

- Today／Weekly Plan／Calendar 共用同一份 Event 資料
- 活動新增、編輯、刪除、完成狀態與重複規則
- 關閉網站後仍可收到的背景 Web Push 活動提醒
- 每台裝置獨立訂閱、測試通知與取消訂閱
- 重複活動提醒、IANA 時區與重複發送保護
- JSON 完整備份與經格式驗證的安全還原
- 最近 20 次提醒送達紀錄
- 全頁同步失敗警示與一鍵重試
- 需輸入確認文字的永久帳號／資料刪除
- 手機響應式介面、PWA 安裝與安全的靜態資源快取
- Google OAuth 登入（Auth.js）
- Neon PostgreSQL + Prisma 6.19
- 每位使用者只能讀寫自己的活動
- 第一次登入時將既有 LocalStorage 活動匯入 Neon
- 本機快取與待同步操作佇列

尚未完成：Google Calendar、AI 排程與統計。

## 1. 安裝

```bash
npm install
cp .env.example .env
```

請將 `.env` 的值換成自己的設定。`.env` 已被 Git 忽略，禁止提交。

## 2. Neon 環境變數

從 Neon Console 的 Connect 畫面取得兩條連線：

```text
DATABASE_URL = Pooled connection（hostname 通常包含 -pooler）
DIRECT_URL   = Direct connection（hostname 不包含 -pooler）
```

應用程式使用 `DATABASE_URL`；Prisma migration 使用 `DIRECT_URL`。

## 3. Google OAuth

在 Google Cloud Console 建立 OAuth 2.0 Client，Application type 選擇 **Web application**。

本機開發：

```text
Authorized JavaScript origin:
http://localhost:3000

Authorized redirect URI:
http://localhost:3000/api/auth/callback/google
```

Vercel 正式網址：

```text
Authorized JavaScript origin:
https://你的網域

Authorized redirect URI:
https://你的網域/api/auth/callback/google
```

將 Client ID／Secret 分別填入：

```text
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

再執行以下指令產生 `AUTH_SECRET`：

```bash
npx auth secret
```

## 4. 建立 Neon 資料表

確認 `.env` 已填好後執行一次：

```bash
npm run db:migrate:deploy
```

這會依序建立 Auth.js／Event 資料表，並加入 PushSubscription、ReminderDelivery 與活動時區欄位。

## 5. 建立 Web Push 金鑰

在專案終端機執行一次：

```bash
npm run push:keys
```

將輸出的 publicKey 與 privateKey 分別放入：

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

`VAPID_SUBJECT` 填 `mailto:你的電子郵件`。VAPID 金鑰產生後必須固定保存；任意更換會使既有裝置需要重新開啟通知。

再產生一串獨立的隨機值放入 `CRON_SECRET`。它不能與 `AUTH_SECRET` 或其他密鑰共用。

## 6. 本機驗證

```bash
npm run test
npm run build
npm run dev
```

開啟 `http://localhost:3000`，使用 Google 登入。若 Neon 帳號下尚無活動，系統會將這台瀏覽器原本的 LocalStorage 活動匯入一次。

## 7. Vercel 設定

在 Vercel Project Settings → Environment Variables 加入：

```text
DATABASE_URL
DIRECT_URL
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
CRON_SECRET
```

全部加入 Production、Preview、Development，再重新 Deploy。不要把任何實際值寫入 GitHub。

每次更新後都執行一次 `npm run db:migrate:deploy`；它只會套用尚未執行的 migration。

## 8. 設定免費提醒排程

Vercel Hobby 的 Cron 一天只能執行一次，因此本專案不放入每分鐘的 `vercel.json` 排程。可在 Upstash QStash 建立一個 Schedule：

```text
Destination: https://你的正式網域/api/cron/reminders
Method: POST
Cron: */2 * * * *
Forward header:
Authorization: Bearer 你的 CRON_SECRET
```

每兩分鐘檢查一次，最多可能比指定時間晚約兩分鐘。不要把 `CRON_SECRET` 放在網址中。

## 9. 裝置開啟通知

- Android／電腦：登入 → 設定 → 活動提醒通知 → 開啟通知。
- iPhone／iPad：先用 Safari「分享 → 加入主畫面」，從主畫面的「時程」開啟後，再到設定開啟通知。
- 每台要接收提醒的裝置都要各自開啟一次，然後按「傳送測試通知」。

## 架構重點

- `lib/events/store.tsx`：前端 Single Source of Truth、本機快取、首次匯入與待同步佇列
- `app/api/events/`：所有路由先驗證 Auth.js session，並固定以 `userId` 限制資料
- `prisma/schema.prisma`：Auth.js User／Account／Session 與 Event
- `auth.ts`：Google Provider、Prisma Adapter 與 database session
- `public/sw.js`：不快取 Next.js 導覽頁，避免部署後新舊 chunk 混用
- `app/api/push/`：登入保護的裝置訂閱與測試通知 API
- `app/api/cron/reminders/`：由外部排程呼叫、以 `CRON_SECRET` 保護的提醒工作
- `lib/notification/due.ts`：依活動時區計算剛到期的提醒
- `app/api/account/`：受登入保護的資料匯出與永久帳號刪除
- `lib/backup/format.ts`：版本化備份格式與輸入驗證
- `app/api/reminders/history/`：最近提醒送達紀錄
- `components/Sync/`：跨頁面的同步失敗提示

修改程式前請先讀 `PROJECT_SPEC.md`，並維持 Event 的 Single Source of Truth。
