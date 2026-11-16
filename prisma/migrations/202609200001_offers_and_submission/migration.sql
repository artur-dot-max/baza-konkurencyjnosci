ALTER TABLE "announcements" ADD COLUMN "eDeliveryAddress" TEXT;

CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "bidderName" TEXT NOT NULL,
    "bidderEmail" TEXT NOT NULL,
    "bidderNip" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "announcementId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "offers_announcementId_idx" ON "offers"("announcementId");
CREATE INDEX "offers_submittedAt_idx" ON "offers"("submittedAt");

ALTER TABLE "offers" ADD CONSTRAINT "offers_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
