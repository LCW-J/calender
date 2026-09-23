# 時程 — 個人行事曆與時間管理系統

目前版本：**v0.8.0 — Neon Cloud Sync + Google Login**。

## 已完成功能

- Today／Weekly Plan／Calendar 共用同一份 Event 資料
- 活動新增、編輯、刪除、完成狀態與重複規則
- 頁面開啟期間的瀏覽器通知提醒
- 手機響應式介面、PWA 安裝與安全的靜態資源快取
- Google OAuth 登入（Auth.js）
- Neon PostgreSQL + Prisma 6.19
- 每位使用者只能讀寫自己的活動
- 第一次登入時將既有 LocalStorage 活動匯入 Neon
- 本機快取與待同步操作佇列

尚未完成：手機背景 Web Push、Google Calendar、AI 排程與統計。

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

這會套用 `prisma/migrations/202609220001_init_cloud_sync/migration.sql`，建立 Auth.js 與 Event 資料表。

## 5. 本機驗證

```bash
npm run test
npm run build
npm run dev
```

開啟 `http://localhost:3000`，使用 Google 登入。若 Neon 帳號下尚無活動，系統會將這台瀏覽器原本的 LocalStorage 活動匯入一次。

## 6. Vercel 設定

在 Vercel Project Settings → Environment Variables 加入：

```text
DATABASE_URL
DIRECT_URL
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_SECRET
```

全部加入 Production、Preview、Development，再重新 Deploy。不要把任何實際值寫入 GitHub。

## 架構重點

- `lib/events/store.tsx`：前端 Single Source of Truth、本機快取、首次匯入與待同步佇列
- `app/api/events/`：所有路由先驗證 Auth.js session，並固定以 `userId` 限制資料
- `prisma/schema.prisma`：Auth.js User／Account／Session 與 Event
- `auth.ts`：Google Provider、Prisma Adapter 與 database session
- `public/sw.js`：不快取 Next.js 導覽頁，避免部署後新舊 chunk 混用

修改程式前請先讀 `PROJECT_SPEC.md`，並維持 Event 的 Single Source of Truth。
