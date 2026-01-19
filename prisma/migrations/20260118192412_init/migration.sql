-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "tool" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "rawInput" TEXT
);

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_project_idx" ON "Event"("project");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");
