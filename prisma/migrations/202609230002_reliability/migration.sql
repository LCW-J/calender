ALTER TABLE "ReminderDelivery"
ADD COLUMN "successCount" INTEGER NOT NULL DEFAULT 0;

-- v0.9 既有紀錄只會在至少一台裝置成功時保留，因此標示為一次成功。
UPDATE "ReminderDelivery" SET "successCount" = 1;
