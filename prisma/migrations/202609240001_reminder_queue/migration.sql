CREATE TABLE "ReminderSchedule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "occurDate" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReminderSchedule_eventId_occurDate_scheduledFor_key"
ON "ReminderSchedule"("eventId", "occurDate", "scheduledFor");

CREATE INDEX "ReminderSchedule_scheduledFor_idx"
ON "ReminderSchedule"("scheduledFor");

ALTER TABLE "ReminderSchedule"
ADD CONSTRAINT "ReminderSchedule_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
