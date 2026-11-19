CREATE TYPE "OfferSubmissionMethod" AS ENUM ('PLATFORM', 'EMAIL', 'IN_PERSON', 'E_DELIVERY');

ALTER TABLE "offers"
  ALTER COLUMN "bidderEmail" DROP NOT NULL,
  ADD COLUMN "submissionMethod" "OfferSubmissionMethod" NOT NULL DEFAULT 'PLATFORM',
  ADD COLUMN "enteredById" TEXT,
  ADD COLUMN "openedAt" TIMESTAMP(3),
  ADD COLUMN "openedById" TEXT,
  ADD COLUMN "entryNote" TEXT;

ALTER TABLE "offers"
  ADD CONSTRAINT "offers_enteredById_fkey"
  FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "offers_openedById_fkey"
  FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "offers_submissionMethod_idx" ON "offers"("submissionMethod");
CREATE INDEX "offers_enteredById_idx" ON "offers"("enteredById");
CREATE INDEX "offers_openedAt_idx" ON "offers"("openedAt");
CREATE INDEX "offers_openedById_idx" ON "offers"("openedById");

ALTER TABLE "email_outbox" ADD COLUMN "attachments" TEXT;
